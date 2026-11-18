import type { Page } from '@playwright/test';
import { test, expect, RSP, ok, fail } from './fixtures/mock-api';
import { hasNoPageHorizontalScroll, originOf, trackNativeDialogs } from './fixtures/helpers';

const COMPANY = 'response/?publishUri=company&serviceType=ENDPOINT';
const panel = (page: Page) => page.getByTestId('response-panel');
const toast = (page: Page) => page.getByTestId('toast');

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

test.describe('SC-RESPONSE-01 Mock 回應頁：查詢參數、資訊卡、表格、面板、引導與資料狀態', () => {
  test('RSP-01／RSP-02 SOAP 服務：標題、說明、查詢參數、徽章、狀態、呼叫位址與複製', async ({ page, mockApi, baseURL }) => {
    await stubClipboard(page);
    await page.goto(COMPANY);
    await expect(page.getByRole('heading', { name: 'company 的 Mock 回應', level: 1 })).toBeVisible();
    await expect(page.getByText('呼叫時以 方法 + 條件 完全相同且啟用的那一筆回應。', { exact: true })).toBeVisible();
    await expect.poll(() => mockApi.callsOf(RSP.list).length).toBeGreaterThan(0);
    expect(mockApi.callsOf(RSP.list)[0].body).toEqual({ publishUri: 'company', serviceType: 'ENDPOINT' });

    const info = page.getByTestId('service-info');
    const soap = info.getByText('SOAP', { exact: true });
    await expect(soap).toHaveCSS('color', 'rgb(109, 40, 217)');
    await expect(soap).toHaveCSS('background-color', 'rgb(237, 233, 254)');
    await expect(page.getByTestId('service-status')).toContainText('● 停用');

    const url = `${originOf(baseURL)}/dynamic-api/webservice/company`;
    const callUrl = page.getByTestId('call-url');
    await expect(callUrl).toHaveText(url);
    await expect(callUrl).toHaveCSS('text-overflow', 'ellipsis');
    await expect(callUrl).toHaveCSS('white-space', 'nowrap');

    await info.getByRole('button', { name: '複製' }).click();
    await expect(toast(page)).toContainText('已複製呼叫位址');
    expect(await page.evaluate(() => (window as unknown as { __copied: string[] }).__copied)).toEqual([url]);
  });

  test('RSP-02 RESTful 服務：REST 青色徽章與 /dynamic-api/<publishUri> 呼叫位址', async ({ page, mockApi, baseURL }) => {
    await page.goto('response/?publishUri=orders&serviceType=RESTFUL');
    await expect(page.getByRole('heading', { name: 'orders 的 Mock 回應', level: 1 })).toBeVisible();
    await expect.poll(() => mockApi.callsOf(RSP.list).length).toBeGreaterThan(0);
    expect(mockApi.callsOf(RSP.list)[0].body).toEqual({ publishUri: 'orders', serviceType: 'RESTFUL' });
    const rest = page.getByTestId('service-info').getByText('REST', { exact: true });
    await expect(rest).toHaveCSS('color', 'rgb(14, 116, 144)');
    await expect(rest).toHaveCSS('background-color', 'rgb(207, 250, 254)');
    await expect(page.getByTestId('service-status')).toContainText('● 啟用');
    await expect(page.getByTestId('call-url')).toHaveText(`${originOf(baseURL)}/dynamic-api/orders`);
    await expect(page.getByRole('cell', { name: 'GET /orders', exact: true })).toBeVisible();
  });

  test('RSP-03／RSP-04 表格欄位、空條件、單行截斷；面板預設關閉，點列開啟並可收起', async ({ page }) => {
    await page.goto(COMPANY);
    await expect(page.getByRole('table').locator('thead th')).toHaveText(['方法', '條件', '回應內容', '狀態']);

    const row = page.getByTestId('response-row-101');
    await expect(row.getByText('（無條件）', { exact: true })).toBeVisible();
    await expect(page.getByTestId('response-row-102').getByText('{"taxId":"123"}')).toBeVisible();
    const content = row.getByTestId('response-content-cell');
    await expect(content).toHaveCSS('white-space', 'nowrap');
    await expect(content).toHaveCSS('text-overflow', 'ellipsis');
    await expect(content).toHaveCSS('max-width', '280px');
    expect(await content.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(true);

    await expect(panel(page)).toHaveCount(0);
    await row.click();
    await expect(panel(page)).toBeVisible();
    await expect(panel(page).getByRole('heading', { name: '編輯回應' })).toBeVisible();
    const aside = page.getByRole('complementary', { name: '回應編輯面板' });
    expect(Math.round((await aside.boundingBox())!.width)).toBe(400);
    await expect(row).toHaveCSS('background-color', 'rgb(245, 248, 255)');
    await expect(row).toHaveCSS('box-shadow', /rgb\(37, 99, 235\) 3px 0px 0px 0px inset/);

    await expect(panel(page).getByLabel('方法名稱')).toHaveValue('getCompany');
    await expect(panel(page).getByLabel('條件')).toHaveValue('');
    await expect(panel(page).getByLabel('回應內容')).toHaveCSS('font-family', /JetBrains Mono/);
    await expect(panel(page).getByRole('button', { name: '格式化' })).toBeVisible();
    await expect(panel(page).getByText('儲存後此回應會變為停用，需再手動啟用。')).toBeVisible();

    await panel(page).getByRole('button', { name: '取消' }).click();
    await expect(panel(page)).toHaveCount(0);

    await row.click();
    await panel(page).getByRole('button', { name: '關閉' }).click();
    await expect(panel(page)).toHaveCount(0);

    // 鍵盤：Enter 開啟、Esc 收起
    await row.focus();
    await page.keyboard.press('Enter');
    await expect(panel(page)).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(panel(page)).toHaveCount(0);
  });

  test('RSP-04 窄螢幕：面板以覆蓋方式完整顯示，整頁無橫向捲動', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(COMPANY);
    await page.getByTestId('response-row-101').click();
    await expect(panel(page)).toBeVisible();
    // 等抽屜滑入動畫結束再量尺寸
    await expect(panel(page).getByRole('button', { name: '儲存' })).toBeInViewport({ ratio: 1 });
    await expect
      .poll(async () => {
        const b = (await panel(page).boundingBox())!;
        return b.x >= 0 && b.x + b.width <= 376;
      })
      .toBe(true);
    expect(await hasNoPageHorizontalScroll(page)).toBe(true);
  });

  test('RSP-08 沒有 publishUri：顯示引導與兩個清單連結，完全不呼叫 getResponseList', async ({ page, mockApi }) => {
    await page.goto('response/');
    const guide = page.getByTestId('no-service-guide');
    await expect(guide).toContainText('請先選擇服務');
    await expect(guide.getByRole('link', { name: '前往 SOAP Endpoint' })).toHaveAttribute('href', /\/endpoint\/?$/);
    await expect(guide.getByRole('link', { name: '前往 RESTful API' })).toHaveAttribute('href', /\/restful\/?$/);
    // 等側欄筆數載入（代表初始請求已完成）再確認沒有查詢
    await expect(page.getByTestId('nav-count-endpoints')).toHaveText('3');
    await page.waitForTimeout(300);
    expect(mockApi.callsOf(RSP.list)).toHaveLength(0);
  });

  test('RSP-09 載入中、無回應資料、載入失敗與重試', async ({ page, mockApi }) => {
    mockApi.set(RSP.list, () => ({ json: ok([]), delayMs: 1500 }));
    await page.goto(COMPANY);
    await expect(page.getByTestId('loading-state')).toBeVisible();
    await expect(page.getByTestId('empty-state')).toContainText('這個服務還沒有 Mock 回應');
    await expect(page.getByTestId('empty-state').getByRole('button', { name: '新增回應' })).toBeVisible();

    mockApi.set(RSP.list, fail('查詢逾時'));
    await page.reload();
    const error = page.getByTestId('error-state');
    await expect(error).toContainText('查詢逾時');
    mockApi.set(RSP.list, ok([]));
    await error.getByRole('button', { name: '重新載入' }).click();
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });
});

