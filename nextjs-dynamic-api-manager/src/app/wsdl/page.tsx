'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Alert, Box, Button, CircularProgress, IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import {
  ArrowForward as ArrowIcon,
  CheckCircleOutline as CheckIcon,
  Close as CloseIcon,
  Download as DownloadIcon,
  UploadFile as UploadIcon,
} from '@mui/icons-material';
import { endpointService } from '@/services/endpoint.service';
import PageHeader from '@/components/service-list/PageHeader';
import { Card } from '@/components/service-list/ListParts';
import { tokens } from '@/theme/tokens';

const c = tokens.color;
const ZIP_NAME = 'generated_wsdl_object.zip';
const ACCEPT = ['.wsdl', '.xml'];

type Source = 'url' | 'file';
type Phase =
  | { state: 'idle' }
  | { state: 'converting' }
  | { state: 'success'; url: string }
  | { state: 'error'; detail: string };

const steps = [
  { n: 1, title: '提供 WSDL', desc: '網址或檔案擇一', on: true },
  { n: 2, title: '下載 ZIP', desc: '內含產生的 Java 原始碼', on: true },
  { n: 3, title: '實作並打包 JAR', desc: '在自己的專案完成', on: false },
  { n: 4, title: '新增 Endpoint', desc: '上傳 JAR 後發布', on: false },
];

const triggerDownload = (url: string) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = ZIP_NAME;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

const SectionTitle = ({ id, children, extra }: { id: string; children: React.ReactNode; extra?: React.ReactNode }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: '20px', py: 2, borderBottom: `1px solid ${c.border}` }}>
    <Typography id={id} variant="h2" component="h2" sx={{ flex: 1 }}>
      {children}
    </Typography>
    {extra}
  </Box>
);

