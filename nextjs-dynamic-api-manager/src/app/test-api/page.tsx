'use client';

import { useState } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';

export default function APITestPage() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testAPI = async () => {
    setLoading(true);
    setResult('載入中...');
    
    try {
      const response = await fetch('/api/dynamic-api/ws/getEndpoints', {
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`錯誤: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h1" gutterBottom>
        API 測試頁面
      </Typography>
      
      <Button 
        variant="contained" 
        onClick={testAPI}
        disabled={loading}
        sx={{ mb: 2 }}
      >
        測試 API
      </Button>
      
      <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f9fafb' }}>
        <Typography
          component="pre"
          sx={{
            color: '#1f2937',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          {result || '點擊上方按鈕測試 API'}
        </Typography>
      </Paper>
    </Box>
  );
}
