'use client';

import React from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { ErrorOutline as ErrorIcon, Inbox as InboxIcon } from '@mui/icons-material';
import { tokens } from '@/theme/tokens';

const wrap = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 1,
  py: 6,
  px: 2,
  textAlign: 'center',
} as const;

export function LoadingState({ label = '載入中…' }: { label?: string }) {
  return (
    <Box sx={wrap} aria-busy="true" role="status" data-testid="loading-state">
      <CircularProgress size={28} aria-hidden />
      <Typography sx={{ color: tokens.color.textMuted }}>{label}</Typography>
    </Box>
  );
}

export function EmptyState({
  title,
  description,
  action,
  testId = 'empty-state',
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  testId?: string;
}) {
  return (
    <Box sx={wrap} data-testid={testId}>
      <InboxIcon sx={{ fontSize: 36, color: tokens.color.textDisabled }} aria-hidden />
      <Typography sx={{ fontWeight: 600, color: tokens.color.textStrong }}>{title}</Typography>
      {description && <Typography sx={{ color: tokens.color.textMuted, fontSize: 13 }}>{description}</Typography>}
      {action && <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>{action}</Box>}
    </Box>
  );
}

export function ErrorState({
  title = '資料載入失敗',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <Box sx={wrap} role="alert" data-testid="error-state">
      <ErrorIcon sx={{ fontSize: 36, color: tokens.color.danger }} aria-hidden />
      <Typography sx={{ fontWeight: 600, color: tokens.color.textStrong }}>{title}</Typography>
      {message && <Typography sx={{ color: tokens.color.textMuted, fontSize: 13 }}>{message}</Typography>}
      {onRetry && (
        <Button variant="outlined" onClick={onRetry} sx={{ mt: 1 }}>
          重新載入
        </Button>
      )}
    </Box>
  );
}
