'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { Add as AddIcon, Search as SearchIcon } from '@mui/icons-material';
import { restfulService } from '@/services/restful.service';
import { Restful } from '@/types/models';
import RestfulForm from '@/forms/RestfulForm';
import PageHeader from '@/components/service-list/PageHeader';
import { BatchBar, Card, ListPagination, Toolbar } from '@/components/service-list/ListParts';
import { useServiceActions } from '@/components/service-list/useServiceActions';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/DataState';
import { useToast } from '@/components/feedback/ToastProvider';
import { useServiceSummary } from '@/components/ServiceSummaryProvider';
import StatusSwitch from '@/components/StatusSwitch';
import { NotUploadedBadge } from '@/components/StatusBadge';
import { monoSx, tokens } from '@/theme/tokens';

const c = tokens.color;

const responseHref = (publishUri: string) =>
  `/response?${new URLSearchParams({ publishUri, serviceType: 'RESTFUL' }).toString()}`;

export default function RestfulPage() {
  const toast = useToast();
  const { refresh } = useServiceSummary();
  const [restfuls, setRestfuls] = useState<Restful[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Restful | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRestfuls(await restfulService.getControllers());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : '載入資料失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onStatusChanged = useCallback((publishUri: string, isActive: boolean) => {
    setRestfuls((prev) => prev?.map((r) => (r.publishUri === publishUri ? { ...r, isActive } : r)) ?? prev);
  }, []);
  const switchFn = useCallback((uri: string, active: boolean) => restfulService.switchController(uri, active), []);
  const removeFn = useCallback((uris: string[]) => restfulService.removeController(uris), []);

  const { busy, toggle, remove } = useServiceActions({
    noun: 'RESTful 服務',
    switchFn,
    removeFn,
    onStatusChanged,
    reload: load,
  });

  const all = restfuls ?? [];
  const keyword = search.trim().toLowerCase();
  const filtered = all.filter(
    (r) => !keyword || [r.publishUri, r.classPath].some((v) => (v ?? '').toLowerCase().includes(keyword)),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * rowsPerPage, (safePage + 1) * rowsPerPage);
  const selectedItems = all.filter((r) => selected.includes(r.id));
  const allOnPage = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const someOnPage = rows.some((r) => selected.includes(r.id));

  const toggleSelectPage = () => {
    const ids = rows.map((r) => r.id);
    setSelected((prev) => (allOnPage ? prev.filter((id) => !ids.includes(id)) : [...new Set([...prev, ...ids])]));
  };
  const toggleSelect = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  // RestfulForm 的 effect 依賴 onSuccess，需固定參考避免重複觸發
  const onFormSuccess = useCallback(() => {
    setFormOpen(false);
    setEditing(null);
    void load();
    refresh();
    toast({ message: '已儲存，服務目前為停用', severity: 'success' });
  }, [load, refresh, toast]);

  let body: React.ReactNode;
  if (loading && !restfuls) {
    body = <LoadingState />;
  } else if (error && !restfuls) {
    body = <ErrorState message={error} onRetry={() => void load()} />;
  } else if (all.length === 0) {
    body = (
      <EmptyState
        title="還沒有任何 RESTful 服務"
        description="上傳 JAR 並新增 RESTful 服務後，會列在這裡。"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
            新增 Restful
          </Button>
        }
      />
    );
  } else if (filtered.length === 0) {
    body = (
      <EmptyState
        testId="no-results-state"
        title="找不到符合條件的 RESTful 服務"
        description="請調整搜尋文字。"
        action={
          <Button variant="outlined" onClick={() => setSearch('')}>
            清除條件
          </Button>
        }
      />
    );
  } else {
    body = (
      <>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 860 }} aria-label="RESTful API 清單">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    size="small"
                    checked={allOnPage}
                    indeterminate={someOnPage && !allOnPage}
                    onChange={toggleSelectPage}
                    slotProps={{ input: { 'aria-label': '選取本頁全部' } }}
                  />
                </TableCell>
                <TableCell>服務</TableCell>
                <TableCell>Class 路徑</TableCell>
                <TableCell>JAR</TableCell>
                <TableCell>Mock 回應</TableCell>
                <TableCell>狀態</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r) => {
                const isSelected = selected.includes(r.id);
                const jar = r.jarFileName || r.jarFileId;
                return (
                  <TableRow
                    key={r.id}
                    data-testid={`row-${r.publishUri}`}
                    aria-selected={isSelected}
                    sx={{ backgroundColor: isSelected ? c.primarySoftRow : undefined }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={isSelected}
                        onChange={() => toggleSelect(r.id)}
                        slotProps={{ input: { 'aria-label': `選取 ${r.publishUri}` } }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        <Box component="span" sx={{ fontWeight: 600 }}>{r.publishUri}</Box>
                        <Box component="span" sx={{ ...monoSx, color: c.textSubtle }}>/{r.publishUri}</Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box component="span" sx={{ ...monoSx, color: c.textSecondary, wordBreak: 'break-all' }}>
                        {r.classPath}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {jar ? (
                        <Box component="span" sx={{ ...monoSx, color: c.textSecondary, wordBreak: 'break-all' }}>{jar}</Box>
                      ) : (
                        <NotUploadedBadge />
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Link href={responseHref(r.publishUri)}>回應清單 ›</Link>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <StatusSwitch
                        checked={r.isActive}
                        name={r.publishUri}
                        disabled={busy.has(r.publishUri)}
                        onToggle={() => void toggle(r)}
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'inline-flex', gap: 0.5 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          aria-label={`編輯 ${r.publishUri}`}
                          onClick={() => {
                            setEditing(r);
                            setFormOpen(true);
                          }}
                        >
                          編輯
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          aria-label={`刪除 ${r.publishUri}`}
                          onClick={() => void remove([r], () => setSelected((prev) => prev.filter((id) => id !== r.id)))}
                        >
                          刪除
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <ListPagination
          total={filtered.length}
          page={safePage}
          rowsPerPage={rowsPerPage}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => {
            setRowsPerPage(n);
            setPage(0);
          }}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="RESTful API"
        description="從上傳的 JAR 動態註冊的 RESTful Controller。新建或編輯後預設為停用，確認 Mock 回應後再啟用。"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
            新增 Restful
          </Button>
        }
      />

      <Card>
        <Toolbar>
          <TextField
            size="small"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="搜尋發布名稱、Class 路徑"
            slotProps={{
              htmlInput: { 'aria-label': '搜尋 RESTful 服務' },
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ flex: '1 1 260px', maxWidth: 420 }}
          />
        </Toolbar>

        <BatchBar count={selectedItems.length} onClear={() => setSelected([])}>
          <Button variant="outlined" color="error" onClick={() => void remove(selectedItems, () => setSelected([]))}>
            刪除
          </Button>
        </BatchBar>

        {body}
      </Card>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth aria-labelledby="restful-form-title">
        <DialogTitle id="restful-form-title" sx={{ fontSize: 16, fontWeight: 700 }}>
          {editing ? '編輯 Restful' : '新增 Restful'}
        </DialogTitle>
        <DialogContent>
          <RestfulForm restful={editing} onSuccess={onFormSuccess} onCancel={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
