'use client';

import React, { useState } from 'react';
import { Alert, Box, Button, CircularProgress, IconButton, TextField, Typography } from '@mui/material';
import { Close as CloseIcon, WarningAmber as WarningIcon } from '@mui/icons-material';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { formatContent } from '@/utils/formatContent';
import { tokens } from '@/theme/tokens';

const c = tokens.color;

const schema = yup.object({
  method: yup.string().trim().required('請輸入方法名稱，需與 JAR 程式傳入的 method 一致'),
  condition: yup.string().default(''),
  responseContent: yup.string().default(''),
});

export type ResponseFormValues = yup.InferType<typeof schema>;

interface Props {
  mode: 'new' | 'edit';
  initial: ResponseFormValues;
  onClose: () => void;
  /** 失敗時 reject，面板保留輸入並顯示錯誤 */
  onSave: (values: ResponseFormValues) => Promise<void>;
  onDelete?: () => void;
  /** 外層的儲存請求進行中；鎖定關閉與 Esc */
  locked?: boolean;
}

/** 右側編輯面板內容（外層決定並排或覆蓋顯示） */
export default function ResponseEditorPanel({ mode, initial, onClose, onSave, onDelete, locked = false }: Props) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formatError, setFormatError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const saving = submitting || locked;
  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<ResponseFormValues>({ resolver: yupResolver(schema), defaultValues: initial });

  const submit = handleSubmit(async (values) => {
    if (saving) return;
    setSubmitting(true);
    setSaveError(null);
    try {
      await onSave({ ...values, method: values.method.trim() });
    } catch (e) {
      setSaveError(e instanceof Error && e.message ? e.message : '儲存失敗');
    } finally {
      setSubmitting(false);
    }
  });

  const format = () => {
    const formatted = formatContent(getValues('responseContent') ?? '');
    if (formatted === null) {
      setFormatError('內容不是有效的 JSON 或 XML，未格式化');
      return;
    }
    setFormatError(null);
    setValue('responseContent', formatted, { shouldDirty: true });
  };

  const title = mode === 'new' ? '新增回應' : '編輯回應';
  const labelSx = { fontWeight: 600, fontSize: 14, color: c.text } as const;

  return (
    <Box
      component="form"
      noValidate
      onSubmit={submit}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          // 儲存中不關閉，避免回應回來時作用在已卸載的表單
          if (!saving) onClose();
        }
      }}
      aria-busy={saving || undefined}
      aria-labelledby="response-panel-title"
      data-testid="response-panel"
      sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: '20px', py: 2, borderBottom: `1px solid ${c.border}` }}>
        <Typography id="response-panel-title" variant="h2" component="h2" sx={{ flex: 1 }}>
          {title}
        </Typography>
        <IconButton aria-label="關閉" onClick={onClose} size="small" disabled={saving}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: '20px', display: 'flex', flexDirection: 'column', gap: 2.25 }}>
        {saveError && (
          <Alert severity="error" role="alert">
            儲存失敗：{saveError}。輸入的內容已保留，可修正後再試一次。
          </Alert>
        )}

        <Controller
          name="method"
          control={control}
          render={({ field }) => (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Box component="label" htmlFor="resp-method" sx={labelSx}>
                方法名稱 <Box component="span" sx={{ color: c.dangerText }} aria-hidden>*</Box>
              </Box>
              <TextField
                {...field}
                id="resp-method"
                size="small"
                slotProps={{ htmlInput: { readOnly: saving } }}
                autoFocus
                required
                error={!!errors.method}
                helperText={errors.method?.message ?? '與 JAR 程式傳入的 method 一致'}
              />
            </Box>
          )}
        />

        <Controller
          name="condition"
          control={control}
          render={({ field }) => (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Box component="label" htmlFor="resp-condition" sx={labelSx}>條件</Box>
              <TextField
                {...field}
                id="resp-condition"
                size="small"
                helperText="完全相等才會命中，留空代表 JAR 未帶條件"
                slotProps={{ htmlInput: { readOnly: saving, style: { fontFamily: tokens.font.mono, fontSize: 13 } } }}
              />
            </Box>
          )}
        />

        <Controller
          name="responseContent"
          control={control}
          render={({ field }) => (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box component="label" htmlFor="resp-content" sx={{ ...labelSx, flex: 1 }}>回應內容</Box>
                <Button size="small" variant="text" onClick={format} disabled={saving} sx={{ minHeight: 28 }}>
                  格式化
                </Button>
              </Box>
              <TextField
                {...field}
                onChange={(e) => {
                  setFormatError(null);
                  field.onChange(e);
                }}
                id="resp-content"
                multiline
                minRows={10}
                error={!!formatError}
                helperText={formatError ?? undefined}
                slotProps={{
                  htmlInput: { readOnly: saving, style: { fontFamily: tokens.font.mono, fontSize: 13, lineHeight: 1.5 } },
                }}
                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: c.surfaceMuted, alignItems: 'flex-start' }, '& textarea': { minHeight: 240 } }}
              />
            </Box>
          )}
        />

        <Box
          role="note"
          sx={{
            display: 'flex',
            gap: 1,
            alignItems: 'flex-start',
            p: '10px 12px',
            fontSize: 13,
            color: c.warningText,
            backgroundColor: c.warningNoticeBg,
            border: `1px solid ${c.warningNoticeBorder}`,
            borderRadius: '8px',
          }}
        >
          <WarningIcon sx={{ fontSize: 18 }} aria-hidden />
          儲存後此回應會變為停用，需再手動啟用。
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: '20px', py: 2, borderTop: `1px solid ${c.border}` }}>
        {mode === 'edit' && onDelete && (
          <Button variant="text" onClick={onDelete} sx={{ color: c.dangerText }} disabled={saving}>
            刪除
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button variant="outlined" onClick={onClose} disabled={saving}>
          取消
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          {saving ? '儲存中…' : '儲存'}
        </Button>
      </Box>
    </Box>
  );
}
