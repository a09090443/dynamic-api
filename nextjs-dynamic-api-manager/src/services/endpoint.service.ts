import { apiClient } from './api';
import { Endpoint, ApiResponse, WsdlGenerationRequest } from '@/types/models';

const BASE_PATH = '/dynamic-api/ws';

export const endpointService = {
  // 取得所有 Endpoint
  async getEndpoints(): Promise<Endpoint[]> {
    const response = await apiClient.get(`${BASE_PATH}/getEndpoints`);
    // 後端回傳格式為 { code: 200, message: "OK", data: [...] }
    return response.data.data || [];
  },

  // 新增 Endpoint
  async saveWebService(endpoint: Omit<Endpoint, 'id'>): Promise<ApiResponse<Endpoint>> {
    // 如果有檔案，先上傳檔案
    let jarFileId = endpoint.jarFileId;
    if (endpoint.file) {
      const uploadResult = await this.uploadJarFile(endpoint.file);
      jarFileId = uploadResult.data.jarFileId;
    }

    // 準備端點數據，不包含檔案欄位
    const { file, ...endpointData } = endpoint;
    const payload = {
      ...endpointData,
      jarFileId
    };

    const response = await apiClient.post(`${BASE_PATH}/saveWebService`, payload);
    return response.data;
  },

  // 更新 Endpoint
  async updateWebService(endpoint: Endpoint): Promise<ApiResponse<Endpoint>> {
    // 如果有檔案，先上傳檔案
    let jarFileId = endpoint.jarFileId;
    if (endpoint.file) {
      const uploadResult = await this.uploadJarFile(endpoint.file);
      jarFileId = uploadResult.data.jarFileId;
    }

    // 準備端點數據，不包含檔案欄位
    const { file, ...endpointData } = endpoint;
    const payload = {
      ...endpointData,
      jarFileId
    };

    const response = await apiClient.post(`${BASE_PATH}/updateWebService`, payload);
    return response.data;
  },

  // 刪除 Endpoint
  async removeWebService(publishUris: string[]): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`${BASE_PATH}/removeWebService`, {
      data: publishUris,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },

  // 切換啟用狀態
  async switchWebService(publishUri: string, isActive: boolean): Promise<ApiResponse<void>> {
    const response = await apiClient.get(`${BASE_PATH}/switchWebService`, {
      params: { publishUri, isActive }
    });
    return response.data;
  },

  // 上傳 Jar 檔案
  async uploadJarFile(file: File): Promise<ApiResponse<{ jarFileId: string; jarFileName: string }>> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/dynamic-api/common/uploadJarFile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // 生成 WSDL 物件：後端讀 wsdlUrl／file／packageName；成功回 ZIP，內容為空回 204，例外回 HTTP 500 純文字
  async genWsdlObj(req: WsdlGenerationRequest): Promise<Blob> {
    const formData = new FormData();
    if (req.file) {
      formData.append('file', req.file);
    } else if (req.wsdlUrl) {
      formData.append('wsdlUrl', req.wsdlUrl);
    }
    if (req.packageName) {
      formData.append('packageName', req.packageName);
    }

    // validateStatus 全收，避免攔截器把 Blob 錯誤內文轉成讀不到的訊息；由這裡判斷成功與否
    const response = await apiClient.post(`${BASE_PATH}/genWsdlObj`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      responseType: 'blob',
      validateStatus: () => true
    });

    const blob: Blob | undefined = response.data;
    const contentType = String(response.headers?.['content-type'] ?? blob?.type ?? '');
    const isTextual = /text\/|json/i.test(contentType);
    if (response.status === 200 && blob && blob.size > 0 && !isTextual) {
      return blob;
    }

    let detail = '';
    if (blob && typeof blob.text === 'function') {
      try {
        detail = (await blob.text()).trim();
      } catch {
        detail = '';
      }
    }
    if (response.status === 204 || !detail) {
      detail = response.status === 204
        ? '後端沒有產生任何檔案（HTTP 204）'
        : `HTTP ${response.status}`;
    } else if (detail.startsWith('{')) {
      try {
        const parsed = JSON.parse(detail) as { message?: string };
        if (parsed.message) detail = parsed.message;
      } catch {
        // 保留原文
      }
    }
    throw new Error(detail.length > 300 ? `${detail.slice(0, 300)}…` : detail);
  }
};