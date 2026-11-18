'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Alert, Button, Snackbar } from '@mui/material';
import { tokens } from '@/theme/tokens';

export type ToastSeverity = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  message: string;
  severity?: ToastSeverity;
  /** 例如「復原」；按下後先關閉 toast 再執行 */
  action?: { label: string; onClick: () => void };
}

interface ToastState extends ToastOptions {
  key: number;
}

type ShowToast = (opts: ToastOptions) => void;

const ToastContext = createContext<ShowToast | null>(null);

/** 右下角 toast：同時只顯示一則；有動作 6 秒、一般 4 秒、錯誤不自動關閉 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [open, setOpen] = useState(false);

  const show = useCallback<ShowToast>((opts) => {
    setToast({ ...opts, key: Date.now() + Math.random() });
    setOpen(true);
  }, []);

  const close = (_?: unknown, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  const severity = toast?.severity ?? 'success';
  const duration = severity === 'error' ? null : toast?.action ? 6000 : 4000;

  return (
    <ToastContext.Provider value={show}>
      {children}
      <Snackbar
        key={toast?.key}
        open={open}
        onClose={close}
        autoHideDuration={duration}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          data-testid="toast"
          variant="filled"
          severity={severity}
          role={severity === 'error' || severity === 'warning' ? 'alert' : 'status'}
          onClose={() => close()}
          sx={{
            alignItems: 'center',
            borderRadius: `${tokens.radius.toast}px`,
            boxShadow: tokens.shadow.toast,
            ...(severity === 'success' || severity === 'info'
              ? { backgroundColor: tokens.color.textStrong, color: '#fff' }
              : {}),
          }}
          action={
            toast?.action ? (
              <Button
                size="small"
                onClick={() => {
                  const fn = toast.action?.onClick;
                  setOpen(false);
                  fn?.();
                }}
                sx={{ color: '#93c5fd', minHeight: 32, fontWeight: 700 }}
              >
                {toast.action.label}
              </Button>
            ) : undefined
          }
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast(): ShowToast {
  const ctx = useContext(ToastContext);
  return useMemo(() => ctx ?? (() => undefined), [ctx]);
}
