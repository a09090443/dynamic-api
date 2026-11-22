import type { Page } from '@playwright/test';
import { test, expect } from './fixtures/mock-api';
import { hasNoPageHorizontalScroll } from './fixtures/helpers';

// SC-LAYOUT-E2E-01（issue #18）：桌面寬度主內容填滿側欄右側，不受 1280 上限限制；
// 系統顯示比例（deviceScaleFactor）下同樣填滿且不整頁橫向捲動

const SIDEBAR = 232;
/** 桌面右側內距 32，容許 ±2 */
const RIGHT_GAP = 34;
/** 桌面左右內距合計 */
const PAD_X = 64;

const box = async (page: Page, locator: ReturnType<Page['locator']>, label: string) => {
  const b = await locator.boundingBox();
  expect(b, `${label} 應可見`).toBeTruthy();
  return b!;
};

/** 主內容緊接側欄、右緣貼近視窗右緣，回傳 main 的 bounding box */
const expectMainFills = async (page: Page, width: number, label: string) => {
  const nav = await box(page, page.getByRole('navigation', { name: '主選單' }), `${label} 側欄`);
  const main = await box(page, page.getByRole('main'), `${label} main`);
  expect(Math.round(nav.width), `${label} 側欄寬`).toBe(SIDEBAR);
  expect(Math.abs(main.x - SIDEBAR), `${label} main 左緣應緊接側欄`).toBeLessThanOrEqual(1);
  expect(main.x + main.width, `${label} main 右緣應貼近視窗右緣`).toBeGreaterThanOrEqual(width - RIGHT_GAP);
  expect(await hasNoPageHorizontalScroll(page), `${label} 不可整頁橫向捲動`).toBe(true);
  return main;
};

/** 表格容器隨主內容延伸 */
const expectTableFills = async (page: Page, tableName: string, main: { width: number }, width: number) => {
  const container = page.getByRole('table', { name: tableName }).locator('xpath=ancestor::div[contains(@class,"MuiTableContainer-root")][1]');
  const t = await box(page, container, `${tableName} 容器`);
  expect(t.width, `${tableName} 容器寬應填滿主內容（扣內距）`).toBeGreaterThanOrEqual(main.width - PAD_X - 4);
  expect(t.x + t.width, `${tableName} 容器右緣應貼近視窗右緣`).toBeGreaterThanOrEqual(width - RIGHT_GAP - 2);
};

const openList = async (page: Page, path: string, tableName: string) => {
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('table', { name: tableName })).toBeVisible();
};

test.describe('SC-LAYOUT-E2E-01 寬螢幕 2560×1300', () => {
  test.use({ viewport: { width: 2560, height: 1300 } });

  test('AC-FILL-2560／AC-FILL-TABLE：/endpoint 主內容與表格填滿側欄右側', async ({ page }) => {
    await openList(page, 'endpoint/', 'SOAP Endpoint 清單');
    const main = await expectMainFills(page, 2560, '/endpoint 2560');
    expect(main.width, '主內容不可停在 1280').toBeGreaterThan(1280 + 500);
    await expectTableFills(page, 'SOAP Endpoint 清單', main, 2560);
  });

  test('/restful 主內容與表格同樣延伸', async ({ page }) => {
    await openList(page, 'restful/', 'RESTful API 清單');
    const main = await expectMainFills(page, 2560, '/restful 2560');
    await expectTableFills(page, 'RESTful API 清單', main, 2560);
  });

  test('AC-FILL-RESPONSE：Mock 回應清單與編輯面板共同填滿寬度', async ({ page }) => {
    await openList(page, 'response/?publishUri=company&serviceType=ENDPOINT', 'Mock 回應清單');
    await page.getByRole('button', { name: '新增回應' }).first().click();
    const aside = page.getByRole('complementary', { name: '回應編輯面板' });
    await expect(aside).toBeVisible();

    await expectMainFills(page, 2560, '/response 2560');
    const panel = await box(page, aside, '編輯面板');
    expect(Math.abs(panel.width - 400), '編輯面板寬約 400').toBeLessThanOrEqual(2);
    expect(panel.x + panel.width, '編輯面板右緣應貼近視窗右緣').toBeGreaterThanOrEqual(2560 - RIGHT_GAP);

    const list = page.getByRole('table', { name: 'Mock 回應清單' }).locator('xpath=ancestor::div[contains(@class,"MuiTableContainer-root")][1]');
    const l = await box(page, list, 'Mock 回應清單');
    // 清單與面板之間只有 20 的間距（容許邊框誤差）
    expect(panel.x - (l.x + l.width), '清單應延伸到面板左側').toBeLessThanOrEqual(24);
    expect(l.x, '清單應從主內容左側開始').toBeLessThanOrEqual(SIDEBAR + 32 + 2);
  });
});

for (const vp of [
  { width: 1920, height: 1080 },
  { width: 1280, height: 800 },
]) {
  test.describe(`AC-FILL-MID ${vp.width}×${vp.height}`, () => {
    test.use({ viewport: vp });

    test(`/endpoint 主內容填滿且無整頁橫向捲動（${vp.width}）`, async ({ page }) => {
      await openList(page, 'endpoint/', 'SOAP Endpoint 清單');
      const main = await expectMainFills(page, vp.width, `/endpoint ${vp.width}`);
      await expectTableFills(page, 'SOAP Endpoint 清單', main, vp.width);
    });
  });
}

for (const s of [
  { id: 'AC-SCALE-150', dpr: 1.5, width: 1692, height: 835 },
  { id: 'AC-SCALE-125', dpr: 1.25, width: 2048, height: 1000 },
]) {
  test.describe(`${s.id} 顯示比例 ${s.dpr * 100}%`, () => {
    test.use({ viewport: { width: s.width, height: s.height }, deviceScaleFactor: s.dpr });

    test(`/endpoint 在 deviceScaleFactor ${s.dpr}、${s.width}×${s.height} 填滿側欄右側`, async ({ page }) => {
      await openList(page, 'endpoint/', 'SOAP Endpoint 清單');
      expect(await page.evaluate(() => window.devicePixelRatio)).toBe(s.dpr);
      const main = await expectMainFills(page, s.width, `/endpoint dpr ${s.dpr}`);
      await expectTableFills(page, 'SOAP Endpoint 清單', main, s.width);
    });
  });
}
