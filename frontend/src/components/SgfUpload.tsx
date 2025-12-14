import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { Box, Button, Paper, Typography } from "@mui/material";
import type React from "react";
import { useCallback } from "react";

interface SgfUploadProps {
	onUpload: (content: string) => void;
}

export const SgfUpload: React.FC<SgfUploadProps> = ({ onUpload }) => {
	const readFile = useCallback(
		(file: File) => {
			const reader = new FileReader();
			reader.onload = (e) => {
				const content = e.target?.result as string;
				onUpload(content);
			};
			reader.readAsText(file);
		},
		[onUpload],
	);

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			readFile(file);
		}
	};

	const handleDrop = useCallback(
		(event: React.DragEvent<HTMLDivElement>) => {
			event.preventDefault();
			const file = event.dataTransfer.files?.[0];
			if (file) {
				readFile(file);
			}
		},
		[readFile],
	);

	const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
		event.preventDefault();
	};

	return (
		<Paper
			variant="outlined"
			sx={{
				p: 4,
				textAlign: "center",
				cursor: "pointer",
				borderStyle: "dashed",
				borderColor: "primary.main",
				bgcolor: "background.default",
				"&:hover": {
					bgcolor: "action.hover",
				},
			}}
			onDrop={handleDrop}
			onDragOver={handleDragOver}
		>
			<input
				accept=".sgf"
				style={{ display: "none" }}
				id="raised-button-file"
				type="file"
				onChange={handleFileChange}
			/>
			<label htmlFor="raised-button-file">
				<Box display="flex" flexDirection="column" alignItems="center" gap={2}>
					<CloudUploadIcon sx={{ fontSize: 60, color: "primary.main" }} />
					<Typography variant="h6" component="span">
						Drag & Drop SGF file here or Click to Upload
					</Typography>
					<Button variant="contained" component="span">
						Select File
					</Button>
				</Box>
			</label>
		</Paper>
	);
};
