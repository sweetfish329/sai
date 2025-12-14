package sgf

import (
	"fmt"
	"strings"
)

// Node represents a node in the SGF tree.
type Node struct {
	Properties map[string][]string
	Children   []*Node
}

// Helper to get a single property value
func (n *Node) Get(key string) string {
	if vals, ok := n.Properties[key]; ok && len(vals) > 0 {
		return vals[0]
	}
	return ""
}

// Parse parses a SGF string and returns the root nodes.
// This is a simplified parser.
func Parse(content string) ([]*Node, error) {
	content = strings.TrimSpace(content)
	if content == "" {
		return nil, fmt.Errorf("empty sgf content")
	}

	var roots []*Node
	var stack []*Node
	var current *Node

	// Simple state machine
	i := 0
	length := len(content)

	for i < length {
		char := content[i]

		switch char {
		case '(':
			// Start of a variation (or game)
			// If we are currently in a node, push it to stack to attach children
			if current != nil {
				stack = append(stack, current)
			}
			i++
		case ')':
			// End of variation
			if len(stack) > 0 {
				// We traverse up specifically to the branching point.
				// However, standard SGF structure is ( ; ... ; ... )
				// The stack logic here depends on how we treat variations.
				// Usually, '(' pushes context, ')' pops it.
				// In this simplified parser, we might just handle the main line if we aren't careful.
				// Let's refine:
				// If stack has items, pop one to return to parent scope
				current = stack[len(stack)-1]
				stack = stack[:len(stack)-1]
			} else {
				// End of root variation
				current = nil
			}
			i++
		case ';':
			// New Node
			newNode := &Node{
				Properties: make(map[string][]string),
				Children:   make([]*Node, 0),
			}

			if current != nil {
				current.Children = append(current.Children, newNode)
			} else {
				// If stack is empty and current is nil, this is a root node
				roots = append(roots, newNode)
			}
			current = newNode
			i++

			// Parse properties
			for i < length {
				// Skip whitespace
				for i < length && (content[i] == ' ' || content[i] == '\n' || content[i] == '\r' || content[i] == '\t') {
					i++
				}
				if i >= length {
					break
				}

				if content[i] == ';' || content[i] == '(' || content[i] == ')' {
					break
				}

				// Property Key
				start := i
				for i < length && content[i] >= 'A' && content[i] <= 'Z' {
					i++
				}
				key := content[start:i]

				// Property Values
				var values []string
				for i < length {
					// Skip whitespace
					for i < length && (content[i] == ' ' || content[i] == '\n' || content[i] == '\r' || content[i] == '\t') {
						i++
					}

					if i < length && content[i] == '[' {
						i++ // skip '['
						valStart := i
						// Find closing ']', handling escaped characters
						for i < length {
							if content[i] == ']' && (i == 0 || content[i-1] != '\\') {
								break
							}
							i++
						}
						val := content[valStart:i]
						// Unescape
						val = strings.ReplaceAll(val, "\\]", "]")
						val = strings.ReplaceAll(val, "\\\\", "\\")
						values = append(values, val)
						i++ // skip ']'
					} else {
						break
					}
				}

				if key != "" {
					newNode.Properties[key] = values
				}
			}

		default:
			// Ignore other chars (whitespace outside nodes)
			i++
		}
	}

	return roots, nil
}

type GameInfo struct {
	BlackPlayer string `json:"blackPlayer"`
	WhitePlayer string `json:"whitePlayer"`
	Result      string `json:"result"`
	Komi        string `json:"komi"`
	Size        string `json:"size"`
	Handicap    string `json:"handicap"`
	Comment     string `json:"comment"`
}

type Move struct {
	Color   string `json:"color"`
	Move    string `json:"move"`
	Comment string `json:"comment,omitempty"`
}

type GameData struct {
	GameInfo   GameInfo `json:"gameInfo"`
	MovesCount int      `json:"movesCount"`
	Moves      []Move   `json:"moves"` // limited moves similar to TS
	AllMoves   []Move   `json:"allMoves"`
}

func ExtractGameData(rootNode *Node) GameData {
	info := GameInfo{
		BlackPlayer: rootNode.Get("PB"),
		WhitePlayer: rootNode.Get("PW"),
		Result:      rootNode.Get("RE"),
		Komi:        rootNode.Get("KM"),
		Size:        rootNode.Get("SZ"),
		Handicap:    rootNode.Get("HA"),
		Comment:     rootNode.Get("C"),
	}

	if info.BlackPlayer == "" {
		info.BlackPlayer = "Unknown"
	}
	if info.WhitePlayer == "" {
		info.WhitePlayer = "Unknown"
	}
	if info.Result == "" {
		info.Result = "Unknown"
	}
	if info.Komi == "" {
		info.Komi = "Unknown"
	}
	if info.Size == "" {
		info.Size = "Unknown"
	}
	if info.Handicap == "" {
		info.Handicap = "0"
	}

	var moves []Move

	// Traverse main line
	node := rootNode
	for len(node.Children) > 0 {
		node = node.Children[0]

		if b := node.Get("B"); b != "" {
			moves = append(moves, Move{Color: "B", Move: b, Comment: node.Get("C")})
		} else if w := node.Get("W"); w != "" {
			moves = append(moves, Move{Color: "W", Move: w, Comment: node.Get("C")})
		}
	}

	limit := 20
	if limit > len(moves) {
		limit = len(moves)
	}

	return GameData{
		GameInfo:   info,
		MovesCount: len(moves),
		Moves:      moves[:limit],
		AllMoves:   moves,
	}
}
