'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Paper,
  Typography,
  Chip
} from '@mui/material';
import { CloudUpload as UploadIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { endpointService } from '@/services/endpoint.service';
import { Endpoint } from '@/types/models';

interface EndpointFormProps {
  endpoint?: Endpoint | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const schema = yup.object({
  publishUri: yup.string().required('發布名稱為必填'),
  beanName: yup.string().required('Bean 名稱為必填'),
  classPath: yup.string().required('Class 路徑為必填'),
  ignoreCdata: yup.boolean().default(false)
});

type FormData = yup.InferType<typeof schema>;

const EndpointForm: React.FC<EndpointFormProps> = ({
  endpoint,
  onSuccess,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      publishUri: '',
      beanName: '',
      classPath: '',
      ignoreCdata: false
    }
  });

  // 如果是編輯模式，載入資料
  useEffect(() => {
    if (endpoint) {
      reset({
        publishUri: endpoint.publishUri,
        beanName: endpoint.beanName,
        classPath: endpoint.classPath,
        ignoreCdata: endpoint.ignoreCdata
      });
    }
  }, [endpoint, reset]);

  // 成功後倒數關閉
  useEffect(() => {
    if (countdown && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      onSuccess();
    }
  }, [countdown, onSuccess]);

  // 檔案選擇處理
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/java-archive' && !file.name.endsWith('.jar')) {
        setError('請選擇 .jar 檔案');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  // 清空表單
  const handleClear = () => {
    reset();
    setSelectedFile(null);
    setError(null);
    setSuccess(null);
  };

  // 表單提交
  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);

      const formData = {
        ...data,
        jarFileId: endpoint?.jarFileId || '',
        jarFileName: endpoint?.jarFileName || '',
        file: selectedFile,
        isActive: endpoint?.isActive || true
      };

      if (endpoint) {
        // 更新
        await endpointService.updateWebService({ ...formData, id: endpoint.id });
        setSuccess('Endpoint 更新成功！');
      } else {
        // 新增
        await endpointService.saveWebService(formData);
        setSuccess('Endpoint 新增成功！');
      }

      setCountdown(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* 表單標題 */}
          <Typography variant="h6" gutterBottom>
            {endpoint ? '編輯 Endpoint' : '新增 Endpoint'}
          </Typography>

          {/* 錯誤/成功訊息 */}
          {error && <Alert severity="error">{error}</Alert>}

          {success && (
            <Alert severity="success">
              {success}
              {countdown && ` 視窗將在 ${countdown} 秒後關閉`}
            </Alert>
          )}

          {/* 表單欄位 */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {/* 發布名稱 */}
            <Controller
              name="publishUri"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="發布名稱 (Publish URI)"
                  fullWidth
                  required
                  error={!!errors.publishUri}
                  helperText={errors.publishUri?.message}
                />
              )}
            />

            {/* Bean 名稱 */}
            <Controller
              name="beanName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Bean 名稱"
                  fullWidth
                  required
                  error={!!errors.beanName}
                  helperText={errors.beanName?.message}
                />
              )}
            />
          </Box>

          {/* Class 路徑 */}
          <Controller
            name="classPath"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Class 路徑"
                fullWidth
                required
                error={!!errors.classPath}
                helperText={errors.classPath?.message}
              />
            )}
          />

          {/* 目前 Jar 檔案名稱 */}
          {endpoint?.jarFileName && (
            <Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                目前 Jar 檔案:
              </Typography>
              <Chip
                label={endpoint.jarFileName}
                color="primary"
                size="small"
              />
            </Box>
          )}

          {/* 檔案上傳 */}
          <Box>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              {endpoint ? '更新 Jar 檔案 (可選):' : '上傳 Jar 檔案:'}
            </Typography>
            <Button
              variant="outlined"
              component="label"
              startIcon={<UploadIcon />}
              sx={{ mr: 2 }}
            >
              選擇檔案
              <input
                type="file"
                accept=".jar"
                hidden
                onChange={handleFileChange}
              />
            </Button>
            {selectedFile && (
              <Chip
                label={selectedFile.name}
                onDelete={() => setSelectedFile(null)}
                color="primary"
                size="small"
              />
            )}
          </Box>

          {/* Ignore CDATA */}
          <Controller
            name="ignoreCdata"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Checkbox
                    {...field}
                    checked={field.value}
                  />
                }
                label="Ignore CDATA"
              />
            )}
          />

          {/* 操作按鈕 */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button
              variant="outlined"
              onClick={handleClear}
              startIcon={<ClearIcon />}
              disabled={loading}
            >
              清空
            </Button>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? '處理中...' : (endpoint ? '更新' : '新增')}
            </Button>
          </Box>
        </Box>
      </form>
    </Paper>
  );
};

export default EndpointForm;