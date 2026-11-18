'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Box, Button } from '@mui/material';
import { tokens } from '@/theme/tokens';
import { useServiceSummary } from '@/components/ServiceSummaryProvider';
import { apiHost } from '@/utils/serviceUrl';
import { breadcrumbsFor } from './navigation';

const c = tokens.color;

export default function Topbar() {
  const pathname = usePathname() || '/';
  const searchParams = useSearchParams();
  const crumbs = breadcrumbsFor(pathname, new URLSearchParams(searchParams?.toString() ?? ''));
  const { connection, refresh } = useServiceSummary();
  const [host, setHost] = useState('');

  useEffect(() => {
    setHost(apiHost());
  }, []);

  const dot = connection === 'ok' ? c.success : connection === 'error' ? c.danger : c.textDisabled;
  const text = connection === 'ok' ? '後端連線正常' : connection === 'error' ? '後端連線異常' : '檢查連線中';

  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '12px',
        minHeight: tokens.size.topbarHeight,
        px: { xs: 2, md: 4 },
        py: { xs: 1, md: 0 },
        boxSizing: 'border-box',
        backgroundColor: c.surface,
        borderBottom: `1px solid ${c.border}`,
      }}
    >
      <Box component="nav" aria-label="麵包屑" sx={{ fontSize: 13, color: c.textSubtle, minWidth: 0 }}>
        <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {crumbs.map((crumb, i) => {
            const last = i === crumbs.length - 1;
            return (
              <Box component="li" key={`${crumb.label}-${i}`} sx={{ display: 'inline-flex', gap: '6px', minWidth: 0 }}>
                {crumb.href ? (
                  <Link href={crumb.href}>{crumb.label}</Link>
                ) : last ? (
                  <Box component="strong" aria-current="page" sx={{ color: c.text, fontWeight: 600, wordBreak: 'break-all' }}>
                    {crumb.label}
                  </Box>
                ) : (
                  <span>{crumb.label}</span>
                )}
                {!last && <span aria-hidden>/</span>}
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box
        aria-live="polite"
        data-testid="connection-status"
        data-status={connection}
        sx={{ ml: 'auto', display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: 13, color: c.textMuted }}
      >
        <Box component="span" aria-hidden sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: dot }} />
        <span>
          {text}
          {host && ` · ${host}`}
        </span>
        {connection === 'error' && (
          <Button size="small" variant="text" onClick={refresh} sx={{ minHeight: 28, ml: 0.5 }}>
            重新檢查
          </Button>
        )}
      </Box>
    </Box>
  );
}