export default function WsdlPage() {
  const [source, setSource] = useState<Source>('url');
  const [wsdlUrl, setWsdlUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [packageName, setPackageName] = useState('');
  const [errors, setErrors] = useState<{ url?: string; file?: string }>({});
  const [phase, setPhase] = useState<Phase>({ state: 'idle' });
  const [dragOver, setDragOver] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const objectUrl = useRef<string | null>(null);
  /** 每次送出遞增；回應回來時比對，過期的結果不顯示也不下載 */
  const requestSeq = useRef(0);

  const revoke = () => {
    if (objectUrl.current) {
      URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = null;
    }
  };
  useEffect(
    () => () => {
      requestSeq.current += 1;
      revoke();
    },
    [],
  );

  const converting = phase.state === 'converting';

  /** 修改輸入時回到尚未轉換的狀態；轉換中輸入已鎖定，不會走到這裡 */
  const resetResult = () => {
    setPhase((p) => {
      if (p.state === 'converting') return p;
      if (p.state !== 'idle') revoke();
      return { state: 'idle' };
    });
  };

  const pickFile = (f: File | undefined | null) => {
    if (!f || converting) return;
    const ok = ACCEPT.some((ext) => f.name.toLowerCase().endsWith(ext));
    if (!ok) {
      setFile(null);
      setErrors((e) => ({ ...e, file: `不接受「${f.name}」，請選擇 .wsdl 或 .xml 檔案` }));
      return;
    }
    setFile(f);
    setErrors((e) => ({ ...e, file: undefined }));
    resetResult();
  };

  const validate = (): boolean => {
    const next: { url?: string; file?: string } = {};
    if (source === 'url' && !wsdlUrl.trim()) next.url = '請輸入 WSDL 網址';
    if (source === 'file' && !file) next.file = errors.file ?? '請選擇 .wsdl 或 .xml 檔案';
    setErrors(next);
    return !next.url && !next.file;
  };

  const convert = async () => {
    if (converting) return;
    if (!validate()) return;
    revoke();
    const seq = ++requestSeq.current;
    setPhase({ state: 'converting' });
    try {
      const blob = await endpointService.genWsdlObj({
        wsdlUrl: source === 'url' ? wsdlUrl.trim() : undefined,
        file: source === 'file' && file ? file : undefined,
        packageName: packageName.trim() || undefined,
      });
      if (seq !== requestSeq.current) return;
      const url = URL.createObjectURL(blob);
      objectUrl.current = url;
      setPhase({ state: 'success', url });
      triggerDownload(url);
    } catch (e) {
      if (seq !== requestSeq.current) return;
      setPhase({ state: 'error', detail: e instanceof Error ? e.message : '' });
    }
  };

  const sourceOption = (value: Source, title: string, desc: string) => {
    const checked = source === value;
    return (
      <Box
        component="label"
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          p: '12px 14px',
          borderRadius: '10px',
          cursor: converting ? 'not-allowed' : 'pointer',
          opacity: converting && !checked ? 0.6 : 1,
          border: `1px solid ${checked ? c.primary : c.borderInput}`,
          backgroundColor: checked ? c.primarySoft : c.surface,
          '&:focus-within': { boxShadow: tokens.shadow.focusRing },
        }}
      >
        <input
          type="radio"
          name="wsdl-source"
          value={value}
          checked={checked}
          disabled={converting}
          onChange={() => {
            setSource(value);
            setErrors({});
            resetResult();
          }}
          style={{ margin: '3px 0 0', width: 16, height: 16, accentColor: c.primary }}
        />
        <Box component="span" sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <Box component="span" sx={{ fontWeight: 600, color: c.textStrong }}>{title}</Box>
          <Box component="span" sx={{ fontSize: 12, color: c.textMuted }}>{desc}</Box>
        </Box>
      </Box>
    );
  };

  let result: React.ReactNode;
  let badge: React.ReactNode = null;
  if (phase.state === 'idle') {
    result = (
      <Box data-testid="wsdl-result-idle" sx={{ p: '28px 20px', textAlign: 'center', color: c.textMuted }}>
        尚未轉換。填好來源後按「轉換並下載」。
      </Box>
    );
  } else if (phase.state === 'converting') {
    result = (
      <Box role="status" aria-busy="true" data-testid="wsdl-result-converting" sx={{ p: '28px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, color: c.textMuted }}>
        <CircularProgress size={20} aria-hidden />
        轉換中，請稍候…
      </Box>
    );
  } else if (phase.state === 'success') {
    badge = (
      <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', height: 24, px: 1, fontSize: 12, fontWeight: 600, color: c.successText, backgroundColor: c.successSoft, borderRadius: '999px' }}>
        完成
      </Box>
    );
    result = (
      <Box data-testid="wsdl-result-success">
        <Box role="status" sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, p: '16px 20px', backgroundColor: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
          <CheckIcon sx={{ color: c.successText }} aria-hidden />
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Box component="span" sx={{ fontWeight: 600, color: '#14532d' }}>已產生並開始下載</Box>
            <Box component="span" sx={{ fontFamily: tokens.font.mono, fontSize: 12, color: '#166534' }}>{ZIP_NAME}</Box>
          </Box>
          <Button size="small" variant="outlined" startIcon={<DownloadIcon fontSize="small" />} onClick={() => triggerDownload(phase.url)}>
            重新下載
          </Button>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, p: '16px 20px' }}>
          <Box component="span" sx={{ flex: '1 1 180px', fontSize: 13, color: c.textMuted }}>實作完成、打包成 JAR 之後：</Box>
          <Button variant="outlined" component={Link} href="/endpoint" endIcon={<ArrowIcon fontSize="small" />} sx={{ color: c.primaryText, borderColor: c.primarySoftBorder }}>
            新增 Endpoint
          </Button>
        </Box>
      </Box>
    );
  } else {
    result = (
      <Box sx={{ p: '16px 20px' }} data-testid="wsdl-result-error">
        <Alert
          severity="error"
          role="alert"
          action={
            <Button size="small" variant="outlined" color="error" onClick={() => void convert()}>
              再試一次
            </Button>
          }
          sx={{ alignItems: 'center', border: `1px solid ${c.dangerBorder}` }}
        >
          <Box sx={{ fontWeight: 600 }}>無法轉換：讀不到這個 WSDL</Box>
          <Box sx={{ fontSize: 13 }}>請確認網址正確、後端連得到，或改用上傳檔案。輸入的內容會保留，不必重填。</Box>
          {phase.detail && (
            <Box sx={{ fontSize: 12, mt: 0.5, fontFamily: tokens.font.mono, wordBreak: 'break-all' }}>後端訊息：{phase.detail}</Box>
          )}
        </Alert>
      </Box>
    );
  }

  return (
    <>
      <PageHeader title="WSDL 轉換" description="把 WSDL 轉成 Java 物件並打包成 ZIP 下載，作為撰寫 Endpoint 實作的起點。" />

      <Box
        component="ol"
        aria-label="使用步驟"
        sx={{
          listStyle: 'none',
          m: 0,
          p: '16px 20px',
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
          gap: 2,
          backgroundColor: c.surface,
          border: `1px solid ${c.border}`,
          borderRadius: `${tokens.radius.card}px`,
        }}
      >
        {steps.map((s) => (
          <Box component="li" key={s.n} sx={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <Box component="span" aria-hidden sx={{ flex: '0 0 auto', width: 24, height: 24, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: s.on ? '#fff' : c.textSecondary, backgroundColor: s.on ? c.primary : c.border }}>
              {s.n}
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <Box component="span" sx={{ fontWeight: 600, color: c.textStrong }}>{s.title}</Box>
              <Box component="span" sx={{ fontSize: 12, color: c.textMuted }}>{s.desc}</Box>
            </Box>
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: '20px' }}>
        <Card as="section" aria-labelledby="src-h" sx={{ flex: '1 1 420px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <SectionTitle id="src-h">WSDL 來源</SectionTitle>
          <Box
            component="form"
            id="wsdl-form"
            noValidate
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              void convert();
            }}
            sx={{ p: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}
          >
            <Box component="fieldset" sx={{ position: 'relative', minWidth: 0, m: 0, p: 0, border: 0, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' }, gap: 1.5 }}>
              <Box component="legend" sx={{ position: 'absolute', width: '1px', height: '1px', p: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>來源類型</Box>
              {sourceOption('url', 'WSDL 網址', '服務已上線、後端連得到')}
              {sourceOption('file', '上傳檔案', '手邊只有 .wsdl 或 .xml')}
            </Box>

            {source === 'url' ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Box component="label" htmlFor="wsdl-url" sx={{ fontWeight: 600 }}>
                  WSDL 網址 <Box component="span" aria-hidden sx={{ color: c.dangerText }}>*</Box>
                </Box>
                <TextField
                  id="wsdl-url"
                  type="url"
                  size="small"
                  required
                  disabled={converting}
                  value={wsdlUrl}
                  placeholder="http://主機:埠/服務?wsdl"
                  onChange={(e) => {
                    setWsdlUrl(e.target.value);
                    if (errors.url) setErrors((x) => ({ ...x, url: undefined }));
                    resetResult();
                  }}
                  error={!!errors.url}
                  helperText={errors.url ?? '由後端去讀取，所以要填後端連得到的位址。'}
                  slotProps={{
                    htmlInput: { style: { fontFamily: tokens.font.mono, fontSize: 13 } },
                    input: {
                      endAdornment: wsdlUrl && !converting ? (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            aria-label="清除網址"
                            onClick={() => {
                              setWsdlUrl('');
                              resetResult();
                            }}
                          >
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ) : undefined,
                    },
                  }}
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                <Box component="span" id="wsdl-file-l" sx={{ fontWeight: 600 }}>
                  WSDL 檔案 <Box component="span" aria-hidden sx={{ color: c.dangerText }}>*</Box>
                </Box>
                <Box
                  role="button"
                  tabIndex={converting ? -1 : 0}
                  aria-disabled={converting || undefined}
                  aria-labelledby="wsdl-file-l"
                  aria-describedby="wsdl-file-hint"
                  data-testid="wsdl-dropzone"
                  onClick={() => {
                    if (!converting) fileInput.current?.click();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (!converting) fileInput.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!converting) setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                    pickFile(e.dataTransfer.files?.[0]);
                  }}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                    p: '28px 16px',
                    textAlign: 'center',
                    color: c.textMuted,
                    backgroundColor: dragOver ? c.primarySoft : c.surfaceMuted,
                    border: `1.5px dashed ${errors.file ? c.danger : dragOver ? c.primary : c.textDisabled}`,
                    borderRadius: '10px',
                    cursor: converting ? 'not-allowed' : 'pointer',
                    opacity: converting ? 0.7 : 1,
                    '&:focus-visible': { outline: `2px solid ${c.primary}`, outlineOffset: 2 },
                  }}
                >
                  <UploadIcon sx={{ color: c.primary, fontSize: 28 }} aria-hidden />
                  {file ? (
                    <Box component="span" data-testid="wsdl-file-name" sx={{ fontFamily: tokens.font.mono, fontSize: 13, color: c.text }}>
                      已選擇：{file.name}
                    </Box>
                  ) : (
                    <span>
                      <Box component="strong" sx={{ color: c.primaryText, fontWeight: 600 }}>選擇檔案</Box>，或把檔案拖曳到這裡
                    </span>
                  )}
                  <Box component="span" id="wsdl-file-hint" sx={{ fontSize: 12 }}>接受 .wsdl、.xml，一次一個檔案</Box>
                  <input
                    ref={fileInput}
                    type="file"
                    accept={ACCEPT.join(',')}
                    data-testid="wsdl-file-input"
                    disabled={converting}
                    aria-labelledby="wsdl-file-l"
                    tabIndex={-1}
                    onChange={(e) => {
                      pickFile(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                    style={{ display: 'none' }}
                  />
                </Box>
                {errors.file && (
                  <Box component="span" role="alert" sx={{ fontSize: 12, color: c.dangerText }}>{errors.file}</Box>
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Box component="label" htmlFor="wsdl-pkg" sx={{ fontWeight: 600 }}>
                Package 名稱 <Box component="span" sx={{ fontWeight: 400, color: c.textSubtle }}>（選填）</Box>
              </Box>
              <TextField
                id="wsdl-pkg"
                size="small"
                disabled={converting}
                value={packageName}
                placeholder="com.example.endpoint"
                onChange={(e) => {
                  setPackageName(e.target.value);
                  resetResult();
                }}
                helperText="留空則依 WSDL 的 targetNamespace 決定。"
                slotProps={{ htmlInput: { style: { fontFamily: tokens.font.mono, fontSize: 13 } } }}
              />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, p: '16px 20px', borderTop: `1px solid ${c.border}` }}>
            <Box component="span" sx={{ flex: '1 1 200px', fontSize: 12, color: c.textSubtle }}>轉換不會新增或變更任何 Endpoint。</Box>
            <Button
              type="submit"
              form="wsdl-form"
              variant="contained"
              disabled={converting}
              startIcon={converting ? <CircularProgress size={16} color="inherit" /> : <DownloadIcon fontSize="small" />}
            >
              {converting ? '轉換中…' : '轉換並下載'}
            </Button>
          </Box>
        </Card>

        <Card as="section" aria-labelledby="res-h" sx={{ flex: '1 1 360px', minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <SectionTitle id="res-h" extra={badge}>
            轉換結果
          </SectionTitle>
          <Box aria-live="polite">{result}</Box>
        </Card>
      </Box>
    </>
  );
}
