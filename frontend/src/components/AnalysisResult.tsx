import React from 'react'
import { Box, Typography, Paper, Divider } from '@mui/material'

interface AnalysisResultProps {
  result: string
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ result }) => {
  return (
    <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
      <Typography variant="h5" gutterBottom color="primary">
        AI Analysis Result
      </Typography>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
        <Typography variant="body1">{result}</Typography>
      </Box>
    </Paper>
  )
}
