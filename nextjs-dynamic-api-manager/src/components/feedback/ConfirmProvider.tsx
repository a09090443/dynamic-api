'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { tokens } from '@/theme/tokens';

export interface ConfirmOptions {
  title: string;
  content?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
}

type Confirm = (opts: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

/** 自訂確認框：取代 window.confirm。danger 時預設焦點在「取消」，Esc 等於取消 */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);

  const confirm = useCallback<Confirm>((o) => {
    return new Promise<boolean>((resolve) => {
      resolver.current?.(false);
      resolver.current = resolve;
      setOpts(o);
    });
  }, []);

  const finish = (value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
    setOpts(null);
  };

  const danger = opts?.tone === 'danger';

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={!!opts}
        onClose={() => finish(false)}
        aria-labelledby="confirm-dialog-title"
        maxWidth="xs"
        fullWidth
      >
        {opts && (
          <>
            <DialogTitle id="confirm-dialog-title" sx={{ fontSize: 16, fontWeight: 700, color: tokens.color.textStrong }}>
              {opts.title}
            </DialogTitle>
            {opts.content && (
              <DialogContent sx={{ color: tokens.color.textMuted, fontSize: 14 }}>
                <Box>{opts.content}</Box>
              </DialogContent>
            )}
            <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
              <Button
                variant="outlined"
                autoFocus={danger}
                onClick={() => finish(false)}
                sx={{ minHeight: 36 }}
              >
                {opts.cancelLabel ?? '取消'}
              </Button>
              <Button
                variant="contained"
                color={danger ? 'error' : 'primary'}
                autoFocus={!danger}
                onClick={() => finish(true)}
                sx={{ minHeight: 36 }}
              >
                {opts.confirmLabel ?? '確定'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): Confirm {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm 必須在 ConfirmProvider 內使用');
  }
  return ctx;
}
