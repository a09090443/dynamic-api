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

  // ISS-RESPONSE-PENDING-EDITOR：儲存請求只作用在送出它的那次編輯
  test('RSP-04／RSP-06 儲存進行中：Esc、關閉、點其他列、新增都不會換掉表單；成功後只關閉原本那次編輯', async ({ page, mockApi }) => {
    mockApi.set(RSP.update, () => ({ json: ok(null), delayMs: 1500 }));
    await page.goto(COMPANY);
    await page.getByTestId('response-row-101').click();
    const p = panel(page);
    await p.getByLabel('回應內容').fill('first-edit');
    await p.getByRole('button', { name: '儲存' }).click();
    await expect(p.getByRole('button', { name: '儲存中…' })).toBeDisabled();

    // 請求進行中嘗試關閉或開啟另一筆
    await p.getByLabel('回應內容').press('Escape');
    await expect(p).toBeVisible();
    await expect(p.getByRole('button', { name: '關閉' })).toBeDisabled();
    await expect(p.getByRole('button', { name: '取消' })).toBeDisabled();
    await expect(page.getByRole('main').getByRole('button', { name: '新增回應' }).first()).toBeDisabled();
    await page.getByTestId('response-row-102').click({ force: true });
    await expect(p.getByRole('heading', { name: '編輯回應' })).toBeVisible();
    await expect(p.getByLabel('方法名稱')).toHaveValue('getCompany');
    await expect(p.getByLabel('回應內容')).toHaveValue('first-edit');
    // 輸入在儲存中為唯讀，送出的內容不會被改掉
    await expect(p.getByLabel('回應內容')).toHaveAttribute('readonly', '');

    // 回應回來後只關閉這次編輯
    await expect(panel(page)).toHaveCount(0);
    await expect(toast(page)).toContainText('已儲存，此回應目前為停用');
    const updates = mockApi.callsOf(RSP.update);
    expect(updates).toHaveLength(1);
    expect(updates[0].body).toMatchObject({ id: '101', method: 'getCompany', responseContent: 'first-edit' });

    // 之後開啟另一筆是正常、獨立的表單
    await page.getByTestId('response-row-102').click();
    await expect(panel(page).getByLabel('方法名稱')).not.toHaveValue('getCompany');
    await expect(panel(page).getByLabel('回應內容')).not.toHaveValue('first-edit');
    await expect(panel(page).getByLabel('回應內容')).not.toHaveAttribute('readonly', '');
    await page.waitForTimeout(300);
    await expect(panel(page)).toBeVisible();
  });

  // ISS-RESPONSE-PENDING-EDITOR：舊儲存請求在離開 /response 後才成功，不得關閉或改寫回到頁面後新開的表單
  test('RSP-06 離開頁面後才成功的舊儲存：回到 /response 新開的表單保持開啟，輸入不變', async ({ page, mockApi }) => {
    let release!: () => void;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    mockApi.set(RSP.update, async () => {
      await gate;
      return { json: ok(null) };
    });

    await page.goto(COMPANY);
    await page.getByTestId('response-row-101').click();
    await panel(page).getByLabel('回應內容').fill('stale-edit');
    await panel(page).getByRole('button', { name: '儲存' }).click();
    await expect(panel(page).getByRole('button', { name: '儲存中…' })).toBeDisabled();
    await expect.poll(() => mockApi.callsOf(RSP.update).length).toBe(1);

    // 標記目前文件，用來證明之後都是用戶端導覽（同一份文件），舊請求仍在等待
    await page.evaluate(() => {
      (window as unknown as { __rspStale?: boolean }).__rspStale = true;
    });
    const nav = page.getByRole('navigation', { name: '主選單' });
    await nav.getByRole('group', { name: '服務' }).getByRole('link', { name: /^SOAP Endpoint/ }).click();
    await expect(page.getByRole('heading', { name: 'SOAP Endpoint', level: 1 })).toBeVisible();
    await page.getByTestId('mock-count-company').click();
    await expect(page.getByRole('heading', { name: 'company 的 Mock 回應', level: 1 })).toBeVisible();

    // 回到頁面後開啟新表單並輸入
    await expect(panel(page)).toHaveCount(0);
    await page.getByRole('main').getByRole('button', { name: '新增回應' }).first().click();
    const p = panel(page);
    await expect(p.getByRole('heading', { name: '新增回應' })).toBeVisible();
    await p.getByLabel('方法名稱').fill('freshMethod');
    await p.getByLabel('條件').fill('fresh=1');
    await p.getByLabel('回應內容').fill('fresh-body');

    // 放行舊的成功回應
    const responded = page.waitForResponse((r) => r.url().includes('/dynamic-api/common/updateResponse'));
    release();
    expect((await responded).status()).toBe(200);
    await page.waitForTimeout(1000);

    expect(await page.evaluate(() => (window as unknown as { __rspStale?: boolean }).__rspStale)).toBe(true);
    await expect(p).toBeVisible();
    await expect(p.getByRole('heading', { name: '新增回應' })).toBeVisible();
    await expect(p.getByLabel('方法名稱')).toHaveValue('freshMethod');
    await expect(p.getByLabel('條件')).toHaveValue('fresh=1');
    await expect(p.getByLabel('回應內容')).toHaveValue('fresh-body');
    await expect(p.getByLabel('回應內容')).not.toHaveAttribute('readonly', '');
    await expect(p.getByRole('button', { name: '儲存' })).toBeEnabled();

    // 新表單照常送出，用的是新輸入
    await p.getByRole('button', { name: '儲存' }).click();
    await expect(panel(page)).toHaveCount(0);
    const saves = mockApi.callsOf(RSP.save);
    expect(saves).toHaveLength(1);
    expect(saves[0].body).toMatchObject({ method: 'freshMethod', condition: 'fresh=1', responseContent: 'fresh-body' });
    expect(mockApi.callsOf(RSP.update)).toHaveLength(1);
  });

  // ISS-RESPONSE-FORMAT-PAYLOAD：格式化只調整結構之間的空白，資料逐字保留
  test('RSP-08 格式化保留資料：JSON 大整數／小數字面值、XML CDATA／註解／屬性值／文字；不安全或無效的內容不變', async ({ page }) => {
    await page.goto(COMPANY);
    await page.getByRole('main').getByRole('button', { name: '新增回應' }).first().click();
    const p = panel(page);
    const content = p.getByLabel('回應內容');
    const format = () => p.getByRole('button', { name: '格式化' }).click();

    await content.fill('{"id":9007199254740993,"price":1.10,"big":1e400,"s":"a, b: {\\"c\\"} [1]","e":[],"o":{ }}');
    await format();
    await expect(content).toHaveValue(
      [
        '{',
        '  "id": 9007199254740993,',
        '  "price": 1.10,',
        '  "big": 1e400,',
        '  "s": "a, b: {\\"c\\"} [1]",',
        '  "e": [],',
        '  "o": {}',
        '}',
      ].join('\n'),
    );
    await expect(p.getByText('內容不是有效的 JSON 或 XML，未格式化')).toHaveCount(0);

    await content.fill(
      '<?xml version="1.0"?><root><data><![CDATA[x><y]]></data>\n<!-- a><b --><item code="a>b">  keep  me </item><p>Hi <b>x</b></p><empty/></root>',
    );
    await format();
    await expect(content).toHaveValue(
      [
        '<?xml version="1.0"?>',
        '<root>',
        '  <data><![CDATA[x><y]]></data>',
        '  <!-- a><b -->',
        '  <item code="a>b">  keep  me </item>',
        '  <p>Hi <b>x</b></p>',
        '  <empty/>',
        '</root>',
      ].join('\n'),
    );

    // 格式錯誤的 XML：不改內容並提示
    await content.fill('<a><b></a>');
    await format();
    await expect(p.getByText('內容不是有效的 JSON 或 XML，未格式化')).toBeVisible();
    await expect(content).toHaveValue('<a><b></a>');
  });

  // ISS-RESPONSE-FORMAT-UNSAFE-HINT：合法但無法安全排版的 XML 不改內容，提示不得誤稱格式無效
  test('RSP-08 合法但無法安全排版的 XML（xml:space、DOCTYPE 內部子集）：內容逐字不變，提示說明原因', async ({ page }) => {
    await page.goto(COMPANY);
    await page.getByRole('main').getByRole('button', { name: '新增回應' }).first().click();
    const p = panel(page);
    const content = p.getByLabel('回應內容');
    const format = () => p.getByRole('button', { name: '格式化' }).click();
    const invalidHint = p.getByText('內容不是有效的 JSON 或 XML，未格式化');
    const unsafeHint = p.getByText('內容是有效的 XML，但含 xml:space 或 DOCTYPE 內部定義，重新排版可能改變資料，因此未格式化');

    const spaceXml = '<root xml:space="preserve"><a>  x  </a>\n   <b>y</b></root>';
    await content.fill(spaceXml);
    await format();
    await expect(content).toHaveValue(spaceXml);
    await expect(unsafeHint).toBeVisible();
    await expect(invalidHint).toHaveCount(0);
    // 合法內容不以錯誤樣式標示
    await expect(content).not.toHaveAttribute('aria-invalid', 'true');

    // 修改內容後提示清除
    await content.fill('<r/>');
    await expect(unsafeHint).toHaveCount(0);

    const doctypeXml = '<!DOCTYPE note [<!ENTITY who "Tove">]><note><to>&who;</to><from>Jani</from></note>';
    await content.fill(doctypeXml);
    await format();
    await expect(content).toHaveValue(doctypeXml);
    await expect(unsafeHint).toBeVisible();
    await expect(invalidHint).toHaveCount(0);

    // 無效內容仍顯示格式無效
    await content.fill('not json <x');
    await format();
    await expect(content).toHaveValue('not json <x');
    await expect(invalidHint).toBeVisible();
    await expect(unsafeHint).toHaveCount(0);
    await expect(content).toHaveAttribute('aria-invalid', 'true');
  });

  test('RSP-06 儲存進行中失敗：關閉／切換被擋下，原輸入與錯誤仍在，可直接再送一次', async ({ page, mockApi }) => {
    mockApi.set(RSP.update, () => ({ json: fail('寫入失敗'), delayMs: 1500 }));
    await page.goto(COMPANY);
    await page.getByTestId('response-row-101').click();
    const p = panel(page);
    await p.getByLabel('條件').fill('k=1');
    await p.getByLabel('回應內容').fill('pending-body');
    await p.getByRole('button', { name: '儲存' }).click();
    await expect(p.getByRole('button', { name: '儲存中…' })).toBeDisabled();
    await p.getByLabel('回應內容').press('Escape');
    await page.getByTestId('response-row-102').click({ force: true });

    await expect(p.getByRole('alert')).toContainText('寫入失敗');
    await expect(p.getByRole('alert')).toContainText('輸入的內容已保留');
    await expect(p.getByLabel('方法名稱')).toHaveValue('getCompany');
    await expect(p.getByLabel('條件')).toHaveValue('k=1');
    await expect(p.getByLabel('回應內容')).toHaveValue('pending-body');
    await expect(p.getByRole('button', { name: '儲存' })).toBeEnabled();
    await expect(p.getByRole('button', { name: '關閉' })).toBeEnabled();

    mockApi.set(RSP.update, ok(null));
    await p.getByRole('button', { name: '儲存' }).click();
    await expect(panel(page)).toHaveCount(0);
    const updates = mockApi.callsOf(RSP.update);
    expect(updates).toHaveLength(2);
    for (const u of updates) {
      expect(u.body).toMatchObject({ id: '101', method: 'getCompany', condition: 'k=1', responseContent: 'pending-body' });
    }
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
