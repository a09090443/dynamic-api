'use client';

import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Container } from '@mui/material';
import { techTheme } from '@/theme/tech';
import Header from '@/components/Header';
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <head>
        <title>Dynamic API Tech Manager</title>
        <meta name="description" content="科技風格的動態API管理系統" />
        <link
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider theme={techTheme}>
          <CssBaseline />
          <Header />
          <Container maxWidth="xl" sx={{ mt: 2, mb: 4, position: 'relative', zIndex: 1 }}>
            {children}
          </Container>
        </ThemeProvider>
      </body>
    </html>
  );
}
