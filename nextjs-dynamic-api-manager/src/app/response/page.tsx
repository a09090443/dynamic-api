'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Switch,
  IconButton,
  Chip,
  TablePagination,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Collapse,
  CircularProgress,
} from '@mui/material';
import { 
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { Response, ResponseListParams } from '@/types/response';
import { ServiceType } from '@/types/models';
import { responseService } from '@/services/response.service';

// 將使用 searchParams 的邏輯抽離到單獨組件
function ResponsePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const publishUri = searchParams.get('publishUri') || '';
  const serviceType = (searchParams.get('serviceType') || 'ENDPOINT') as ServiceType;

  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'success' | 'error'>('success');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [responseFormOpen, setResponseFormOpen] = useState(false);
  const [editingResponse, setEditingResponse] = useState<Response | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // 表單狀態
  const [formData, setFormData] = useState({
    method: '',
    condition: '',
    responseContent: '',
  });

  useEffect(() => {
    if (publishUri) {
      loadResponses();
    }
  }, [publishUri, serviceType]);

  const loadResponses = async () => {
    try {
      setLoading(true);
      const params: ResponseListParams = {
        publishUri,
        serviceType,
      };
      const data = await responseService.getResponseList(params);
      setResponses(data);
    } catch (error) {
      console.error('Failed to load responses:', error);
      showMessage('載入回應清單失敗', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg: string, sev: 'success' | 'error') => {
    setMessage(msg);
    setSeverity(sev);
    setShowSnackbar(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredResponses.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const handleSwitchStatus = async (response: Response) => {
    const confirmed = window.confirm('你確定要變更此設定嗎？');
    if (confirmed) {
      try {
        // 先更新API
        await responseService.switchResponse(response.id, !response.isActive);
        
        // 只更新本地狀態，不重新載入整個列表
        setResponses(prevResponses => 
          prevResponses.map(resp => 
            resp.id === response.id 
              ? { ...resp, isActive: !resp.isActive }
              : resp
          )
        );
        
        showMessage('狀態更新成功', 'success');
        console.log(`狀態切換成功: ${response.id} -> ${!response.isActive}`);
      } catch (error) {
        console.error('狀態切換失敗:', error);
        showMessage('狀態更新失敗', 'error');
      }
    }
  };

  const handleEdit = (response: Response) => {
    setEditingResponse(response);
    setFormData({
      method: response.method,
      condition: response.condition,
      responseContent: response.responseContent,
    });
    setResponseFormOpen(true);
  };

  const handleAdd = () => {
    setEditingResponse(null);
    setFormData({
      method: '',
      condition: '',
      responseContent: '',
    });
    setResponseFormOpen(true);
  };

  const handleSave = async () => {
    try {
      const responseData = {
        publishUri,
        serviceType,
        ...formData,
        isActive: editingResponse ? editingResponse.isActive : true, // 新增時預設啟用，編輯時保持原狀態
      };

      if (editingResponse) {
        await responseService.updateResponse({
          ...responseData,
          id: editingResponse.id,
        });
        showMessage('回應更新成功', 'success');
      } else {
        await responseService.saveMockResponse(responseData);
        showMessage('回應新增成功', 'success');
      }

      setResponseFormOpen(false);
      await loadResponses();
    } catch (error) {
      console.error('Failed to save response:', error);
      showMessage('儲存失敗', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      if (deletingItemId) {
        // 刪除單筆
        console.log('Deleting response:', deletingItemId);
        await responseService.deleteResponse([deletingItemId]);
        showMessage('刪除成功', 'success');
      } else if (selectedIds.length > 0) {
        // 批量刪除
        console.log('Batch deleting responses:', selectedIds);
        await responseService.batchDeleteResponses(selectedIds);
        showMessage(`已刪除 ${selectedIds.length} 筆回應`, 'success');
        setSelectedIds([]);
      }
      console.log('Delete success, reloading...');
      await loadResponses();
      setDeleteDialogOpen(false);
      setDeletingItemId(null);
    } catch (error) {
      console.error('Delete error:', error);
      const errorMsg = error instanceof Error ? error.message : '刪除失敗';
      showMessage(`刪除失敗: ${errorMsg}`, 'error');
    }
  };

  const openDeleteDialog = (id?: string) => {
    if (id) {
      setDeletingItemId(id);
    } else {
      setDeletingItemId(null);
    }
    setDeleteDialogOpen(true);
  };

  const handleGoBack = () => {
    const targetPath = serviceType === 'ENDPOINT' ? '/endpoint' : '/restful';
    router.push(targetPath);
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const filteredResponses = responses.filter(response =>
    Object.values(response).some(value =>
      value.toString().toLowerCase().includes(searchText.toLowerCase())
    )
  );

  const paginatedResponses = filteredResponses.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <IconButton
          onClick={handleGoBack}
          sx={{ p: 1 }}
          title="返回"
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ flex: 1 }}>
          回應清單設定
        </Typography>
      </Box>
        
        {publishUri && (
          <Chip 
            label={`${serviceType}: ${publishUri}`} 
            color="primary" 
            sx={{ mb: 2 }} 
          />
        )}

        <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAdd}
          >
            新增 RESPONSE
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            disabled={selectedIds.length === 0}
            onClick={() => openDeleteDialog()}
          >
            移除 RESPONSE ({selectedIds.length})
          </Button>

          <TextField
            label="搜尋"
            variant="outlined"
            size="small"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            sx={{ ml: 'auto', width: 250 }}
          />
        </Box>

      <Paper elevation={8}>
        <TableContainer>
          <Table sx={{ minWidth: 1200 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ width: '40px' }}>
                  <Checkbox
                    checked={selectedIds.length === filteredResponses.length && filteredResponses.length > 0}
                    indeterminate={selectedIds.length > 0 && selectedIds.length < filteredResponses.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell sx={{ width: '120px', whiteSpace: 'nowrap' }}>發布名稱</TableCell>
                <TableCell sx={{ width: '140px', whiteSpace: 'nowrap' }}>呼叫方法名稱</TableCell>
                <TableCell sx={{ width: '200px' }}>Response條件</TableCell>
                <TableCell sx={{ width: '300px' }}>回應內容</TableCell>
                <TableCell sx={{ width: '80px', whiteSpace: 'nowrap' }}>狀態</TableCell>
                <TableCell sx={{ width: '120px', whiteSpace: 'nowrap' }}>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedResponses.map((response) => (
                <React.Fragment key={response.id}>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedIds.includes(response.id)}
                        onChange={(e) => handleSelect(response.id, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {response.publishUri}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {response.method}
                    </TableCell>
                    <TableCell sx={{ maxWidth: '200px' }}>
                      <Box sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: expandedRows.has(response.id) ? 'none' : 2,
                        WebkitBoxOrient: 'vertical',
                        wordBreak: 'break-word'
                      }}>
                        {response.condition}
                      </Box>
                      {response.condition.length > 100 && (
                        <Button
                          size="small"
                          onClick={() => toggleExpanded(response.id)}
                          sx={{ minWidth: 'auto', p: 0.5, fontSize: '0.75rem' }}
                        >
                          {expandedRows.has(response.id) ? '收起' : '顯示更多'}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell sx={{ maxWidth: '300px' }}>
                      <Box sx={{ 
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: expandedRows.has(`${response.id}-content`) ? 'none' : 3,
                        WebkitBoxOrient: 'vertical',
                        wordBreak: 'break-word'
                      }}>
                        {response.responseContent}
                      </Box>
                      {response.responseContent.length > 200 && (
                        <Button
                          size="small"
                          onClick={() => toggleExpanded(`${response.id}-content`)}
                          sx={{ minWidth: 'auto', p: 0.5, fontSize: '0.75rem' }}
                        >
                          {expandedRows.has(`${response.id}-content`) ? '收起' : '顯示更多'}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={response.isActive}
                        onChange={() => handleSwitchStatus(response)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(response)}
                          title="編輯"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => openDeleteDialog(response.id)}
                          title="刪除"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filteredResponses.length}
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

      {/* 回應表單對話框 */}
      <Dialog open={responseFormOpen} onClose={() => setResponseFormOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingResponse ? '編輯 Response' : '新增 Response'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="呼叫方法名稱"
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              required
              fullWidth
            />
            <TextField
              label="Response條件"
              value={formData.condition}
              onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
              multiline
              rows={4}
              fullWidth
              helperText={'JSON格式的條件，例如: {"employees":null,"name":"Jen","taxId":"123456789"}'}
            />
            <TextField
              label="回應內容"
              value={formData.responseContent}
              onChange={(e) => setFormData({ ...formData, responseContent: e.target.value })}
              multiline
              rows={8}
              fullWidth
              helperText="回應的內容，可以是XML、JSON等格式"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResponseFormOpen(false)}>取消</Button>
          <Button onClick={handleSave} variant="contained">
            {editingResponse ? '更新' : '新增'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 刪除確認對話框 */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>確認刪除</DialogTitle>
        <DialogContent>
          <Typography>
            {deletingItemId 
              ? '確定要刪除此筆回應嗎？此操作無法復原。'
              : `確定要刪除選中的 ${selectedIds.length} 筆回應嗎？此操作無法復原。`
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeleteDialogOpen(false);
            setDeletingItemId(null);
          }}>取消</Button>
          <Button onClick={() => handleDelete()} color="error" variant="contained">
            刪除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 消息提示 */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={() => setShowSnackbar(false)}
      >
        <Alert severity={severity} onClose={() => setShowSnackbar(false)}>
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

// 使用 Suspense 包裹的主組件
export default function ResponsePage() {
  return (
    <Suspense fallback={
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    }>
      <ResponsePageContent />
    </Suspense>
  );
}