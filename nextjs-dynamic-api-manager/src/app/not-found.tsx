import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        textAlign: 'center',
        gap: 2,
      }}
    >
      <Typography variant="h1" component="h1" sx={{ fontSize: '6rem', fontWeight: 'bold' }}>
        404
      </Typography>
      <Typography variant="h4" component="h2" sx={{ mb: 2 }}>
        頁面不存在
      </Typography>
      <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary' }}>
        抱歉，您訪問的頁面不存在或已被移除。
      </Typography>
      <Button
        component={Link}
        href="/"
        variant="contained"
        size="large"
      >
        返回首頁
      </Button>
    </Box>
  );
}