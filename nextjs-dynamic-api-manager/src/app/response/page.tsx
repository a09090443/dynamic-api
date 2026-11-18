'use client';

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Drawer,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add as AddIcon, ContentCopy as CopyIcon } from '@mui/icons-material';
import { responseService } from '@/services/response.service';
import { Response, ServiceType } from '@/types/models';
import PageHeader from '@/components/service-list/PageHeader';
import { Card } from '@/components/service-list/ListParts';
import { EmptyState, ErrorState, LoadingState } from '@/components/feedback/DataState';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useToast } from '@/components/feedback/ToastProvider';
import { useServiceSummary } from '@/components/ServiceSummaryProvider';
import StatusSwitch from '@/components/StatusSwitch';
import { ServiceTypeChip } from '@/components/StatusBadge';
import ResponseEditorPanel, { ResponseFormValues } from '@/components/response/ResponseEditorPanel';
import { serviceCallUrl } from '@/utils/serviceUrl';
import { monoSx, tokens } from '@/theme/tokens';

const c = tokens.color;

type Editor = { mode: 'new' } | { mode: 'edit'; response: Response };

const errMsg = (e: unknown) => (e instanceof Error && e.message ? e.message : '未知錯誤');

/** 沒有指定服務時的引導；不呼叫任何查詢 API */
function NoServiceGuide() {
  return (
    <>
      <PageHeader title="Mock 回應" description="呼叫時以 方法 + 條件 完全相同且啟用的那一筆回應。" />
      <Card>
        <EmptyState
          testId="no-service-guide"
          title="請先選擇服務"
          description="Mock 回應依服務管理。請從 SOAP Endpoint 或 RESTful API 清單點選服務的 Mock 回應。"
          action={
            <>
              <Button variant="outlined" component={Link} href="/endpoint">
                前往 SOAP Endpoint
              </Button>
              <Button variant="outlined" component={Link} href="/restful">
                前往 RESTful API
              </Button>
            </>
          }
        />
      </Card>
    </>
  );
}

function ServiceInfoCard({ publishUri, serviceType }: { publishUri: string; serviceType: 'ENDPOINT' | 'RESTFUL' }) {
  const toast = useToast();
  const { endpoints, controllers, connection } = useServiceSummary();
  const [url, setUrl] = useState('');
  const urlRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setUrl(serviceCallUrl(publishUri, serviceType));
  }, [publishUri, serviceType]);

  const list = serviceType === 'RESTFUL' ? controllers : endpoints;
  const service = list?.find((s) => s.publishUri === publishUri);
  let status: React.ReactNode;
  if (service) {
    status = (
      <Box component="span" sx={{ fontWeight: 600, color: service.isActive ? c.successText : c.textMuted }}>
        ● {service.isActive ? '啟用' : '停用'}
      </Box>
    );
  } else if (!list && connection === 'checking') {
    status = <Box component="span" sx={{ color: c.textSubtle }}>…</Box>;
  } else {
    status = <Box component="span" sx={{ color: c.warningText }}>找不到此服務</Box>;
  }

  const copy = async () => {
    try {
      if (!navigator.clipboard) throw new Error('unsupported');
      await navigator.clipboard.writeText(url);
      toast({ message: '已複製呼叫位址', severity: 'success' });
    } catch {
      const el = urlRef.current;
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
      toast({ message: '無法自動複製，已選取位址，請手動複製', severity: 'warning' });
    }
  };

  return (
    <Card
      data-testid="service-info"
      sx={{ p: '16px 20px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 24px' }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box component="span" sx={{ fontSize: 12, color: c.textSubtle }}>類型</Box>
        <ServiceTypeChip type={serviceType} />
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }} data-testid="service-status">
        <Box component="span" sx={{ fontSize: 12, color: c.textSubtle }}>服務狀態</Box>
        {status}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: '1 1 320px', minWidth: 0 }}>
        <Box component="span" sx={{ fontSize: 12, color: c.textSubtle, whiteSpace: 'nowrap' }}>呼叫位址</Box>
        <Box
          component="code"
          ref={urlRef}
          data-testid="call-url"
          title={url}
          sx={{
            ...monoSx,
            fontSize: 13,
            minWidth: 0,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            px: 1,
            py: 0.5,
            borderRadius: '6px',
            backgroundColor: c.surfaceSunken,
          }}
        >
          {url}
        </Box>
        <Button size="small" variant="outlined" startIcon={<CopyIcon fontSize="small" />} onClick={() => void copy()}>
          複製
        </Button>
      </Box>
    </Card>
  );
}

