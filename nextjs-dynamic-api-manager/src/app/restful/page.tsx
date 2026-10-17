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
  DeleteSweep as DeleteSweepIcon
} from '@mui/icons-material';
import { restfulService } from '@/services/restful.service';
import { Restful } from '@/types/models';
import RestfulForm from '@/forms/RestfulForm';

const RestfulPage: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [restfuls, setRestfuls] = useState<Restful[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRestful, setEditingRestful] = useState<Restful | null>(null);

  // 載入 Restful Controllers
  const loadRestfuls = async () => {
    try {
      setLoading(true);
      const data = await restfulService.getControllers();
      setRestfuls(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入資料失敗');
    } finally {
      setLoading(false);
    }
  };

  // 載入數據 - 當組件掛載時和路徑變化時
  useEffect(() => {
    loadRestfuls();
  }, [pathname]);

  // 過濾資料
  const filteredRestfuls = restfuls.filter(restful =>
    restful.publishUri.toLowerCase().includes(searchText.toLowerCase()) ||
    restful.classPath.toLowerCase().includes(searchText.toLowerCase())
  );

  // 分頁資料
  const paginatedRestfuls = filteredRestfuls.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  // 全選處理 (改善：確保只針對當前頁面，但保持其他頁面的選擇)
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      // 將當前頁面的所有項目ID加入選擇
      const currentPageIds = paginatedRestfuls.map(restful => restful.id);
      const newSelected = [...new Set([...selected, ...currentPageIds])];
      setSelected(newSelected);
    } else {
      // 從選擇中移除當前頁面的所有項目ID
      const currentPageIds = paginatedRestfuls.map(restful => restful.id);
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
  const handleToggleStatus = async (restful: Restful) => {
    const confirmed = window.confirm('你確定要變更此設定嗎？');
    if (confirmed) {
      try {
        // 先更新API
        await restfulService.switchController(restful.publishUri, !restful.isActive);
        
        // 只更新本地狀態，不重新載入整個列表
        setRestfuls(prevRestfuls => 
          prevRestfuls.map(rf => 
            rf.id === restful.id 
              ? { ...rf, isActive: !rf.isActive }
              : rf
          )
        );
        
        console.log(`狀態切換成功: ${restful.publishUri} -> ${!restful.isActive}`);
      } catch (err) {
        console.error('狀態切換失敗:', err);
        setError(err instanceof Error ? err.message : '狀態切換失敗');
      }
    }
  };

  // 刪除單筆
  const handleDelete = async (restful: Restful) => {
    const confirmed = window.confirm('確定要刪除此 Restful Controller？');
    if (confirmed) {
      try {
        console.log('Deleting restful:', restful.publishUri);
        await restfulService.removeController([restful.publishUri]);
        console.log('Delete success, reloading...');
        await loadRestfuls();
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
    
    const confirmed = window.confirm(`確定要刪除選中的 ${selected.length} 個 Restful Controller？`);
    if (confirmed) {
      try {
        const selectedRestfuls = restfuls.filter(restful => selected.includes(restful.id));
        const publishUris = selectedRestfuls.map(restful => restful.publishUri);
        console.log('Batch deleting restfuls:', publishUris);
        
        if (publishUris.length === 0) {
          alert('找不到要刪除的項目');
          return;
        }
        
        await restfulService.removeController(publishUris);
        console.log('Batch delete success, reloading...');
        setSelected([]);
        await loadRestfuls();
        alert(`成功刪除 ${publishUris.length} 個 Restful Controller`);
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
    setEditingRestful(null);
    setFormOpen(true);
  };

  // 開啟編輯表單
  const handleEdit = (restful: Restful) => {
    setEditingRestful(restful);
    setFormOpen(true);
  };

  // 表單提交成功
  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditingRestful(null);
    loadRestfuls();
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
        Restful 管理
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
          新增 Restful
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<DeleteSweepIcon />}
          onClick={handleBatchDelete}
          disabled={selected.length === 0}
          color="error"
        >
          移除 Restful ({selected.length})
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
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ width: '40px' }}>
                  <Checkbox
                    indeterminate={
                      paginatedRestfuls.some(restful => selected.includes(restful.id)) && 
                      !paginatedRestfuls.every(restful => selected.includes(restful.id))
                    }
                    checked={
                      paginatedRestfuls.length > 0 && 
                      paginatedRestfuls.every(restful => selected.includes(restful.id))
                    }
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell sx={{ width: '180px', whiteSpace: 'nowrap' }}>發布名稱</TableCell>
                <TableCell sx={{ width: '280px', whiteSpace: 'nowrap' }}>Class 路徑</TableCell>
                <TableCell sx={{ width: '200px', whiteSpace: 'nowrap' }}>Jar 檔案編號</TableCell>
                <TableCell sx={{ width: '80px', whiteSpace: 'nowrap' }}>狀態</TableCell>
                <TableCell sx={{ width: '160px', whiteSpace: 'nowrap' }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRestfuls.map((restful) => (
                <TableRow key={restful.id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.includes(restful.id)}
                      onChange={() => handleSelectOne(restful.id)}
                    />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {restful.publishUri}
                  </TableCell>
                  <TableCell sx={{ 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem'
                  }}>
                    {restful.classPath}
                  </TableCell>
                  <TableCell>
                    {restful.jarFileId ? (
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
                        {restful.jarFileId}
                      </Box>
                    ) : (
                      <Box sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                        未上傳
                      </Box>
                    )}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={restful.isActive}
                      onChange={() => handleToggleStatus(restful)}
                      color="primary"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(restful)}
                        title="編輯"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(restful)}
                        title="刪除"
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        title="回應清單"
                        onClick={() => handleResponseList(restful.publishUri, 'RESTFUL')}
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
          count={filteredRestfuls.length}
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

      {/* Restful 表單對話框 */}
      <Dialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingRestful ? '編輯 Restful' : '新增 Restful'}
        </DialogTitle>
        <DialogContent>
          <RestfulForm
            restful={editingRestful}
            onSuccess={handleFormSuccess}
            onCancel={() => setFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default RestfulPage;