package ai

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/firebase/genkit/go/genkit"
	"github.com/google/generative-ai-go/genai"
	"github.com/sweetfish329/sai/internal/image"
	"github.com/sweetfish329/sai/internal/sgf"
	"golang.org/x/oauth2"
	"google.golang.org/api/option"
)

type AnalyzeInput struct {
	SgfContent string `json:"sgfContent"`
	AuthToken  string `json:"authToken"`
}

type AnalyzeOutput struct {
	Result string `json:"result"`
}

// Global flow definition
var (
	Kit     *genkit.Genkit
	Analyze func(context.Context, AnalyzeInput) (AnalyzeOutput, error)
)

func init() {
	// Initialize Genkit instance.
	// Common pattern: genkit.Init(ctx, options...)
	Kit = genkit.Init(context.Background())

	flow := genkit.DefineFlow(Kit, "analyzeFlow", func(ctx context.Context, input AnalyzeInput) (AnalyzeOutput, error) {
		if input.AuthToken == "" {
			return AnalyzeOutput{}, fmt.Errorf("missing auth token")
		}

		client, err := genai.NewClient(ctx, option.WithTokenSource(oauth2.StaticTokenSource(&oauth2.Token{AccessToken: input.AuthToken})))
		if err != nil {
			return AnalyzeOutput{}, fmt.Errorf("failed to create client: %w", err)
		}
		defer client.Close()
		// ... (rest of the function body is same as before, I need to include it or cut it carefully)
		// Since replace_file_content needs the whole block for what I'm replacing...
		// I will copy the function body.

		model := client.GenerativeModel("gemini-2.5-flash")
		model.Tools = []*genai.Tool{
			{
				FunctionDeclarations: []*genai.FunctionDeclaration{
					{
						Name:        "readSgf",
						Description: "Read and parse an SGF file content to extract game information.",
						Parameters: &genai.Schema{
							Type: genai.TypeObject,
							Properties: map[string]*genai.Schema{
								"sgfContent": {
									Type:        genai.TypeString,
									Description: "The content of the SGF file to parse",
								},
							},
							Required: []string{"sgfContent"},
						},
					},
					{
						Name:        "generateBoardImage",
						Description: "Generate an image of the Go board at a specific move number from an SGF file.",
						Parameters: &genai.Schema{
							Type: genai.TypeObject,
							Properties: map[string]*genai.Schema{
								"sgfContent": {
									Type:        genai.TypeString,
									Description: "The content of the SGF file",
								},
								"moveNumber": {
									Type:        genai.TypeInteger,
									Description: "The move number to generate the image for. If omitted, generates for the last move.",
								},
							},
							Required: []string{"sgfContent"},
						},
					},
				},
			},
		}

		session := model.StartChat()
		session.History = []*genai.Content{
			{
				Role: "user",
				Parts: []genai.Part{
					genai.Text("You are Sai, a Go AI coach. You analyze SGF files and provide feedback. You can also generate images of the board to illustrate your points using the generateBoardImage tool."),
				},
			},
			{
				Role: "model",
				Parts: []genai.Part{
					genai.Text("Understood. I am Sai, ready to analyze Go games."),
				},
			},
		}

		prompt := fmt.Sprintf(`Please analyze this Go game record (SGF). Use the readSgf tool to parse it.

SGF Content:
%s

Provide a summary of the game and any advice.`, input.SgfContent)

		res, err := session.SendMessage(ctx, genai.Text(prompt))
		if err != nil {
			return AnalyzeOutput{}, fmt.Errorf("failed to send message: %w", err)
		}

		// Tool loop
		for {
			if len(res.Candidates) == 0 {
				break
			}
			cand := res.Candidates[0]
			if cand.Content == nil {
				break
			}

			var functionCalls []genai.FunctionCall
			for _, part := range cand.Content.Parts {
				if fc, ok := part.(genai.FunctionCall); ok {
					functionCalls = append(functionCalls, fc)
				}
			}

			if len(functionCalls) == 0 {
				// Final text response
				var bufString string
				for _, part := range cand.Content.Parts {
					if txt, ok := part.(genai.Text); ok {
						bufString += string(txt)
					}
				}
				return AnalyzeOutput{Result: bufString}, nil
			}

			// Execute tools
			var toolResponses []genai.Part
			for _, fc := range functionCalls {
				log.Printf("Calling tool: %s", fc.Name)
				var toolResult map[string]interface{}

				switch fc.Name {
				case "readSgf":
					// Parse args
					sgfContent, ok1 := fc.Args["sgfContent"].(string)
					if !ok1 {
						toolResult = map[string]interface{}{"error": "invalid arguments"}
					} else {
						rootNodes, err := sgf.Parse(sgfContent)
						if err != nil {
							toolResult = map[string]interface{}{"error": err.Error()}
						} else if len(rootNodes) == 0 {
							toolResult = map[string]interface{}{"error": "No game found"}
						} else {
							data := sgf.ExtractGameData(rootNodes[0])
							// Keep it concise? TS slices moves.
							// Our ExtractGameData already slices moves to 20.
							// Must convert to map[string]interface{} for GenAI SDK
							// Simple way: Marshal to JSON then Unmarshal to map
							resMap := map[string]interface{}{
								"gameInfo":   data.GameInfo,
								"movesCount": data.MovesCount,
								"moves":      data.Moves,
							}
							b, _ := json.Marshal(resMap)
							var finalMap map[string]interface{}
							json.Unmarshal(b, &finalMap)
							toolResult = finalMap
						}
					}
				case "generateBoardImage":
					sgfContent, ok1 := fc.Args["sgfContent"].(string)
					moveNumVal, ok2 := fc.Args["moveNumber"]
					moveNum := -1
					if ok2 {
						// json unmarshal number usually float64
						if f, ok := moveNumVal.(float64); ok {
							moveNum = int(f)
						}
					}

					if !ok1 {
						toolResult = map[string]interface{}{"error": "invalid arguments"}
					} else {
						imgBase64, err := image.GenerateBoardImage(sgfContent, moveNum)
						if err != nil {
							toolResult = map[string]interface{}{"error": err.Error()}
						} else {
							toolResult = map[string]interface{}{"image": imgBase64}
						}
					}
				default:
					toolResult = map[string]interface{}{"error": "unknown tool"}
				}

				// Marshal result to JSON map expected by FunctionResponse
				// Actually GenAI Go SDK expects map[string]interface{} usually.
				toolResponses = append(toolResponses, genai.FunctionResponse{
					Name:     fc.Name,
					Response: toolResult,
				})
			}

			// Send tool responses back
			res, err = session.SendMessage(ctx, toolResponses...)
			if err != nil {
				return AnalyzeOutput{}, fmt.Errorf("failed to send tool response: %w", err)
			}
		}

		return AnalyzeOutput{Result: "No response from AI"}, nil
	})

	Analyze = func(ctx context.Context, input AnalyzeInput) (AnalyzeOutput, error) {
		return flow.Run(ctx, input)
	}
}
