import type { Page } from '@playwright/test';
import { test, expect, EP, RF, RSP, fail } from './fixtures/mock-api';
import { originOf } from './fixtures/helpers';

// ISS-REDESIGN-BROWSER-ORIGIN（SHELL-04／RSP-02）：API 位址與頁面來源不同時，
// 頂列主機、SOAP／REST 呼叫位址與剪貼簿內容都要用瀏覽器網址，不用 API 的來源。
//
// 做法：以 http://localhost:3000 開頁（由下方 route 轉給 127.0.0.1:3100 的測試伺服器），
// src/config/config.ts 看到 ':3000' 會改用建置時的 NEXT_PUBLIC_API_URL（playwright.config.ts 設為 http://127.0.0.1:3100），
// 因此 API 送往另一個來源並由 mock-api 攔截，畫面上的位址則應是 localhost:3000。

const PAGE_ORIGIN = 'http://localhost:3000';
const PAGE_HOST = 'localhost:3000';

/** 把 PAGE_ORIGIN 的頁面與靜態資源轉給真正的測試伺服器 */
const serveFrontendFrom = async (page: Page, realOrigin: string) => {
  await page.route(
    (url) => url.origin === PAGE_ORIGIN,
    async (route) => {
      const u = new URL(route.request().url());
      const response = await route.fetch({ url: `${realOrigin}${u.pathname}${u.search}` });
      await route.fulfill({ response });
    },
  );
};

/** 以 stub 取代剪貼簿，記錄寫入內容 */
const stubClipboard = (page: Page) =>
  page.addInitScript(() => {
    const w = window as unknown as { __copied: string[] };
    w.__copied = [];
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          w.__copied.push(text);
        },
      },
    });
  });

test.describe('ISS-REDESIGN-BROWSER-ORIGIN 位址取自瀏覽器網址，不取 API 來源', () => {
  test('前提：API 確實送往不同來源（127.0.0.1:3100），頁面在 localhost:3000', async ({ page, mockApi, baseURL }) => {
    const apiOrigin = originOf(baseURL);
    expect(apiOrigin).not.toBe(PAGE_ORIGIN);
    await serveFrontendFrom(page, apiOrigin);
    const apiRequests: string[] = [];
    page.on('request', (r) => {
      if (/\/dynamic-api\/(ws|api|common)\//.test(r.url())) apiRequests.push(r.url());
    });
    await page.goto(`${PAGE_ORIGIN}/dynamic-api/about/`);
    await expect(page.getByTestId('connection-status')).toHaveAttribute('data-status', 'ok');
    expect(page.url().startsWith(PAGE_ORIGIN)).toBe(true);
    await expect.poll(() => mockApi.callsOf(EP.list).length).toBeGreaterThan(0);
    expect(apiRequests.length).toBeGreaterThan(0);
    for (const u of apiRequests) expect(new URL(u).origin).toBe(apiOrigin);
  });

  test('SHELL-04 頂列顯示瀏覽器 host；連線狀態仍依實際 API 成敗更新', async ({ page, mockApi, baseURL }) => {
    await serveFrontendFrom(page, originOf(baseURL));
    await page.goto(`${PAGE_ORIGIN}/dynamic-api/about/`);
    const status = page.getByTestId('connection-status');
    await expect(status).toHaveAttribute('data-status', 'ok');
    await expect(status).toHaveText(`後端連線正常 · ${PAGE_HOST}`);
    await expect(status).not.toContainText('127.0.0.1');

    mockApi.set(RF.list, fail('資料庫無法連線'));
    await page.reload();
    await expect(status).toHaveAttribute('data-status', 'error');
    await expect(status).toContainText(`後端連線異常 · ${PAGE_HOST}`);
    await expect(status).not.toContainText('127.0.0.1');
  });

  test('RSP-02 SOAP 呼叫位址與剪貼簿內容用瀏覽器 origin', async ({ page, mockApi, baseURL }) => {
    await serveFrontendFrom(page, originOf(baseURL));
    await stubClipboard(page);
    await page.goto(`${PAGE_ORIGIN}/dynamic-api/response/?publishUri=company&serviceType=ENDPOINT`);
    await expect.poll(() => mockApi.callsOf(RSP.list).length).toBeGreaterThan(0);
    const expected = `${PAGE_ORIGIN}/dynamic-api/webservice/company`;
    await expect(page.getByTestId('call-url')).toHaveText(expected);

    await page.getByTestId('service-info').getByRole('button', { name: '複製' }).click();
    await expect(page.getByTestId('toast')).toContainText('已複製呼叫位址');
    expect(await page.evaluate(() => (window as unknown as { __copied: string[] }).__copied)).toEqual([expected]);
  });

  test('RSP-02 REST 呼叫位址與剪貼簿內容用瀏覽器 origin', async ({ page, mockApi, baseURL }) => {
    await serveFrontendFrom(page, originOf(baseURL));
    await stubClipboard(page);
    await page.goto(`${PAGE_ORIGIN}/dynamic-api/response/?publishUri=orders&serviceType=RESTFUL`);
    await expect.poll(() => mockApi.callsOf(RSP.list).length).toBeGreaterThan(0);
    const expected = `${PAGE_ORIGIN}/dynamic-api/orders`;
    await expect(page.getByTestId('call-url')).toHaveText(expected);

    await page.getByTestId('service-info').getByRole('button', { name: '複製' }).click();
    await expect(page.getByTestId('toast')).toContainText('已複製呼叫位址');
    expect(await page.evaluate(() => (window as unknown as { __copied: string[] }).__copied)).toEqual([expected]);
  });
});
