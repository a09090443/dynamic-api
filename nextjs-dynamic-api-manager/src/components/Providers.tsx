'use client';

import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { lightTheme } from '@/theme/light';
import { ToastProvider } from '@/components/feedback/ToastProvider';
import { ConfirmProvider } from '@/components/feedback/ConfirmProvider';
import { ServiceSummaryProvider } from '@/components/ServiceSummaryProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <ServiceSummaryProvider>
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </ServiceSummaryProvider>
    </ThemeProvider>
  );
}
