'use client';

import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { techTheme } from '@/theme/tech';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={techTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
