// Response 資料類型定義
export interface Response {
  id: string;
  publishUri: string;
  method: string;
  condition: string;
  responseContent: string;
  isActive: boolean;
  serviceType: 'ENDPOINT' | 'RESTFUL';
}

// Response 相關 API 回應類型
export interface ResponseListParams {
  publishUri: string;
  serviceType: 'ENDPOINT' | 'RESTFUL';
}

// 通用 API 回應格式
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}