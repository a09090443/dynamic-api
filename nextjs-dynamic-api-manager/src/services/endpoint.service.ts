import { apiClient, createFormData } from './api';
import { Endpoint, ApiResponse } from '@/types/models';

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

  // 生成 WSDL 物件
  async genWsdlObj(wsdlData: { wsdlPath?: string; file?: File }): Promise<Blob> {
    const formData = createFormData(wsdlData as unknown as Record<string, unknown>, wsdlData.file);
    
    const response = await apiClient.post(`${BASE_PATH}/genWsdlObj`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      responseType: 'blob'
    });
    return response.data;
  }
};