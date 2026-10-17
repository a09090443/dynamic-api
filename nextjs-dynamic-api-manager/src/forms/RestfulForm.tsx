'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { CloudUpload as UploadIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { restfulService } from '@/services/restful.service';
import { Restful } from '@/types/models';

interface RestfulFormProps {
  restful?: Restful | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const schema = yup.object({
  publishUri: yup.string().required('發布名稱為必填'),
  classPath: yup.string().required('Class 路徑為必填')
});

type FormData = yup.InferType<typeof schema>;

const RestfulForm: React.FC<RestfulFormProps> = ({
  restful,
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
      classPath: ''
    }
  });

  // 如果是編輯模式，載入資料
  useEffect(() => {
    if (restful) {
      reset({
        publishUri: restful.publishUri,
        classPath: restful.classPath
      });
    }
  }, [restful, reset]);

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
        jarFileId: restful?.jarFileId || '',
        jarFileName: restful?.jarFileName || '',
        file: selectedFile,
        isActive: restful?.isActive || true
      };

      if (restful) {
        // 更新
        await restfulService.updateController({ ...formData, id: restful.id });
        setSuccess('Restful Controller 更新成功！');
      } else {
        // 新增
        await restfulService.saveController(formData);
        setSuccess('Restful Controller 新增成功！');
      }

      setCountdown(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* 錯誤/成功訊息 */}
        {error && <Alert severity="error">{error}</Alert>}

        {success && (
          <Alert severity="success">
            {success}
            {countdown && ` 視窗將在 ${countdown} 秒後關閉`}
          </Alert>
        )}

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
        {restful?.jarFileName && (
          <Box>
            <Chip
              label={`目前 Jar 檔案: ${restful.jarFileName}`}
              color="primary"
              size="small"
            />
          </Box>
        )}

        {/* 檔案上傳 */}
        <Box>
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
              {loading ? '處理中...' : (restful ? '更新' : '新增')}
            </Button>
          </Box>
        </Box>
      </form>
  );
};

export default RestfulForm;