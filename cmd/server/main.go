package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"

	"github.com/joho/godotenv"
	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
	"github.com/sweetfish329/sai/internal/ai"
	"github.com/sweetfish329/sai/internal/auth"
)

type ExchangeRequest struct {
	Code string `json:"code"`
}

func main() {
	if err := godotenv.Load(); err != nil {
		fmt.Println("No .env file found or error loading it (ignore if in production)")
	}

	auth.Init()

	e := EchoServer()

	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	e.Logger.Fatal(e.Start(":" + port))
}

func EchoServer() *echo.Echo {
	e := echo.New()

	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	// Static Assets
	e.Static("/assets", "frontend/dist/assets")
	e.File("/vite.svg", "frontend/dist/vite.svg")

	e.GET("/config", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{
			"googleClientId": os.Getenv("GOOGLE_CLIENT_ID"),
		})
	})

	e.POST("/auth/exchange", func(c echo.Context) error {
		var req ExchangeRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Invalid request"})
		}
		if req.Code == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Missing code"})
		}

		token, err := auth.Exchange(c.Request().Context(), req.Code)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		// Map oauth2.Token to JSON response matching frontend expectation
		// Frontend expects { tokens: ... } or just tokens?
		// Hono code: `return c.json(tokens)`. `client.getToken(code)` returns object with `tokens`.
		// oauth2.Token is strict struct.
		// Google library returns raw token?
		// Note: `token` struct fields are AccessToken, TokenType, RefreshToken, Expiry.
		// We can return it directly as JSON.
		return c.JSON(http.StatusOK, token)
	})

	e.POST("/analyze", func(c echo.Context) error {
		authHeader := c.Request().Header.Get("Authorization")
		if authHeader == "" {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Missing Authorization header"})
		}
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return c.JSON(http.StatusUnauthorized, map[string]string{"error": "Invalid Authorization header"})
		}
		token := parts[1]

		// Optional: Validate token here using auth.ValidateToken(ctx, token)
		// but since we pass it to GenAI which checks it, we might skip.

		bodyBytes, err := io.ReadAll(c.Request().Body) // Body is SGF text according to TS code
		// TS: `const body = await c.req.text()`
		if err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Failed to read body"})
		}
		sgfContent := string(bodyBytes)
		if sgfContent == "" {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "Empty body"})
		}

		// Run Genkit Flow
		output, err := ai.Analyze(c.Request().Context(), ai.AnalyzeInput{
			SgfContent: sgfContent,
			AuthToken:  token,
		})

		if err != nil {
			e.Logger.Errorf("AI Error: %v", err)
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		return c.JSON(http.StatusOK, map[string]string{"result": output.Result})
	})

	// SPA Fallback
	e.GET("/*", func(c echo.Context) error {
		return c.File("frontend/dist/index.html")
	})

	return e
}
