'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from '@mui/material';
import { Add as AddIcon, Build as BuildIcon, MoreHoriz as MoreIcon, Search as SearchIcon } from '@mui/icons-material';
import { endpointService } from '@/services/endpoint.service';
import { Endpoint } from '@/types/models';
import EndpointForm from '@/forms/EndpointForm';
import PageHeader from '@/components/service-list/PageHeader';
import {
  BatchBar,
  Card,
  ListPagination,
  StatCards,
  StatusFilter,
  StatusFilterValue,
  Toolbar,
} from '@/components/service-list/ListParts';
import { useServiceActions } from '@/components/service-list/useServiceActions';
import { useMockCounts, MockCount } from '@/components/service-list/useMockCounts';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/DataState';
import { useToast } from '@/components/feedback/ToastProvider';
import { useServiceSummary } from '@/components/ServiceSummaryProvider';
import StatusSwitch from '@/components/StatusSwitch';
import { NotUploadedBadge } from '@/components/StatusBadge';
import { monoSx, tokens } from '@/theme/tokens';

const c = tokens.color;

const jarLabel = (ep: Endpoint) => ep.jarFileName || ep.jarFileId || '';

const responseHref = (publishUri: string) =>
  `/response?${new URLSearchParams({ publishUri, serviceType: 'ENDPOINT' }).toString()}`;

function MockCountLink({ publishUri, count }: { publishUri: string; count?: MockCount }) {
  const label =
    !count || count.state === 'loading' ? '… ›' : count.state === 'ok' ? `${count.count} 筆 ›` : '— ›';
  const link = (
    <Link href={responseHref(publishUri)} data-testid={`mock-count-${publishUri}`} aria-label={`${publishUri} 的 Mock 回應：${label.replace(' ›', '')}`}>
      {label}
    </Link>
  );
  return count?.state === 'error' ? <Tooltip title="無法取得筆數">{link}</Tooltip> : link;
}

