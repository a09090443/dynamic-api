export enum ServiceType {
  RESTFUL = 'RESTFUL',
  ENDPOINT = 'ENDPOINT'
}

export interface BaseModel {
  id: string;
  publishUri: string;
  classPath: string;
  jarFileId: string;
  jarFileName: string;
  file: File | null;
  isActive: boolean;
}

export interface Endpoint extends BaseModel {
  beanName: string;
  ignoreCdata: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Restful extends BaseModel {
  // Inherits all properties from BaseModel
}

export interface Response {
  id: string;
  publishUri: string;
  method: string;
  condition: string;
  responseContent: string;
  serviceType: ServiceType;
  isActive: boolean;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

/** POST /ws/genWsdlObj 的 multipart 欄位；網址模式送 wsdlUrl、檔案模式送 file，packageName 選填 */
export interface WsdlGenerationRequest {
  wsdlUrl?: string;
  file?: File;
  packageName?: string;
}