test.describe('SC-RESPONSE-02 Mock 回應：新增／編輯驗證、格式化、儲存錯誤、刪除與啟停', () => {
  test('RSP-05／RSP-06 新增：空白初值、必填驗證、格式化失敗不改內容、成功用 saveMockResponse', async ({ page, mockApi }) => {
    const dialogs = trackNativeDialogs(page);
    await page.goto(COMPANY);
    await page.getByRole('main').getByRole('button', { name: '新增回應' }).first().click();
    const p = panel(page);
    await expect(p.getByRole('heading', { name: '新增回應' })).toBeVisible();
    await expect(p.getByLabel('方法名稱')).toHaveValue('');
    await expect(p.getByLabel('條件')).toHaveValue('');
    await expect(p.getByLabel('回應內容')).toHaveValue('');
    await expect(p.getByLabel('方法名稱')).toBeFocused();

    await p.getByRole('button', { name: '儲存' }).click();
    await expect(p.getByText('請輸入方法名稱，需與 JAR 程式傳入的 method 一致')).toBeVisible();
    await expect(p.getByLabel('方法名稱')).toHaveAttribute('aria-invalid', 'true');
    expect(mockApi.callsOf(RSP.save)).toHaveLength(0);

    const content = p.getByLabel('回應內容');
    await content.fill('plain-text-{');
    await p.getByRole('button', { name: '格式化' }).click();
    await expect(p.getByText('內容不是有效的 JSON 或 XML，未格式化')).toBeVisible();
    await expect(content).toHaveValue('plain-text-{');

    await content.fill('{"a":1,"b":[2]}');
    await p.getByRole('button', { name: '格式化' }).click();
    await expect(content).toHaveValue('{\n  "a": 1,\n  "b": [\n    2\n  ]\n}');
    await content.fill('<a><b>1</b></a>');
    await p.getByRole('button', { name: '格式化' }).click();
    await expect(content).toHaveValue('<a>\n  <b>1</b>\n</a>');

    await p.getByLabel('方法名稱').fill('newMethod');
    await p.getByLabel('條件').fill('id=9');
    await p.getByRole('button', { name: '儲存' }).click();
    await expect(panel(page)).toHaveCount(0);
    await expect(toast(page)).toContainText('已儲存，此回應目前為停用');
    const saves = mockApi.callsOf(RSP.save);
    expect(saves).toHaveLength(1);
    expect(saves[0].body).toMatchObject({
      publishUri: 'company',
      serviceType: 'ENDPOINT',
      method: 'newMethod',
      condition: 'id=9',
      responseContent: '<a>\n  <b>1</b>\n</a>',
    });
    expect(mockApi.callsOf(RSP.update)).toHaveLength(0);
    expect(dialogs).toEqual([]);
  });

  test('RSP-06 編輯：儲存失敗保留輸入，成功時用 updateResponse 並帶原 ID', async ({ page, mockApi }) => {
    mockApi.set(RSP.update, fail('寫入失敗'));
    await page.goto(COMPANY);
    await page.getByTestId('response-row-101').click();
    const p = panel(page);
    await p.getByLabel('回應內容').fill('edited-body');
    await p.getByRole('button', { name: '儲存' }).click();
    await expect(p.getByRole('alert')).toContainText('寫入失敗');
    await expect(p).toBeVisible();
    await expect(p.getByLabel('回應內容')).toHaveValue('edited-body');
    await expect(p.getByLabel('方法名稱')).toHaveValue('getCompany');

    mockApi.set(RSP.update, ok(null));
    await p.getByRole('button', { name: '儲存' }).click();
    await expect(panel(page)).toHaveCount(0);
    const updates = mockApi.callsOf(RSP.update);
    expect(updates).toHaveLength(2);
    expect(updates[1].body).toMatchObject({ id: '101', method: 'getCompany', responseContent: 'edited-body' });
    expect(mockApi.callsOf(RSP.save)).toHaveLength(0);
  });

  test('RSP-06 刪除：先確認再呼叫 deleteResponse，不提供復原', async ({ page, mockApi }) => {
    const dialogs = trackNativeDialogs(page);
    await page.goto(COMPANY);
    await page.getByTestId('response-row-101').click();
    await panel(page).getByRole('button', { name: '刪除' }).click();
    const confirm = page.getByRole('dialog', { name: '刪除此回應？' });
    await expect(confirm).toContainText('無法復原');
    expect(mockApi.callsOf(RSP.remove)).toHaveLength(0);
    await confirm.getByRole('button', { name: '刪除' }).click();
    await expect(toast(page)).toContainText('已刪除回應');
    await expect(toast(page).getByRole('button', { name: '復原' })).toHaveCount(0);
    expect(mockApi.callsOf(RSP.remove).map((c) => c.body)).toEqual([['101']]);
    expect(dialogs).toEqual([]);
  });

  test('RSP-07 啟停：確認後呼叫 switchResponse，復原送反向請求；不會順便開啟面板', async ({ page, mockApi }) => {
    const dialogs = trackNativeDialogs(page);
    await page.goto(COMPANY);
    const sw = page.getByLabel('getCompany 回應 狀態');
    await expect(sw).not.toBeChecked();
    await sw.click();
    await expect(panel(page)).toHaveCount(0);
    await page.getByRole('dialog', { name: '啟用 getCompany 回應？' }).getByRole('button', { name: '啟用' }).click();
    await expect(toast(page)).toContainText('已啟用 getCompany 回應');
    await expect(sw).toBeChecked();
    await toast(page).getByRole('button', { name: '復原' }).click();
    await expect(sw).not.toBeChecked();
    expect(mockApi.callsOf(RSP.switch).map((c) => c.query)).toEqual([
      { id: '101', isActive: 'true' },
      { id: '101', isActive: 'false' },
    ]);
    expect(dialogs).toEqual([]);
  });

  test('RSP-07 啟停失敗（HTTP 500 與網路錯誤）：開關維持原狀', async ({ page, mockApi }) => {
    mockApi.set(RSP.switch, () => ({ status: 500, body: 'Internal Server Error', contentType: 'text/plain' }));
    await page.goto(COMPANY);
    const sw = page.getByLabel('listCompany 回應 狀態');
    await expect(sw).toBeChecked();
    await sw.click();
    await page.getByRole('dialog', { name: '停用 listCompany 回應？' }).getByRole('button', { name: '停用' }).click();
    await expect(toast(page)).toContainText('無法停用 listCompany 回應');
    await expect(sw).toBeChecked();

    mockApi.set(RSP.switch, () => ({ abort: true }));
    await sw.click();
    await page.getByRole('dialog', { name: '停用 listCompany 回應？' }).getByRole('button', { name: '停用' }).click();
    await expect(toast(page)).toContainText('無法停用 listCompany 回應');
    await expect(sw).toBeChecked();
    expect(mockApi.callsOf(RSP.switch)).toHaveLength(2);
  });
});