function ResponsePageContent() {
  const searchParams = useSearchParams();
  const publishUri = searchParams.get('publishUri') || '';
  const serviceType: 'ENDPOINT' | 'RESTFUL' = searchParams.get('serviceType') === 'RESTFUL' ? 'RESTFUL' : 'ENDPOINT';

  if (!publishUri) return <NoServiceGuide />;
  return <ResponseManager key={`${serviceType}:${publishUri}`} publishUri={publishUri} serviceType={serviceType} />;
}

function ResponseManager({ publishUri, serviceType }: { publishUri: string; serviceType: 'ENDPOINT' | 'RESTFUL' }) {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('lg'));
  const confirm = useConfirm();
  const toast = useToast();
  const [responses, setResponses] = useState<Response[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const triggerRef = useRef<HTMLElement | null>(null);
  /** 儲存請求進行中：鎖定關閉、Esc、切換列與新增，確保回應只作用在送出的那次編輯 */
  const [saving, setSaving] = useState(false);
  /** 每次開啟／關閉面板遞增；儲存回應回來時比對，過期的不關閉後來開的面板 */
  const editorSeq = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setResponses(await responseService.getResponseList({ publishUri, serviceType }));
      setError(null);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [publishUri, serviceType]);

  useEffect(() => {
    void load();
  }, [load]);

  const openEditor = (next: Editor, trigger: HTMLElement | null) => {
    if (saving) return;
    editorSeq.current += 1;
    triggerRef.current = trigger;
    setEditor(next);
  };
  const closeEditor = (force = false) => {
    if (saving && !force) return;
    editorSeq.current += 1;
    setEditor(null);
    const el = triggerRef.current;
    if (el) setTimeout(() => el.focus(), 0);
  };

  const save = async (values: ResponseFormValues) => {
    if (!editor) return;
    const seq = editorSeq.current;
    const target = editor;
    const payload = {
      publishUri,
      serviceType: serviceType as ServiceType,
      method: values.method,
      condition: values.condition ?? '',
      responseContent: values.responseContent ?? '',
      isActive: false,
    };
    setSaving(true);
    try {
      if (target.mode === 'edit') {
        await responseService.updateResponse({ ...payload, id: target.response.id });
      } else {
        await responseService.saveMockResponse(payload);
      }
    } finally {
      setSaving(false);
    }
    // 失敗時上面會丟出例外，由面板保留輸入並顯示錯誤；成功時只關閉送出它的那次編輯
    if (editorSeq.current === seq) closeEditor(true);
    toast({ message: '已儲存，此回應目前為停用', severity: 'success' });
    void load();
  };

  const remove = async (response: Response) => {
    const ok = await confirm({
      title: '刪除此回應？',
      content: `方法 ${response.method} 的這筆回應會被刪除，無法復原。`,
      confirmLabel: '刪除',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await responseService.deleteResponse([response.id]);
      closeEditor();
      toast({ message: '已刪除回應', severity: 'success' });
      void load();
    } catch (e) {
      toast({ message: `刪除失敗：${errMsg(e)}`, severity: 'error' });
    }
  };

  const applySwitch = async (id: string, method: string, target: boolean, isUndo: boolean) => {
    const verb = target ? '啟用' : '停用';
    setBusy((p) => new Set(p).add(id));
    try {
      await responseService.switchResponse(id, target);
      setResponses((prev) => prev?.map((r) => (r.id === id ? { ...r, isActive: target } : r)) ?? prev);
      if (isUndo) {
        toast({ message: `已復原：${method} 回應目前為${verb}`, severity: 'success' });
      } else {
        toast({
          message: `已${verb} ${method} 回應`,
          severity: 'success',
          action: { label: '復原', onClick: () => void applySwitch(id, method, !target, true) },
        });
      }
    } catch (e) {
      toast({ message: `無法${verb} ${method} 回應：${errMsg(e)}`, severity: 'error' });
    } finally {
      setBusy((p) => {
        const n = new Set(p);
        n.delete(id);
        return n;
      });
    }
  };

  const toggle = async (r: Response) => {
    const target = !r.isActive;
    const verb = target ? '啟用' : '停用';
    const ok = await confirm({
      title: `${verb} ${r.method} 回應？`,
      content: target
        ? '啟用後，方法與條件完全相同的呼叫會回傳這筆內容。'
        : '停用後，呼叫不會再命中這筆回應。',
      confirmLabel: verb,
      tone: 'primary',
    });
    if (!ok) return;
    await applySwitch(r.id, r.method, target, false);
  };

  const editingId = editor?.mode === 'edit' ? editor.response.id : null;

  let body: React.ReactNode;
  if (loading && !responses) {
    body = <LoadingState />;
  } else if (error && !responses) {
    body = <ErrorState message={error} onRetry={() => void load()} />;
  } else if (!responses || responses.length === 0) {
    body = (
      <EmptyState
        title="這個服務還沒有 Mock 回應"
        description="新增回應後，呼叫時會依方法與條件找出要回傳的內容。"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={(e) => openEditor({ mode: 'new' }, e.currentTarget)}>
            新增回應
          </Button>
        }
      />
    );
  } else {
    body = (
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: 640 }} aria-label="Mock 回應清單">
          <TableHead>
            <TableRow>
              <TableCell>方法</TableCell>
              <TableCell>條件</TableCell>
              <TableCell>回應內容</TableCell>
              <TableCell>狀態</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {responses.map((r) => {
              const editing = editingId === r.id;
              return (
                <TableRow
                  key={r.id}
                  hover
                  tabIndex={0}
                  aria-selected={editing}
                  aria-disabled={saving || undefined}
                  aria-label={`編輯 ${r.method} 回應`}
                  data-testid={`response-row-${r.id}`}
                  onClick={(e) => openEditor({ mode: 'edit', response: r }, e.currentTarget)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openEditor({ mode: 'edit', response: r }, e.currentTarget);
                    }
                  }}
                  sx={{
                    cursor: saving ? 'not-allowed' : 'pointer',
                    backgroundColor: editing ? c.primarySoftRow : undefined,
                    boxShadow: editing ? tokens.shadow.editingRow : undefined,
                    '&:focus-visible': { outline: `2px solid ${c.primary}`, outlineOffset: -2 },
                  }}
                >
                  <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{r.method}</TableCell>
                  <TableCell>
                    {r.condition ? (
                      <Box
                        component="code"
                        sx={{ ...monoSx, px: 0.75, py: 0.25, borderRadius: '4px', backgroundColor: c.surfaceSunken, wordBreak: 'break-all' }}
                      >
                        {r.condition}
                      </Box>
                    ) : (
                      <Box component="span" sx={{ color: c.textSubtle }}>（無條件）</Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box
                      component="span"
                      title={r.responseContent}
                      data-testid="response-content-cell"
                      sx={{
                        ...monoSx,
                        display: 'block',
                        maxWidth: 280,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        color: c.textSecondary,
                      }}
                    >
                      {r.responseContent}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    <StatusSwitch
                      checked={r.isActive}
                      name={`${r.method} 回應`}
                      disabled={busy.has(r.id)}
                      onToggle={() => void toggle(r)}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  const panel = editor && (
    <ResponseEditorPanel
      key={editor.mode === 'edit' ? editor.response.id : 'new'}
      mode={editor.mode}
      initial={
        editor.mode === 'edit'
          ? {
              method: editor.response.method,
              condition: editor.response.condition ?? '',
              responseContent: editor.response.responseContent ?? '',
            }
          : { method: '', condition: '', responseContent: '' }
      }
      locked={saving}
      onClose={() => closeEditor()}
      onSave={save}
      onDelete={editor.mode === 'edit' ? () => void remove(editor.response) : undefined}
    />
  );

  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '20px', minWidth: 0 }}>
      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <PageHeader
          title={`${publishUri} 的 Mock 回應`}
          description="呼叫時以 方法 + 條件 完全相同且啟用的那一筆回應。"
          actions={
            <Button variant="contained" startIcon={<AddIcon />} disabled={saving} onClick={(e) => openEditor({ mode: 'new' }, e.currentTarget)}>
              新增回應
            </Button>
          }
        />
        <ServiceInfoCard publishUri={publishUri} serviceType={serviceType} />
        <Card>{body}</Card>
      </Box>

      {wide ? (
        editor && (
          <Box
            component="aside"
            aria-label="回應編輯面板"
            sx={{
              flex: `0 0 ${tokens.size.drawerWidth}px`,
              width: tokens.size.drawerWidth,
              position: 'sticky',
              top: 16,
              maxHeight: 'calc(100vh - 32px)',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: `${tokens.radius.card}px`,
              boxShadow: tokens.shadow.drawer,
              overflow: 'hidden',
            }}
          >
            {panel}
          </Box>
        )
      ) : (
        <Drawer
          anchor="right"
          open={!!editor}
          onClose={() => closeEditor()}
          slotProps={{ paper: { sx: { width: `min(${tokens.size.drawerWidth}px, 100vw)`, boxShadow: tokens.shadow.drawer } } }}
        >
          {panel}
        </Drawer>
      )}
    </Box>
  );
}

export default function ResponsePage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ResponsePageContent />
    </Suspense>
  );
}
