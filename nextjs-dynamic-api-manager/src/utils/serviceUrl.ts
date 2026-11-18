import { appConfig } from '@/config/config';

/** 呼叫位址的來源：apiUrl 為絕對網址時取其 origin，否則用目前瀏覽器網址 */
export function apiOrigin(): string {
  if (typeof window === 'undefined') return '';
  try {
    return new URL(appConfig.apiUrl || window.location.origin, window.location.href).origin;
  } catch {
    return window.location.origin;
  }
}

/** 顯示在頂列的後端主機（不寫死 localhost:8080） */
export function apiHost(): string {
  if (typeof window === 'undefined') return '';
  try {
    return new URL(appConfig.apiUrl || window.location.origin, window.location.href).host;
  } catch {
    return window.location.host;
  }
}

/** 依後端實際網址格式組出服務呼叫位址 */
export function serviceCallUrl(publishUri: string, serviceType: 'ENDPOINT' | 'RESTFUL'): string {
  const base = apiOrigin();
  return serviceType === 'RESTFUL'
    ? `${base}/dynamic-api/${publishUri}`
    : `${base}/dynamic-api/webservice/${publishUri}`;
}
