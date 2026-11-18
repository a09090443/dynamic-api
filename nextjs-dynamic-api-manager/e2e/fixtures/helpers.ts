import type { Page } from '@playwright/test';

/** 記錄瀏覽器原生 alert／confirm／prompt；測試結束時應為 0 */
export const trackNativeDialogs = (page: Page): string[] => {
  const seen: string[] = [];
  page.on('dialog', (d) => {
    seen.push(`${d.type()}: ${d.message()}`);
    void d.dismiss();
  });
  return seen;
};

/** 整頁沒有橫向捲動 */
export const hasNoPageHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

/** baseURL 的 origin（例如 http://127.0.0.1:3100） */
export const originOf = (baseURL: string | undefined) => new URL(baseURL ?? 'http://127.0.0.1').origin;
