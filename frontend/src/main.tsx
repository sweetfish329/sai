import { Box, CircularProgress } from "@mui/material";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

const Root = () => {
	const [clientId, setClientId] = useState<string | null>(null);

	useEffect(() => {
		fetch("/config")
			.then((res) => res.json())
			.then((data) => setClientId(data.googleClientId))
			.catch((err) => console.error("Failed to load config:", err));
	}, []);

	if (!clientId) {
		return (
			<Box
				display="flex"
				justifyContent="center"
				alignItems="center"
				minHeight="100vh"
			>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<StrictMode>
			<GoogleOAuthProvider clientId={clientId}>
				<App />
			</GoogleOAuthProvider>
		</StrictMode>
	);
};

createRoot(document.getElementById("root")!).render(<Root />);
