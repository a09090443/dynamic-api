import { test, expect, EP, RF, fail } from './fixtures/mock-api';
import { hasNoPageHorizontalScroll, trackNativeDialogs } from './fixtures/helpers';

// SC-SHELL-01：全站外框、側欄導覽、真實筆數、麵包屑、連線狀態、窄螢幕；OTH-01 既有頁面入口

const NAV_ITEMS: { label: RegExp; path: string }[] = [
  { label: /^SOAP Endpoint/, path: 'endpoint/' },
  { label: /^RESTful API/, path: 'restful/' },
  { label: /^Mock 回應/, path: 'response/' },
  { label: /^WSDL 轉換/, path: 'wsdl/' },
  { label: /^系統資訊/, path: 'about/' },
];

const BREADCRUMBS: Record<string, string[]> = {
  'endpoint/': ['服務', 'SOAP Endpoint'],
  'restful/': ['服務', 'RESTful API'],
  'response/': ['服務', 'Mock 回應'],
  'wsdl/': ['工具', 'WSDL 轉換'],
  'about/': ['工具', '系統資訊'],
  'test-api/': ['工具', 'API 測試'],
};

test.describe('SC-SHELL-01 全站外框', () => {
  test('側欄：品牌、兩個分組、五個項目，/test-api 不在側欄', async ({ page }) => {
    const dialogs = trackNativeDialogs(page);
    await page.goto('endpoint/');
    const nav = page.getByRole('navigation', { name: '主選單' });
    await expect(nav.getByText('Dynamic API', { exact: true })).toBeVisible();
    await expect(nav.getByText('Mock 伺服器管理', { exact: true })).toBeVisible();

    const services = nav.getByRole('group', { name: '服務' });
    const tools = nav.getByRole('group', { name: '工具' });
    await expect(services.getByRole('link')).toHaveCount(3);
    await expect(tools.getByRole('link')).toHaveCount(2);
    await expect(services.getByRole('link', { name: /^SOAP Endpoint/ })).toHaveAttribute('href', /\/endpoint\/?$/);
    await expect(services.getByRole('link', { name: /^RESTful API/ })).toHaveAttribute('href', /\/restful\/?$/);
    await expect(services.getByRole('link', { name: /^Mock 回應/ })).toHaveAttribute('href', /\/response\/?$/);
    await expect(tools.getByRole('link', { name: /^WSDL 轉換/ })).toHaveAttribute('href', /\/wsdl\/?$/);
    await expect(tools.getByRole('link', { name: /^系統資訊/ })).toHaveAttribute('href', /\/about\/?$/);
    await expect(nav.getByRole('link')).toHaveCount(5);
    await expect(nav.locator('a[href*="test-api"]')).toHaveCount(0);
    expect(dialogs).toEqual([]);
  });

  test('側欄數字等於清單 API 的真實筆數（3／2），不是示意的 12／8', async ({ page }) => {
    await page.goto('about/');
    await expect(page.getByTestId('nav-count-endpoints')).toHaveText('3');
    await expect(page.getByTestId('nav-count-controllers')).toHaveText('2');
  });

  test('側欄數字跟著 API 改變', async ({ page, mockApi }) => {
    mockApi.set(EP.list, { code: 200, message: 'OK', data: [] });
    await page.goto('about/');
    await expect(page.getByTestId('nav-count-endpoints')).toHaveText('0');
    await expect(page.getByTestId('nav-count-controllers')).toHaveText('2');
  });

  for (const item of NAV_ITEMS) {
    test(`目前頁 aria-current 與麵包屑：${item.path}`, async ({ page }) => {
      await page.goto(item.path);
      const nav = page.getByRole('navigation', { name: '主選單' });
      await expect(nav.getByRole('link', { name: item.label })).toHaveAttribute('aria-current', 'page');
      await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
      const crumbs = page.getByRole('navigation', { name: '麵包屑' }).getByRole('listitem');
      await expect(crumbs).toHaveText(BREADCRUMBS[item.path].map((t, i, a) => (i < a.length - 1 ? `${t}/` : t)));
    });
  }

  test('/test-api 網址仍可開啟，側欄沒有目前項', async ({ page }) => {
    await page.goto('test-api/');
    await expect(page.getByRole('heading', { name: 'API 測試頁面' })).toBeVisible();
    await expect(page.getByRole('button', { name: '測試 API' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: '主選單' }).locator('[aria-current="page"]')).toHaveCount(0);
    const crumbs = page.getByRole('navigation', { name: '麵包屑' }).getByRole('listitem');
    await expect(crumbs).toHaveText(['工具/', 'API 測試']);
  });

  test('Mock 回應頁麵包屑：上層服務清單可點、服務名稱、Mock 回應', async ({ page }) => {
    await page.goto('response/?publishUri=company&serviceType=ENDPOINT');
    const bc = page.getByRole('navigation', { name: '麵包屑' });
    await expect(bc.getByRole('listitem')).toHaveText(['SOAP Endpoint/', 'company/', 'Mock 回應']);
    await expect(bc.getByRole('link', { name: 'SOAP Endpoint' })).toHaveAttribute('href', /\/endpoint\/?$/);

    await page.goto('response/?publishUri=orders&serviceType=RESTFUL');
    await expect(bc.getByRole('listitem')).toHaveText(['RESTful API/', 'orders/', 'Mock 回應']);
    await expect(bc.getByRole('link', { name: 'RESTful API' })).toHaveAttribute('href', /\/restful\/?$/);
  });

  test('連線狀態依實際 API 成敗顯示，位址取自目前網址', async ({ page, mockApi, baseURL }) => {
    const host = new URL(baseURL as string).host;
    await page.goto('about/');
    const status = page.getByTestId('connection-status');
    await expect(status).toHaveAttribute('data-status', 'ok');
    await expect(status).toHaveText(`後端連線正常 · ${host}`);
    expect(host).not.toBe('localhost:8080');

    mockApi.set(RF.list, fail('資料庫無法連線'));
    await page.reload();
    await expect(status).toHaveAttribute('data-status', 'error');
    await expect(status).toContainText(`後端連線異常 · ${host}`);

    // 恢復後按「重新檢查」回到正常
    mockApi.set(RF.list, { code: 200, message: 'OK', data: [] });
    await status.getByRole('button', { name: '重新檢查' }).click();
    await expect(status).toHaveAttribute('data-status', 'ok');
  });

  test('getEndpoints 失敗也判定為異常', async ({ page, mockApi }) => {
    mockApi.set(EP.list, () => ({ status: 500, body: 'Internal Server Error', contentType: 'text/plain' }));
    await page.goto('about/');
    await expect(page.getByTestId('connection-status')).toHaveAttribute('data-status', 'error');
  });

  test('375px 窄螢幕：側欄在內容上方，整頁沒有橫向捲動', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const path of ['endpoint/', 'restful/', 'response/?publishUri=company&serviceType=ENDPOINT', 'wsdl/', 'about/']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const nav = await page.getByRole('navigation', { name: '主選單' }).boundingBox();
      const main = await page.getByRole('main').boundingBox();
      expect(nav && main, path).toBeTruthy();
      expect(nav!.y + nav!.height, `${path} 側欄應在內容上方`).toBeLessThanOrEqual(main!.y + 1);
      expect(nav!.width, `${path} 側欄應佔滿寬度`).toBeGreaterThan(360);
      expect(await hasNoPageHorizontalScroll(page), `${path} 不可整頁橫向捲動`).toBe(true);
    }
  });

  test('桌面寬度：側欄在左側，寬 232', async ({ page }) => {
    await page.goto('endpoint/');
    const nav = await page.getByRole('navigation', { name: '主選單' }).boundingBox();
    const main = await page.getByRole('main').boundingBox();
    expect(Math.round(nav!.width)).toBe(232);
    expect(main!.x).toBeGreaterThanOrEqual(nav!.x + nav!.width - 1);
    const topbar = await page.locator('header').first().boundingBox();
    expect(Math.round(topbar!.height)).toBe(56);
    expect(await hasNoPageHorizontalScroll(page)).toBe(true);
  });

  test('OTH-01：/restful、/about、/test-api 在新外框內並保留原有功能入口', async ({ page }) => {
    await page.goto('restful/');
    await expect(page.getByRole('navigation', { name: '主選單' })).toBeVisible();
    await expect(page.getByRole('button', { name: '新增 Restful' })).toBeVisible();
    await expect(page.getByRole('button', { name: '編輯 e2e-inventory-restful' })).toBeVisible();
    await expect(page.getByRole('button', { name: '刪除 e2e-inventory-restful' })).toBeVisible();
    await expect(page.getByLabel('e2e-inventory-restful 狀態')).toBeVisible();

    await page.goto('about/');
    await expect(page.getByRole('navigation', { name: '主選單' })).toBeVisible();
    await expect(page.getByRole('heading', { name: '系統資訊', level: 1 })).toBeVisible();
    await expect(page.getByText('主要功能')).toBeVisible();

    await page.goto('test-api/');
    await expect(page.getByRole('navigation', { name: '主選單' })).toBeVisible();
    await expect(page.getByRole('button', { name: '測試 API' })).toBeVisible();
  });
});
