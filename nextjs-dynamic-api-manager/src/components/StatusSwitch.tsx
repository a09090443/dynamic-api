'use client';

import React from 'react';
import { Box, Switch } from '@mui/material';
import { tokens } from '@/theme/tokens';

interface StatusSwitchProps {
  /** 伺服器回報的狀態；不做樂觀更新 */
  checked: boolean;
  /** 用於可讀名稱「<name> 狀態」 */
  name: string;
  disabled?: boolean;
  onToggle: () => void;
  showLabel?: boolean;
}

/** 啟用／停用開關：軌道 36×20、圓鈕 16，旁邊顯示文字 */
export default function StatusSwitch({ checked, name, disabled, onToggle, showLabel = true }: StatusSwitchProps) {
  const c = tokens.color;
  return (
    <Box
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      data-testid="status-switch"
    >
      <Switch
        checked={checked}
        disabled={disabled}
        onChange={() => onToggle()}
        slotProps={{ input: { 'aria-label': `${name} 狀態` } }}
        disableRipple
        sx={{
          width: 36,
          height: 20,
          p: 0,
          '& .MuiSwitch-switchBase': {
            p: '2px',
            '&.Mui-checked': {
              transform: 'translateX(16px)',
              color: '#fff',
              '& + .MuiSwitch-track': { backgroundColor: c.success, opacity: 1 },
            },
            '&.Mui-focusVisible + .MuiSwitch-track': { outline: `2px solid ${c.primary}`, outlineOffset: 2 },
            '&.Mui-disabled + .MuiSwitch-track': { opacity: 0.5 },
          },
          '& .MuiSwitch-thumb': { width: 16, height: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.2)', color: '#fff' },
          '& .MuiSwitch-track': { borderRadius: 10, backgroundColor: c.borderInput, opacity: 1 },
        }}
      />
      {showLabel && (
        <Box component="span" sx={{ fontSize: 13, fontWeight: 600, color: checked ? c.successText : c.textMuted }}>
          {checked ? '啟用' : '停用'}
        </Box>
      )}
    </Box>
  );
}
