'use client';

import React, { useCallback, useState } from 'react';
import { Box } from '@mui/material';
import { useConfirm } from '@/components/feedback/ConfirmProvider';
import { useToast } from '@/components/feedback/ToastProvider';
import { useServiceSummary } from '@/components/ServiceSummaryProvider';
import { tokens } from '@/theme/tokens';

interface ServiceLike {
  publishUri: string;
  isActive: boolean;
}

interface Options {
  /** 畫面上的名詞，例如「Endpoint」「RESTful 服務」 */
  noun: string;
  switchFn: (publishUri: string, isActive: boolean) => Promise<unknown>;
  removeFn: (publishUris: string[]) => Promise<unknown>;
  /** 單筆狀態變更成功後更新本地清單 */
  onStatusChanged: (publishUri: string, isActive: boolean) => void;
  /** 批次或刪除後重新載入清單 */
  reload: () => void;
}

const errMsg = (e: unknown) => (e instanceof Error && e.message ? e.message : '未知錯誤');

export const NameList = ({ names }: { names: string[] }) => (
  <Box
    component="ul"
    data-testid="confirm-names"
    sx={{
      m: '8px 0 0',
      p: '8px 12px 8px 28px',
      maxHeight: 160,
      overflowY: 'auto',
      fontFamily: tokens.font.mono,
      fontSize: 13,
      color: tokens.color.text,
      backgroundColor: tokens.color.surfaceMuted,
      border: `1px solid ${tokens.color.border}`,
      borderRadius: '8px',
    }}
  >
    {names.map((n) => (
      <li key={n}>{n}</li>
    ))}
  </Box>
);

/**
 * Endpoint 與 RESTful 清單共用的啟停、批次啟停與刪除流程。
 * 啟停先確認、成功後 toast＋「復原」（反向呼叫一次，不再確認）；批次與刪除不提供復原。
 */
export function useServiceActions({ noun, switchFn, removeFn, onStatusChanged, reload }: Options) {
  const confirm = useConfirm();
  const toast = useToast();
  const { refresh } = useServiceSummary();
  const [busy, setBusy] = useState<Set<string>>(new Set());

  const mark = (name: string, on: boolean) =>
    setBusy((prev) => {
      const next = new Set(prev);
      if (on) next.add(name);
      else next.delete(name);
      return next;
    });

  const applySwitch = useCallback(
    async (name: string, target: boolean, isUndo: boolean) => {
      const verb = target ? '啟用' : '停用';
      mark(name, true);
      try {
        await switchFn(name, target);
        onStatusChanged(name, target);
        refresh();
        if (isUndo) {
          toast({ message: `已復原：${name} 目前為${verb}`, severity: 'success' });
        } else {
          toast({
            message: `已${verb} ${name}`,
            severity: 'success',
            action: { label: '復原', onClick: () => void applySwitch(name, !target, true) },
          });
        }
      } catch (e) {
        toast({ message: `無法${verb} ${name}：${errMsg(e)}`, severity: 'error' });
      } finally {
        mark(name, false);
      }
    },
    [switchFn, onStatusChanged, refresh, toast],
  );

  const toggle = async (item: ServiceLike) => {
    const target = !item.isActive;
    const verb = target ? '啟用' : '停用';
    const ok = await confirm({
      title: `${verb} ${item.publishUri}？`,
      content: target
        ? '啟用後會依目前的 JAR 發布服務，呼叫端即可存取。'
        : '停用後服務會停止接受呼叫，設定與 Mock 回應會保留。',
      confirmLabel: verb,
      tone: 'primary',
    });
    if (!ok) return;
    await applySwitch(item.publishUri, target, false);
  };

  const batchSwitch = async (items: ServiceLike[], target: boolean, onDone: () => void) => {
    const verb = target ? '啟用' : '停用';
    const names = items.map((i) => i.publishUri);
    const ok = await confirm({
      title: `批次${verb} ${names.length} 個 ${noun}？`,
      content: (
        <>
          會依序逐筆{verb}下列服務，已是{verb}狀態的會略過。
          <NameList names={names} />
        </>
      ),
      confirmLabel: `${verb} ${names.length} 個`,
      tone: 'primary',
    });
    if (!ok) return;
    const succeeded: string[] = [];
    const failed: string[] = [];
    let skipped = 0;
    for (const item of items) {
      if (item.isActive === target) {
        skipped++;
        continue;
      }
      mark(item.publishUri, true);
      try {
        // 依序呼叫，避免動態發布互相干擾
        await switchFn(item.publishUri, target);
        succeeded.push(item.publishUri);
      } catch {
        failed.push(item.publishUri);
      } finally {
        mark(item.publishUri, false);
      }
    }
    const skipText = skipped > 0 ? `，略過 ${skipped} 筆` : '';
    if (failed.length === 0) {
      toast({ message: `已${verb} ${succeeded.length} 筆${skipText}`, severity: 'success' });
    } else {
      toast({
        message: `${verb}成功 ${succeeded.length} 筆、失敗 ${failed.length} 筆${skipText}：${failed.join('、')}`,
        severity: 'warning',
      });
    }
    onDone();
    reload();
    refresh();
  };

  const remove = async (items: ServiceLike[], onDone?: () => void) => {
    const names = items.map((i) => i.publishUri);
    const ok = await confirm({
      title: `刪除 ${names.length} 個 ${noun}？`,
      content: (
        <>
          這些服務會先停止再移除，無法復原。
          <NameList names={names} />
        </>
      ),
      confirmLabel: `刪除 ${names.length} 個`,
      tone: 'danger',
    });
    if (!ok) return;
    try {
      await removeFn(names);
      toast({ message: `已刪除 ${names.length} 個 ${noun}`, severity: 'success' });
      onDone?.();
      reload();
      refresh();
    } catch (e) {
      toast({ message: `刪除失敗：${errMsg(e)}`, severity: 'error' });
    }
  };

  return { busy, toggle, batchSwitch, remove };
}
