import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
	palette: {
		mode: "dark",
		primary: {
			main: "#00e676", // Vibrant green
		},
		secondary: {
			main: "#2979ff", // Bright blue
		},
		background: {
			default: "#0a1929", // Deep dark blue
			paper: "#132f4c", // Slightly lighter blue
		},
		text: {
			primary: "#ffffff",
			secondary: "#b2bac2",
		},
	},
	typography: {
		fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
		h1: {
			fontWeight: 700,
		},
		h5: {
			fontWeight: 600,
		},
	},
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: 8,
					textTransform: "none",
					fontWeight: 600,
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					borderRadius: 12,
					backgroundImage: "none",
				},
			},
		},
	},
});
