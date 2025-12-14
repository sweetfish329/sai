import { Box, Divider, Paper, Typography } from "@mui/material";
import type React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface AnalysisResultProps {
	result: string;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ result }) => {
	return (
		<Paper elevation={3} sx={{ p: 3, mt: 3 }}>
			<Typography variant="h5" gutterBottom color="primary">
				AI Analysis Result
			</Typography>
			<Divider sx={{ mb: 2 }} />
			<Box
				sx={{
					"& h1": { fontSize: "1.5rem", fontWeight: 700, mb: 1, mt: 2 },
					"& h2": { fontSize: "1.25rem", fontWeight: 600, mb: 1, mt: 2 },
					"& h3": { fontSize: "1.1rem", fontWeight: 600, mb: 1, mt: 2 },
					"& p": { mb: 1, lineHeight: 1.6 },
					"& ul, & ol": { pl: 2, mb: 1 },
					"& li": { mb: 0.5 },
					"& code": {
						bgcolor: "action.hover",
						p: 0.5,
						borderRadius: 1,
						fontFamily: "monospace",
					},
					"& pre": {
						bgcolor: "grey.100",
						p: 2,
						borderRadius: 2,
						overflowX: "auto",
						"& code": { bgcolor: "transparent", p: 0 },
					},
				}}
			>
				<ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
			</Box>
		</Paper>
	);
};
