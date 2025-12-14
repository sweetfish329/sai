import LogoutIcon from "@mui/icons-material/Logout";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import {
	Alert,
	AppBar,
	Box,
	Button,
	CircularProgress,
	Container,
	CssBaseline,
	ThemeProvider,
	Toolbar,
	Typography,
} from "@mui/material";
import { useState } from "react";
import { AnalysisResult } from "./components/AnalysisResult";
import { Login } from "./components/Login";
import { SgfUpload } from "./components/SgfUpload";
import { theme } from "./theme";

function App() {
	const [token, setToken] = useState<string | null>(null);
	const [analysis, setAnalysis] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleLoginSuccess = (accessToken: string) => {
		setToken(accessToken);
		setError(null);
	};

	const handleLoginError = () => {
		setError("Login failed. Please try again.");
	};

	const handleLogout = () => {
		setToken(null);
		setAnalysis(null);
		setError(null);
	};

	const handleAnalyze = async (content: string) => {
		if (!content || !token) {
			setError("Please sign in and upload an SGF file to analyze games.");
			return;
		}

		setLoading(true);
		setError(null);
		setAnalysis(null);

		try {
			const response = await fetch("/analyze", {
				method: "POST",
				headers: {
					"Content-Type": "text/plain",
					Authorization: `Bearer ${token}`,
				},
				body: content,
			});

			if (!response.ok) {
				const errorText = await response.text();
				throw new Error(`Server error: ${response.status} ${errorText}`);
			}

			const data = await response.json();
			if (data.error) {
				throw new Error(data.error);
			}

			setAnalysis(data.result);
		} catch (err: any) {
			setError(err.message || "An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	const handleUpload = (content: string) => {
		handleAnalyze(content);
	};

	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<AppBar
				position="static"
				color="transparent"
				elevation={0}
				sx={{
					backdropFilter: "blur(10px)",
					borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
				}}
			>
				<Toolbar>
					<SportsEsportsIcon sx={{ mr: 2, color: "primary.main" }} />
					<Typography
						variant="h6"
						component="div"
						sx={{
							flexGrow: 1,
							fontWeight: "bold",
							background: "linear-gradient(45deg, #00e676 30%, #2979ff 90%)",
							WebkitBackgroundClip: "text",
							WebkitTextFillColor: "transparent",
						}}
					>
						Sai - Go AI Coach
					</Typography>
					{token && (
						<Button
							color="inherit"
							startIcon={<LogoutIcon />}
							onClick={handleLogout}
						>
							Sign Out
						</Button>
					)}
				</Toolbar>
			</AppBar>

			<Container maxWidth="md" sx={{ mt: 8, mb: 8 }}>
				{!token ? (
					<Login
						onLoginSuccess={handleLoginSuccess}
						onLoginError={handleLoginError}
					/>
				) : (
					<>
						<Box textAlign="center" mb={6}>
							<Typography
								variant="h3"
								component="h1"
								gutterBottom
								sx={{ fontWeight: 800 }}
							>
								Analyze Your Game
							</Typography>
							<Typography variant="h6" color="text.secondary">
								Upload your SGF file and get instant AI feedback.
							</Typography>
						</Box>

						<SgfUpload onUpload={handleUpload} />

						{loading && (
							<Box display="flex" justifyContent="center" mt={4}>
								<CircularProgress color="secondary" />
							</Box>
						)}

						{analysis && <AnalysisResult result={analysis} />}
					</>
				)}

				{error && (
					<Alert severity="error" sx={{ mt: 3 }}>
						{error}
					</Alert>
				)}
			</Container>
		</ThemeProvider>
	);
}

export default App;
