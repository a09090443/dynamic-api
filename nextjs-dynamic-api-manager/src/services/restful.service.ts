import { apiClient } from './api';
import { Restful, ApiResponse } from '@/types/models';

const BASE_PATH = '/dynamic-api/api';

export const restfulService = {
  // 取得所有 Restful Controller
  async getControllers(): Promise<Restful[]> {
    const response = await apiClient.get(`${BASE_PATH}/getControllers`);
    // 後端回傳格式為 { code: 200, message: "OK", data: [...] }
    return response.data.data || [];
  },

  // 儲存新的 Controller
  async saveController(restful: Omit<Restful, 'id'>): Promise<ApiResponse<Restful>> {
    let jarFileId = restful.jarFileId || '';
    
    // 如果有新檔案，先上傳檔案
    if (restful.file) {
      const uploadFormData = new FormData();
      uploadFormData.append('file', restful.file);
      
      const uploadResponse = await apiClient.post('/dynamic-api/common/uploadJarFile', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (uploadResponse.data.code === 200) {
        // 檢查回傳的數據格式
        const uploadData = uploadResponse.data.data;
        jarFileId = typeof uploadData === 'string' ? uploadData : uploadData.jarFileId;
      } else {
        throw new Error(uploadResponse.data.message || '檔案上傳失敗');
      }
    }

    // 發送 JSON 數據到 saveController
    const { file, ...restfulData } = restful;
    const controllerData = {
      ...restfulData,
      jarFileId
    };

    const response = await apiClient.post(`${BASE_PATH}/saveController`, controllerData);
    return response.data;
  },

  // 更新 Controller
  async updateController(restful: Restful): Promise<ApiResponse<Restful>> {
    let jarFileId = restful.jarFileId || '';
    
    // 如果有新檔案，先上傳檔案
    if (restful.file) {
      const uploadFormData = new FormData();
      uploadFormData.append('file', restful.file);
      
      const uploadResponse = await apiClient.post('/dynamic-api/common/uploadJarFile', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (uploadResponse.data.code === 200) {
        // 檢查回傳的數據格式
        const uploadData = uploadResponse.data.data;
        jarFileId = typeof uploadData === 'string' ? uploadData : uploadData.jarFileId;
      } else {
        throw new Error(uploadResponse.data.message || '檔案上傳失敗');
      }
    }

    // 發送 JSON 數據到 updateController
    const { file, ...restfulData } = restful;
    const controllerData = {
      ...restfulData,
      jarFileId
    };

    const response = await apiClient.post(`${BASE_PATH}/updateController`, controllerData);
    return response.data;
  },

  // 移除 Controller
  async removeController(publishUris: string[]): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`${BASE_PATH}/removeController`, {
      data: publishUris,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },

  // 切換 Controller 狀態
  async switchController(publishUri: string, isActive: boolean): Promise<ApiResponse<void>> {
    const response = await apiClient.get(`${BASE_PATH}/switchController`, {
      params: { publishUri, isActive }
    });
    return response.data;
  }
};