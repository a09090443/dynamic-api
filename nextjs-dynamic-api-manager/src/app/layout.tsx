'use client';

import React from 'react';
import Providers from '@/components/Providers';
import AppShell from '@/components/shell/AppShell';
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <title>Dynamic API 管理</title>
        <meta name="description" content="Dynamic API Mock 伺服器管理介面" />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
