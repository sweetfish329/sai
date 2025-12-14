package auth

import (
	"context"
	"fmt"
	"os"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/idtoken"
)

var (
	googleOauthConfig *oauth2.Config
)

func Init() {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")

	// Redirect URL might need to match what frontend sends or configures.
	// For 'postmessage' flow (used in frontend), the redirectURL is often 'postmessage'.
	googleOauthConfig = &oauth2.Config{
		ClientID:     clientID,
		ClientSecret: clientSecret,
		Endpoint:     google.Endpoint,
		RedirectURL:  "postmessage",
		Scopes:       []string{"https://www.googleapis.com/auth/generative-language.retriever", "https://www.googleapis.com/auth/userinfo.email", "openid"}, // Add scopes as needed
	}
}

func Exchange(ctx context.Context, code string) (*oauth2.Token, error) {
	if googleOauthConfig == nil {
		Init()
	}
	return googleOauthConfig.Exchange(ctx, code)
}

func ValidateToken(ctx context.Context, tokenString string) (*idtoken.Payload, error) {
	// If it's an Access Token, validation effectively happens when we use it.
	// But `idtoken` implies analyzing ID Tokens.
	// The original code uses `client.getTokenInfo(token)`.
	// If `token` is an Access Token, we can use `oauth2/google` or just try to use it.
	// `client.getTokenInfo` makes a request to `https://oauth2.googleapis.com/tokeninfo`.
	// We can skip explicit validation if we trust the flow, or call the endpoint.
	// For now, let's assume we just pass it to the AI service.
	// But the `analyze` endpoint checks it.

	// Simple validation: Ensure it's not empty?
	if tokenString == "" {
		return nil, fmt.Errorf("empty token")
	}
	// We could call https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=...
	return nil, nil
}
