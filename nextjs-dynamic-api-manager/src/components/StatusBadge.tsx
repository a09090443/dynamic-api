'use client';

import React from 'react';
import { Box } from '@mui/material';
import { tokens } from '@/theme/tokens';

const c = tokens.color;

const badgeSx = {
  display: 'inline-flex',
  alignItems: 'center',
  height: tokens.size.chipHeight,
  px: 1,
  fontSize: 12,
  fontWeight: 600,
  borderRadius: `${tokens.radius.chip}px`,
  whiteSpace: 'nowrap',
} as const;

export function Badge({ children, color, bg }: { children: React.ReactNode; color: string; bg: string }) {
  return (
    <Box component="span" sx={{ ...badgeSx, color, backgroundColor: bg }}>
      {children}
    </Box>
  );
}

/** 啟用（綠）／停用（灰）徽章 */
export function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge color={c.successText} bg={c.successSoft}>啟用</Badge>
  ) : (
    <Badge color={c.textMuted} bg={c.surfaceSunken}>停用</Badge>
  );
}

/** 琥珀色「未上傳」徽章 */
export function NotUploadedBadge() {
  return <Badge color={c.warningText} bg={c.warningSoft}>未上傳</Badge>;
}

/** SOAP 紫／REST 青類型徽章 */
export function ServiceTypeChip({ type }: { type: 'ENDPOINT' | 'RESTFUL' }) {
  return type === 'RESTFUL' ? (
    <Badge color={c.restChip} bg={c.restChipBg}>REST</Badge>
  ) : (
    <Badge color={c.soapChip} bg={c.soapChipBg}>SOAP</Badge>
  );
}
