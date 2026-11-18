'use client';

import React, { Suspense } from 'react';
import { Box } from '@mui/material';
import { tokens } from '@/theme/tokens';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

/** 全站外框：左側側欄＋頂列麵包屑。窄螢幕（< md）側欄換到內容上方 */
export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'stretch',
        backgroundColor: tokens.color.background,
        fontFamily: tokens.font.family,
      }}
    >
      <Sidebar />
      {/* 窄螢幕基準寬 100%，才會換行到側欄下方；桌面填滿側欄右側 */}
      <Box sx={{ flex: { xs: '1 1 100%', md: '999 1 0' }, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Suspense fallback={<Box sx={{ minHeight: tokens.size.topbarHeight, backgroundColor: tokens.color.surface }} />}>
          <Topbar />
        </Suspense>
        <Box
          component="main"
          sx={{
            p: { xs: '20px 16px 32px', md: '28px 32px 40px' },
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            width: '100%',
            maxWidth: tokens.size.contentMaxWidth,
            boxSizing: 'border-box',
            minWidth: 0,
          }}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
