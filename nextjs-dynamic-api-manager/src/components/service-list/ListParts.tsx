'use client';

import React from 'react';
import { Box, Button, MenuItem, Paper, Select } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import { tokens } from '@/theme/tokens';

const c = tokens.color;

/** 白底卡片（圓角 12、1px 框線） */
export function Card({
  children,
  sx,
  as,
  ...rest
}: React.ComponentProps<typeof Paper> & { as?: 'section' | 'div' | 'aside' }) {
  return (
    <Paper
      variant="outlined"
      component={as ?? 'div'}
      sx={{ borderRadius: `${tokens.radius.card}px`, overflow: 'hidden', ...sx }}
      {...rest}
    >
      {children}
    </Paper>
  );
}

export interface StatItem {
  label: string;
  value: number;
  color?: string;
}

/** 三等分統計卡 */
export function StatCards({ items }: { items: StatItem[] }) {
  return (
    <Box
      sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}
      data-testid="stat-cards"
    >
      {items.map((item) => (
        <Card key={item.label} sx={{ p: '16px 20px', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Box component="span" sx={{ fontSize: 13, color: c.textMuted }}>{item.label}</Box>
          <Box component="span" data-testid={`stat-${item.label}`} sx={{ fontSize: 24, fontWeight: 700, color: item.color ?? c.textStrong }}>
            {item.value}
          </Box>
        </Card>
      ))}
    </Box>
  );
}

export type StatusFilterValue = 'all' | 'active' | 'inactive';

/** 分段篩選：全部／啟用／停用，單選，選中項 aria-pressed="true" */
export function StatusFilter({
  value,
  counts,
  onChange,
}: {
  value: StatusFilterValue;
  counts: Record<StatusFilterValue, number>;
  onChange: (v: StatusFilterValue) => void;
}) {
  const options: { v: StatusFilterValue; label: string }[] = [
    { v: 'all', label: '全部' },
    { v: 'active', label: '啟用' },
    { v: 'inactive', label: '停用' },
  ];
  return (
    <Box role="group" aria-label="狀態篩選" sx={{ display: 'inline-flex', p: '3px', gap: '2px', borderRadius: '8px', backgroundColor: c.surfaceSunken }}>
      {options.map((o) => {
        const pressed = value === o.v;
        return (
          <Box
            key={o.v}
            component="button"
            type="button"
            aria-pressed={pressed}
            onClick={() => onChange(o.v)}
            sx={{
              border: 0,
              cursor: 'pointer',
              font: 'inherit',
              fontSize: 13,
              fontWeight: pressed ? 600 : 500,
              minHeight: 32,
              px: 1.5,
              borderRadius: '6px',
              color: pressed ? c.textStrong : c.textMuted,
              backgroundColor: pressed ? c.surface : 'transparent',
              boxShadow: pressed ? tokens.shadow.segmentActive : 'none',
              '&:focus-visible': { outline: `2px solid ${c.primary}`, outlineOffset: 1 },
            }}
          >
            {o.label} {counts[o.v]}
          </Box>
        );
      })}
    </Box>
  );
}

/** 勾選一筆以上才顯示的批次操作列 */
export function BatchBar({ count, children, onClear }: { count: number; children: React.ReactNode; onClear: () => void }) {
  if (count === 0) return null;
  return (
    <Box
      role="region"
      aria-label="批次操作"
      data-testid="batch-bar"
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 1,
        px: '20px',
        py: 1,
        backgroundColor: c.primarySoft,
        borderTop: `1px solid ${c.primarySoftBorder}`,
        borderBottom: `1px solid ${c.primarySoftBorder}`,
        color: c.primaryHover,
        '& .MuiButton-root': {
          minHeight: tokens.size.batchButtonHeight,
          fontSize: 13,
          borderColor: c.primarySoftBorder,
          backgroundColor: c.surface,
          borderRadius: '6px',
        },
      }}
    >
      <Box component="span" sx={{ fontWeight: 600, mr: 1 }}>已選取 {count} 筆</Box>
      {children}
      <Button variant="text" onClick={onClear} sx={{ ml: 'auto', backgroundColor: 'transparent !important' }}>
        取消選取
      </Button>
    </Box>
  );
}

/** 分頁列：「顯示 a–b，共 N 筆」、每頁 10／50／100、上一頁／頁碼／下一頁 */
export function ListPagination({
  total,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
}: {
  total: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (p: number) => void;
  onRowsPerPageChange: (n: number) => void;
}) {
  const pageCount = Math.max(1, Math.ceil(total / rowsPerPage));
  const from = total === 0 ? 0 : page * rowsPerPage + 1;
  const to = Math.min(total, (page + 1) * rowsPerPage);
  const btn = {
    minWidth: 36,
    minHeight: 32,
    px: 1,
    borderRadius: '6px',
  } as const;
  return (
    <Box
      component="nav"
      aria-label="分頁"
      sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, px: '20px', py: 1.5, borderTop: `1px solid ${c.border}` }}
    >
      <Box component="span" data-testid="pagination-summary" sx={{ fontSize: 13, color: c.textMuted }}>
        顯示 {from}–{to}，共 {total} 筆
      </Box>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, fontSize: 13, color: c.textMuted }}>
        <span id="rows-per-page-label">每頁</span>
        <Select
          size="small"
          value={rowsPerPage}
          onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
          labelId="rows-per-page-label"
          sx={{ height: 32, fontSize: 13 }}
        >
          {[10, 50, 100].map((n) => (
            <MenuItem key={n} value={n}>{n}</MenuItem>
          ))}
        </Select>
      </Box>
      <Box sx={{ ml: 'auto', display: 'inline-flex', gap: 0.5 }}>
        <Button variant="outlined" size="small" sx={btn} disabled={page === 0} onClick={() => onPageChange(page - 1)} aria-label="上一頁">
          <ChevronLeft fontSize="small" />
        </Button>
        {Array.from({ length: pageCount }, (_, i) => i)
          .filter((i) => pageCount <= 7 || Math.abs(i - page) <= 2 || i === 0 || i === pageCount - 1)
          .map((i) => (
            <Button
              key={i}
              size="small"
              variant={i === page ? 'contained' : 'outlined'}
              aria-current={i === page ? 'page' : undefined}
              aria-label={`第 ${i + 1} 頁`}
              onClick={() => onPageChange(i)}
              sx={btn}
            >
              {i + 1}
            </Button>
          ))}
        <Button
          variant="outlined"
          size="small"
          sx={btn}
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
          aria-label="下一頁"
        >
          <ChevronRight fontSize="small" />
        </Button>
      </Box>
    </Box>
  );
}

/** 工具列外框（搜尋＋篩選） */
export function Toolbar({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, px: '20px', py: 2 }}>
      {children}
    </Box>
  );
}