export default function EndpointPage() {
  const toast = useToast();
  const { refresh } = useServiceSummary();
  const [endpoints, setEndpoints] = useState<Endpoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilterValue>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<string[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Endpoint | null>(null);
  const [menu, setMenu] = useState<{ anchor: HTMLElement; endpoint: Endpoint } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await endpointService.getEndpoints();
      setEndpoints(data);
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
    setEndpoints((prev) => prev?.map((ep) => (ep.publishUri === publishUri ? { ...ep, isActive } : ep)) ?? prev);
  }, []);

  const switchFn = useCallback((uri: string, active: boolean) => endpointService.switchWebService(uri, active), []);
  const removeFn = useCallback((uris: string[]) => endpointService.removeWebService(uris), []);

  const { busy, toggle, batchSwitch, remove } = useServiceActions({
    noun: 'Endpoint',
    switchFn,
    removeFn,
    onStatusChanged,
    reload: load,
  });

  const publishUris = useMemo(() => endpoints?.map((e) => e.publishUri) ?? null, [endpoints]);
  const mockCounts = useMockCounts(publishUris, 'ENDPOINT');

  const all = endpoints ?? [];
  const stats = {
    all: all.length,
    active: all.filter((e) => e.isActive).length,
    inactive: all.filter((e) => !e.isActive).length,
    noJar: all.filter((e) => !jarLabel(e)).length,
  };

  const keyword = search.trim().toLowerCase();
  const filtered = all.filter((ep) => {
    if (filter === 'active' && !ep.isActive) return false;
    if (filter === 'inactive' && ep.isActive) return false;
    if (!keyword) return true;
    return [ep.publishUri, ep.beanName, ep.classPath].some((v) => (v ?? '').toLowerCase().includes(keyword));
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const safePage = Math.min(page, pageCount - 1);
  const rows = filtered.slice(safePage * rowsPerPage, (safePage + 1) * rowsPerPage);
  const selectedItems = all.filter((ep) => selected.includes(ep.id));

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
  const openEdit = (ep: Endpoint) => {
    setEditing(ep);
    setFormOpen(true);
  };
  // EndpointForm 的 effect 依賴 onSuccess，需固定參考避免重複觸發
  const onFormSuccess = useCallback(() => {
    setFormOpen(false);
    setEditing(null);
    void load();
    refresh();
    toast({ message: '已儲存，服務目前為停用', severity: 'success' });
  }, [load, refresh, toast]);

  const clearConditions = () => {
    setSearch('');
    setFilter('all');
    setPage(0);
  };

  let body: React.ReactNode;
  if (loading && !endpoints) {
    body = <LoadingState />;
  } else if (error && !endpoints) {
    body = <ErrorState message={error} onRetry={() => void load()} />;
  } else if (all.length === 0) {
    body = (
      <EmptyState
        title="還沒有任何 Endpoint"
        description="上傳 JAR 並新增 Endpoint 後，服務會列在這裡。"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
            新增 Endpoint
          </Button>
        }
      />
    );
  } else if (filtered.length === 0) {
    body = (
      <EmptyState
        testId="no-results-state"
        title="找不到符合條件的 Endpoint"
        description="請調整搜尋文字或狀態篩選。"
        action={
          <Button variant="outlined" onClick={clearConditions}>
            清除條件
          </Button>
        }
      />
    );
  } else {
    body = (
      <>
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 960 }} aria-label="SOAP Endpoint 清單">
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
                <TableCell>實作類別</TableCell>
                <TableCell>JAR</TableCell>
                <TableCell>Mock 回應</TableCell>
                <TableCell>狀態</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((ep) => {
                const isSelected = selected.includes(ep.id);
                const jar = jarLabel(ep);
                return (
                  <TableRow
                    key={ep.id}
                    data-testid={`row-${ep.publishUri}`}
                    aria-selected={isSelected}
                    sx={{ backgroundColor: isSelected ? c.primarySoftRow : undefined }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        size="small"
                        checked={isSelected}
                        onChange={() => toggleSelect(ep.id)}
                        slotProps={{ input: { 'aria-label': `選取 ${ep.publishUri}` } }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                        <Link href={responseHref(ep.publishUri)} style={{ fontWeight: 600 }}>
                          {ep.publishUri}
                        </Link>
                        <Box component="span" sx={{ ...monoSx, color: c.textSubtle }}>
                          /webservice/{ep.publishUri}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25, minWidth: 0 }}>
                        <span>{ep.beanName}</span>
                        <Box component="span" sx={{ ...monoSx, color: c.textSubtle, wordBreak: 'break-all' }}>
                          {ep.classPath}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {jar ? (
                        <Box component="span" sx={{ ...monoSx, color: c.textSecondary, wordBreak: 'break-all' }}>
                          {jar}
                        </Box>
                      ) : (
                        <NotUploadedBadge />
                      )}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <MockCountLink publishUri={ep.publishUri} count={mockCounts[ep.publishUri]} />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <StatusSwitch
                        checked={ep.isActive}
                        name={ep.publishUri}
                        disabled={busy.has(ep.publishUri)}
                        onToggle={() => void toggle(ep)}
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      <Box sx={{ display: 'inline-flex', gap: 0.5, alignItems: 'center' }}>
                        <Button size="small" variant="outlined" onClick={() => openEdit(ep)} aria-label={`編輯 ${ep.publishUri}`}>
                          編輯
                        </Button>
                        <IconButton
                          size="small"
                          aria-label={`${ep.publishUri} 更多操作`}
                          aria-haspopup="menu"
                          onClick={(e) => setMenu({ anchor: e.currentTarget, endpoint: ep })}
                          sx={{ width: 36, height: 36, borderRadius: '6px' }}
                        >
                          <MoreIcon fontSize="small" />
                        </IconButton>
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
        title="SOAP Endpoint"
        description="從上傳的 JAR 發布的 Web Service。新建或編輯後預設為停用，確認 Mock 回應後再啟用。"
        actions={
          <>
            <Button variant="outlined" component={Link} href="/wsdl" startIcon={<BuildIcon />}>
              WSDL 轉換
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
              新增 Endpoint
            </Button>
          </>
        }
      />

      {endpoints && (
        <StatCards
          items={[
            { label: '全部服務', value: stats.all },
            { label: '啟用中', value: stats.active, color: c.successText },
            { label: '尚未上傳 JAR', value: stats.noJar, color: c.warning },
          ]}
        />
      )}

      <Card>
        <Toolbar>
          <TextField
            size="small"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            placeholder="搜尋發布名稱、Bean、Class 路徑"
            slotProps={{
              htmlInput: { 'aria-label': '搜尋 Endpoint' },
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
          <Box sx={{ ml: { sm: 'auto' } }}>
            <StatusFilter
              value={filter}
              counts={{ all: stats.all, active: stats.active, inactive: stats.inactive }}
              onChange={(v) => {
                setFilter(v);
                setPage(0);
              }}
            />
          </Box>
        </Toolbar>

        <BatchBar count={selectedItems.length} onClear={() => setSelected([])}>
          <Button variant="outlined" onClick={() => void batchSwitch(selectedItems, true, () => setSelected([]))}>
            批次啟用
          </Button>
          <Button variant="outlined" onClick={() => void batchSwitch(selectedItems, false, () => setSelected([]))}>
            批次停用
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => void remove(selectedItems, () => setSelected([]))}
          >
            刪除
          </Button>
        </BatchBar>

        {body}
      </Card>

      <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)}>
        <MenuItem
          sx={{ color: c.dangerText }}
          onClick={() => {
            const ep = menu?.endpoint;
            setMenu(null);
            if (ep) void remove([ep], () => setSelected((prev) => prev.filter((id) => id !== ep.id)));
          }}
        >
          刪除
        </MenuItem>
      </Menu>

      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="md" fullWidth aria-labelledby="endpoint-form-title">
        <DialogTitle id="endpoint-form-title" sx={{ fontSize: 16, fontWeight: 700 }}>
          {editing ? '編輯 Endpoint' : '新增 Endpoint'}
        </DialogTitle>
        <DialogContent>
          <EndpointForm endpoint={editing} onSuccess={onFormSuccess} onCancel={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
