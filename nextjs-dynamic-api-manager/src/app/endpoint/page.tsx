'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  IconButton,
  Button,
  Switch,
  TextField,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  List as ListIcon,
  Add as AddIcon,
  Build as BuildIcon,
  DeleteSweep as DeleteSweepIcon
} from '@mui/icons-material';
import { endpointService } from '@/services/endpoint.service';
import { Endpoint } from '@/types/models';
import EndpointForm from '@/forms/EndpointForm';
import WsdlGenObjDialog from '@/dialogs/WsdlGenObjDialog';

const EndpointPage: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [wsdlDialogOpen, setWsdlDialogOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);

  // 載入 Endpoints
  const loadEndpoints = async () => {
    try {
      setLoading(true);
      const data = await endpointService.getEndpoints();
      setEndpoints(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入資料失敗');
    } finally {
      setLoading(false);
    }
  };

  // 載入數據 - 當組件掛載時和路徑變化時
  useEffect(() => {
    loadEndpoints();
  }, [pathname]);

  // 過濾資料
  const filteredEndpoints = endpoints.filter(endpoint =>
    endpoint.publishUri.toLowerCase().includes(searchText.toLowerCase()) ||
    endpoint.beanName.toLowerCase().includes(searchText.toLowerCase()) ||
    endpoint.classPath.toLowerCase().includes(searchText.toLowerCase())
  );

  // 分頁資料
  const paginatedEndpoints = filteredEndpoints.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // 全選處理 (改善：確保只針對當前頁面，但保持其他頁面的選擇)
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      // 將當前頁面的所有項目ID加入選擇
      const currentPageIds = paginatedEndpoints.map(endpoint => endpoint.id);
      const newSelected = [...new Set([...selected, ...currentPageIds])];
      setSelected(newSelected);
    } else {
      // 從選擇中移除當前頁面的所有項目ID
      const currentPageIds = paginatedEndpoints.map(endpoint => endpoint.id);
      setSelected(selected.filter(id => !currentPageIds.includes(id)));
    }
  };

  // 單選處理
  const handleSelectOne = (id: string) => {
    setSelected(prev =>
      prev.includes(id)
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  // 切換狀態
  const handleToggleStatus = async (endpoint: Endpoint) => {
    const confirmed = window.confirm('你確定要變更此設定嗎？');
    if (confirmed) {
      try {
        // 先更新API
        await endpointService.switchWebService(endpoint.publishUri, !endpoint.isActive);
        
        // 只更新本地狀態，不重新載入整個列表
        setEndpoints(prevEndpoints => 
          prevEndpoints.map(ep => 
            ep.id === endpoint.id 
              ? { ...ep, isActive: !ep.isActive }
              : ep
          )
        );
        
        console.log(`狀態切換成功: ${endpoint.publishUri} -> ${!endpoint.isActive}`);
      } catch (err) {
        console.error('狀態切換失敗:', err);
        setError(err instanceof Error ? err.message : '狀態切換失敗');
      }
    }
  };

  // 刪除單筆
  const handleDelete = async (endpoint: Endpoint) => {
    const confirmed = window.confirm('確定要刪除此 Endpoint？');
    if (confirmed) {
      try {
        console.log('Deleting endpoint:', endpoint.publishUri);
        await endpointService.removeWebService([endpoint.publishUri]);
        console.log('Delete success, reloading...');
        await loadEndpoints();
        console.log('Reload complete');
        // 可以添加成功訊息
        alert('刪除成功');
      } catch (err) {
        console.error('Delete error:', err);
        const errorMsg = err instanceof Error ? err.message : '刪除失敗';
        setError(errorMsg);
        alert(`刪除失敗: ${errorMsg}`);
      }
    }
  };

  // 導航到回應清單
  const handleResponseList = (publishUri: string, serviceType: 'ENDPOINT' | 'RESTFUL') => {
    const params = new URLSearchParams({
      publishUri,
      serviceType,
    });
    router.push(`/response?${params.toString()}`);
  };

  // 批量刪除
  const handleBatchDelete = async () => {
    if (selected.length === 0) {
      alert('請選擇要刪除的項目');
      return;
    }
    
    const confirmed = window.confirm(`確定要刪除選中的 ${selected.length} 個 Endpoint？`);
    if (confirmed) {
      try {
        const selectedEndpoints = endpoints.filter(endpoint => selected.includes(endpoint.id));
        const publishUris = selectedEndpoints.map(endpoint => endpoint.publishUri);
        console.log('Batch deleting endpoints:', publishUris);
        
        if (publishUris.length === 0) {
          alert('找不到要刪除的項目');
          return;
        }
        
        await endpointService.removeWebService(publishUris);
        console.log('Batch delete success, reloading...');
        setSelected([]);
        await loadEndpoints();
        alert(`成功刪除 ${publishUris.length} 個 Endpoint`);
      } catch (err) {
        console.error('Batch delete error:', err);
        const errorMsg = err instanceof Error ? err.message : '批量刪除失敗';
        setError(errorMsg);
        alert(`批量刪除失敗: ${errorMsg}`);
      }
    }
  };

  // 開啟新增表單
  const handleAdd = () => {
    setEditingEndpoint(null);
    setFormOpen(true);
  };

  // 開啟編輯表單
  const handleEdit = (endpoint: Endpoint) => {
    setEditingEndpoint(endpoint);
    setFormOpen(true);
  };

  // 表單提交成功
  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingEndpoint(null);
    loadEndpoints();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Endpoint 管理
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 工具列 */}
      <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          新增 Endpoint
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<DeleteSweepIcon />}
          onClick={handleBatchDelete}
          disabled={selected.length === 0}
          color="error"
        >
          移除 Endpoint ({selected.length})
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<BuildIcon />}
          onClick={() => setWsdlDialogOpen(true)}
        >
          轉換 WSDL 物件
        </Button>

        <TextField
          label="搜尋"
          variant="outlined"
          size="small"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          sx={{ ml: 'auto', minWidth: 250 }}
        />
      </Box>

      {/* 資料表格 */}
      <Paper elevation={8}>
        <TableContainer>
          <Table sx={{ minWidth: 1000 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ width: '40px' }}>
                  <Checkbox
                    indeterminate={
                      paginatedEndpoints.some(endpoint => selected.includes(endpoint.id)) && 
                      !paginatedEndpoints.every(endpoint => selected.includes(endpoint.id))
                    }
                    checked={
                      paginatedEndpoints.length > 0 && 
                      paginatedEndpoints.every(endpoint => selected.includes(endpoint.id))
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ width: '180px', whiteSpace: 'nowrap' }}>發布名稱</TableCell>
                <TableCell sx={{ width: '180px', whiteSpace: 'nowrap' }}>Bean 名稱</TableCell>
                <TableCell sx={{ width: '280px', whiteSpace: 'nowrap' }}>Class 路徑</TableCell>
                <TableCell sx={{ width: '200px', whiteSpace: 'nowrap' }}>Jar 檔案編號</TableCell>
                <TableCell sx={{ width: '80px', whiteSpace: 'nowrap' }}>狀態</TableCell>
                <TableCell sx={{ width: '160px', whiteSpace: 'nowrap' }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedEndpoints.map((endpoint) => (
                <TableRow key={endpoint.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(endpoint.id)}
                      onChange={() => handleSelectOne(endpoint.id)}
                    />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {endpoint.publishUri}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {endpoint.beanName}
                  </TableCell>
                  <TableCell sx={{ 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem'
                  }}>
                    {endpoint.classPath}
                  </TableCell>
                  <TableCell>
                    {endpoint.jarFileId ? (
                      <Box
                        component="a"
                        href="#"
                        onClick={(e) => e.preventDefault()}
                        sx={{
                          color: 'primary.main',
                          textDecoration: 'underline',
                          fontFamily: 'monospace',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          '&:hover': {
                            textDecoration: 'none'
                          }
                        }}
                      >
                        {endpoint.jarFileId}
                      </Box>
                    ) : (
                      <Box sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                        未上傳
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={endpoint.isActive}
                      onChange={() => handleToggleStatus(endpoint)}
                      color="primary"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(endpoint)}
                        title="編輯"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(endpoint)}
                        title="刪除"
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        title="回應清單"
                        onClick={() => handleResponseList(endpoint.publishUri, 'ENDPOINT')}
                      >
                        <ListIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          component="div"
          count={filteredEndpoints.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 50, 100]}
          labelRowsPerPage="每頁筆數:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} 共 ${count} 筆`}
        />
      </Paper>

      {/* Endpoint 表單對話框 */}
      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingEndpoint ? '編輯 Endpoint' : '新增 Endpoint'}
        </DialogTitle>
        <DialogContent>
          <EndpointForm
            endpoint={editingEndpoint}
            onSuccess={handleFormSuccess}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* WSDL 轉換對話框 */}
      <WsdlGenObjDialog
        open={wsdlDialogOpen}
        onClose={() => setWsdlDialogOpen(false)}
      />
    </Box>
  );
};

export default EndpointPage;