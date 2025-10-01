'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import { CloudUpload as UploadIcon, Download as DownloadIcon } from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { endpointService } from '@/services/endpoint.service';
import { saveAs } from 'file-saver';

interface WsdlGenObjDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FormData {
  inputType: 'url' | 'file';
  wsdlUrl: string;
}

const WsdlGenObjDialog: React.FC<WsdlGenObjDialogProps> = ({ open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { control, handleSubmit, watch, reset } = useForm<FormData>({
    defaultValues: {
      inputType: 'url',
      wsdlUrl: ''
    }
  });

  const inputType = watch('inputType');

  const handleClose = () => {
    reset();
    setSelectedFile(null);
    setError(null);
    onClose();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ['.wsdl', '.xml'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!validTypes.includes(fileExtension)) {
        setError('請選擇 .wsdl 或 .xml 檔案');
        return;
      }
      
      setSelectedFile(file);
      setError(null);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);

      let wsdlData: { wsdlPath?: string; file?: File };

      if (data.inputType === 'url') {
        if (!data.wsdlUrl.trim()) {
          setError('請輸入 WSDL URL');
          return;
        }
        wsdlData = { wsdlPath: data.wsdlUrl };
      } else {
        if (!selectedFile) {
          setError('請選擇檔案');
          return;
        }
        wsdlData = { file: selectedFile };
      }

      const blob = await endpointService.genWsdlObj(wsdlData);
      
      // 下載檔案
      const fileName = `wsdl-objects-${new Date().getTime()}.zip`;
      saveAs(blob, fileName);
      
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'WSDL 轉換失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <DownloadIcon />
          <Typography variant="h6">WSDL 物件轉換工具</Typography>
        </Box>
      </DialogTitle>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {error && <Alert severity="error">{error}</Alert>}
            
            <Typography variant="body2" color="textSecondary">
              選擇輸入方式，系統將根據 WSDL 生成對應的 Java 物件並打包成 ZIP 檔案供下載。
            </Typography>

            {/* 輸入方式選擇 */}
            <Controller
              name="inputType"
              control={control}
              render={({ field }) => (
                <RadioGroup {...field} row>
                  <FormControlLabel
                    value="url"
                    control={<Radio />}
                    label="WSDL URL"
                  />
                  <FormControlLabel
                    value="file"
                    control={<Radio />}
                    label="檔案上傳"
                  />
                </RadioGroup>
              )}
            />

            {/* URL 輸入 */}
            {inputType === 'url' && (
              <Controller
                name="wsdlUrl"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="WSDL URL"
                    fullWidth
                    placeholder="https://example.com/service?wsdl"
                    helperText="請輸入完整的 WSDL URL 位址"
                  />
                )}
              />
            )}

            {/* 檔案上傳 */}
            {inputType === 'file' && (
              <Box>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  sx={{ mb: 1 }}
                >
                  選擇 WSDL 檔案
                  <input
                    type="file"
                    accept=".wsdl,.xml"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
                
                {selectedFile && (
                  <Box sx={{ mt: 1 }}>
                    <Chip
                      label={selectedFile.name}
                      onDelete={() => setSelectedFile(null)}
                      color="primary"
                    />
                  </Box>
                )}
                
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  支援 .wsdl 和 .xml 格式檔案
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            取消
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
          >
            {loading ? '轉換中...' : '轉換並下載'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default WsdlGenObjDialog;