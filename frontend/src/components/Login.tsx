import { useGoogleLogin } from '@react-oauth/google'
import { Button, Box, Typography } from '@mui/material'

interface LoginProps {
  onLoginSuccess: (token: string) => void
  onLoginError: () => void
}

export const Login = ({ onLoginSuccess, onLoginError }: LoginProps) => {
  const login = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      try {
        const response = await fetch('/auth/exchange', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code: codeResponse.code }),
        })

        if (!response.ok) {
          throw new Error('Failed to exchange code')
        }

        const tokens = await response.json()
        // Pass the access_token to the parent
        onLoginSuccess(tokens.access_token)
      } catch (error) {
        console.error('Login failed:', error)
        onLoginError()
      }
    },
    onError: () => {
      console.error('Login Failed')
      onLoginError()
    },
    flow: 'auth-code',
    scope: 'https://www.googleapis.com/auth/generative-language.retriever', // Add scopes if needed, or default
  })

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      gap={2}
    >
      <Typography variant="h4" component="h1" gutterBottom>
        Sai - Go AI Coach
      </Typography>
      <Button variant="contained" onClick={() => login()}>
        Sign in with Google
      </Button>
    </Box>
  )
}
