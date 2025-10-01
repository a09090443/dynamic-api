import { apiClient } from './api';
import { Response, ApiResponse } from '@/types/models';
import { ResponseListParams } from '@/types/response';

const BASE_PATH = '/dynamic-api/common';

export const responseService = {
  // 取得回應清單
  async getResponseList(params: ResponseListParams): Promise<Response[]> {
    const response = await apiClient.post(`${BASE_PATH}/getResponseList`, params);
    // 後端回傳格式為 { code: 200, message: "OK", data: [...] }
    return response.data.data || [];
  },

  // 取得回應內容
  async getResponseContent(condition: Record<string, unknown>): Promise<unknown> {
    const response = await apiClient.post(`${BASE_PATH}/getResponseContent`, condition);
    return response.data;
  },

  // 儲存 Mock Response
  async saveMockResponse(responseData: Omit<Response, 'id'>): Promise<ApiResponse<Response>> {
    const response = await apiClient.post(`${BASE_PATH}/saveMockResponse`, responseData);
    return response.data;
  },

  // 更新 Response
  async updateResponse(responseData: Response): Promise<ApiResponse<Response>> {
    const response = await apiClient.post(`${BASE_PATH}/updateResponse`, responseData);
    return response.data;
  },

  // 刪除 Response
  async deleteResponse(ids: string[]): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`${BASE_PATH}/deleteResponse`, {
      data: ids,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },

  // 切換 Response 狀態
  async switchResponse(id: string, isActive: boolean): Promise<ApiResponse<void>> {
    const response = await apiClient.get(`${BASE_PATH}/switchResponse`, {
      params: { id, isActive }
    });
    return response.data;
  },

  // 批量刪除回應
  async batchDeleteResponses(ids: string[]): Promise<ApiResponse<void>> {
    return await this.deleteResponse(ids);
  },
};