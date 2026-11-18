'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { tokens } from '@/theme/tokens';

/** 頁首：標題＋說明＋右側動作 */
export default function PageHeader({
  title,
  description,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 2 }}>
      <Box sx={{ flex: '1 1 320px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography variant="h1" sx={{ wordBreak: 'break-word' }}>{title}</Typography>
        {description && <Typography sx={{ color: tokens.color.textMuted, fontSize: 14 }}>{description}</Typography>}
      </Box>
      {actions && <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>{actions}</Box>}
    </Box>
  );
}
