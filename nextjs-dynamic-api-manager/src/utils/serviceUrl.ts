// 畫面上顯示的主機與呼叫位址一律取目前瀏覽器網址。
// appConfig.apiUrl 只決定 API 請求送往哪裡（開發模式可能是不同來源的絕對網址），不拿來組畫面位址。

/** 目前瀏覽器網址的 origin（例如 http://host:8080） */
export function browserOrigin(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

/** 顯示在頂列的主機（不寫死 localhost:8080） */
export function browserHost(): string {
  if (typeof window === 'undefined') return '';
  return window.location.host;
}

/** 依後端實際網址格式組出服務呼叫位址 */
export function serviceCallUrl(publishUri: string, serviceType: 'ENDPOINT' | 'RESTFUL'): string {
  const base = browserOrigin();
  return serviceType === 'RESTFUL'
    ? `${base}/dynamic-api/${publishUri}`
    : `${base}/dynamic-api/webservice/${publishUri}`;
}
