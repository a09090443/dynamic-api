import type { Page } from '@playwright/test';
import { test, expect, EP, RSP, ok, fail, type MockHandler } from './fixtures/mock-api';
import { manyEndpoints, endpoints } from './fixtures/mock-data';
import { trackNativeDialogs } from './fixtures/helpers';

const rows = (page: Page) => page.getByRole('table').locator('tbody tr');
const row = (page: Page, uri: string) => page.getByTestId(`row-${uri}`);
const toast = (page: Page) => page.getByTestId('toast');

test.describe('SC-ENDPOINT-01 Endpoint 清單：文案、統計、搜尋、篩選、分頁、表格與資料狀態', () => {
  test('EP-01 頁首文案與兩個按鈕', async ({ page }) => {
    await page.goto('endpoint/');
    await expect(page.getByRole('heading', { name: 'SOAP Endpoint', level: 1 })).toBeVisible();
    await expect(
      page.getByText('從上傳的 JAR 發布的 Web Service。新建或編輯後預設為停用，確認 Mock 回應後再啟用。', { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('main').getByRole('link', { name: 'WSDL 轉換' })).toHaveAttribute('href', /\/wsdl\/?$/);

    await page.getByRole('main').getByRole('button', { name: '新增 Endpoint' }).click();
    const dialog = page.getByRole('dialog', { name: '新增 Endpoint' });
    await expect(dialog).toBeVisible();
    // 沿用 EndpointForm 的欄位
    await expect(dialog.getByRole('textbox').first()).toBeVisible();
  });

  test('EP-02／EP-03 統計、篩選數量、分頁與搜尋都由 API 資料計算', async ({ page, mockApi }) => {
    mockApi.set(EP.list, ok(manyEndpoints));
    await page.goto('endpoint/');

    // 13 筆：啟用 4（3、6、9、12）、停用 9、沒有 JAR 3（4、8、12）
    await expect(page.getByTestId('stat-全部服務')).toHaveText('13');
    await expect(page.getByTestId('stat-啟用中')).toHaveText('4');
    await expect(page.getByTestId('stat-尚未上傳 JAR')).toHaveText('3');
    await expect(page.getByTestId('stat-啟用中')).toHaveCSS('color', 'rgb(21, 128, 61)');
    await expect(page.getByTestId('stat-尚未上傳 JAR')).toHaveCSS('color', 'rgb(180, 83, 9)');

    const filter = page.getByRole('group', { name: '狀態篩選' });
    await expect(filter.getByRole('button')).toHaveText(['全部 13', '啟用 4', '停用 9']);
    await expect(filter.getByRole('button', { name: '全部 13' })).toHaveAttribute('aria-pressed', 'true');

    await expect(page.getByTestId('pagination-summary')).toHaveText('顯示 1–10，共 13 筆');
    await expect(rows(page)).toHaveCount(10);
    await page.getByRole('button', { name: '第 2 頁' }).click();
    await expect(page.getByTestId('pagination-summary')).toHaveText('顯示 11–13，共 13 筆');
    await expect(rows(page)).toHaveCount(3);
    await expect(page.getByRole('button', { name: '下一頁' })).toBeDisabled();

    // 每頁筆數 10／50／100
    await page.getByRole('combobox', { name: /每頁/ }).click();
    await expect(page.getByRole('option')).toHaveText(['10', '50', '100']);
    await page.getByRole('option', { name: '50' }).click();
    await expect(page.getByTestId('pagination-summary')).toHaveText('顯示 1–13，共 13 筆');
    await expect(page.getByRole('button', { name: '上一頁' })).toBeDisabled();

    // 搜尋三個欄位：發布名稱、Bean、Class 路徑
    const search = page.getByRole('textbox', { name: '搜尋 Endpoint' });
    await expect(search).toHaveAttribute('placeholder', '搜尋發布名稱、Bean、Class 路徑');
    await search.fill('alpha-uri');
    await expect(rows(page)).toHaveCount(1);
    await expect(row(page, 'alpha-uri-only')).toBeVisible();
    await search.fill('betabean');
    await expect(rows(page)).toHaveCount(1);
    await expect(row(page, 'svc-02')).toBeVisible();
    await search.fill('com.gamma');
    await expect(rows(page)).toHaveCount(1);
    await expect(row(page, 'svc-03')).toBeVisible();
    await search.fill('');

    // 單選狀態篩選
    await filter.getByRole('button', { name: '啟用 4' }).click();
    await expect(filter.getByRole('button', { name: '啟用 4' })).toHaveAttribute('aria-pressed', 'true');
    await expect(filter.getByRole('button', { name: '全部 13' })).toHaveAttribute('aria-pressed', 'false');
    await expect(filter.getByRole('button', { name: '停用 9' })).toHaveAttribute('aria-pressed', 'false');
    await expect(rows(page)).toHaveCount(4);
    await expect(page.getByTestId('pagination-summary')).toHaveText('顯示 1–4，共 4 筆');
    await filter.getByRole('button', { name: '停用 9' }).click();
    await expect(filter.locator('[aria-pressed="true"]')).toHaveCount(1);
    await expect(page.getByTestId('pagination-summary')).toHaveText('顯示 1–9，共 9 筆');
  });

  // ISS-ENDPOINT-STATS-DATASET-EVIDENCE：換一組 API 資料，統計卡與篩選數字都要跟著變
  test('EP-02 換第二組資料：三張統計卡與全部／啟用／停用篩選數字跟著改變', async ({ page, mockApi }) => {
    mockApi.set(EP.list, ok(manyEndpoints));
    await page.goto('endpoint/');
    const filter = page.getByRole('group', { name: '狀態篩選' });
    await expect(page.getByTestId('stat-全部服務')).toHaveText('13');
    await expect(page.getByTestId('stat-啟用中')).toHaveText('4');
    await expect(page.getByTestId('stat-尚未上傳 JAR')).toHaveText('3');
    await expect(filter.getByRole('button')).toHaveText(['全部 13', '啟用 4', '停用 9']);

    // 第二組：7 筆，啟用 5（1～5）、停用 2、沒有 JAR 1（7）
    const second = Array.from({ length: 7 }, (_, i) => {
      const n = i + 1;
      return {
        ...manyEndpoints[0],
        id: `second-${n}`,
        publishUri: `second-${n}`,
        beanName: `secondBean${n}`,
        classPath: `com.second.Svc${n}`,
        jarFileId: n === 7 ? '' : `jar-second-${n}`,
        jarFileName: n === 7 ? '' : `second-${n}.jar`,
        isActive: n <= 5,
      };
    });
    mockApi.set(EP.list, ok(second));
    await page.reload();

    await expect(page.getByTestId('stat-全部服務')).toHaveText('7');
    await expect(page.getByTestId('stat-啟用中')).toHaveText('5');
    await expect(page.getByTestId('stat-尚未上傳 JAR')).toHaveText('1');
    await expect(filter.getByRole('button')).toHaveText(['全部 7', '啟用 5', '停用 2']);
    await expect(page.getByTestId('pagination-summary')).toHaveText('顯示 1–7，共 7 筆');

    await filter.getByRole('button', { name: '啟用 5' }).click();
    await expect(rows(page)).toHaveCount(5);
    await filter.getByRole('button', { name: '停用 2' }).click();
    await expect(rows(page)).toHaveCount(2);
    await expect(row(page, 'second-6')).toBeVisible();
    await expect(row(page, 'second-7')).toBeVisible();
  });

  test('EP-04 表格欄位、服務網址、未上傳徽章、Mock 筆數連結與逐服務查詢', async ({ page, mockApi }) => {
    await page.goto('endpoint/');
    const headers = page.getByRole('table').locator('thead th');
    await expect(headers).toHaveText(['', '服務', '實作類別', 'JAR', 'Mock 回應', '狀態', '操作']);

    const company = row(page, 'company');
    await expect(company.getByRole('link', { name: 'company', exact: true })).toBeVisible();
    await expect(company.getByText('/webservice/company', { exact: true })).toBeVisible();
    await expect(company.getByText('companyEndpoint', { exact: true })).toBeVisible();
    await expect(company.getByText('com.example.CompanyEndpoint', { exact: true })).toBeVisible();
    await expect(company.getByText('company.jar', { exact: true })).toBeVisible();
    await expect(company.getByText('停用', { exact: true })).toBeVisible();
    await expect(company.getByRole('button', { name: '編輯 company' })).toBeVisible();
    await expect(company.getByRole('button', { name: 'company 更多操作' })).toBeVisible();

    const badge = row(page, 'order').getByText('未上傳', { exact: true });
    await expect(badge).toBeVisible();
    await expect(badge).toHaveCSS('color', 'rgb(146, 64, 14)');
    await expect(badge).toHaveCSS('background-color', 'rgb(254, 243, 199)');

    // 筆數依 getResponseList 逐服務查得：e2e-order-endpoint 1、company 2、order 0
    await expect(page.getByTestId('mock-count-e2e-order-endpoint')).toHaveText('1 筆 ›');
    await expect(page.getByTestId('mock-count-company')).toHaveText('2 筆 ›');
    await expect(page.getByTestId('mock-count-order')).toHaveText('0 筆 ›');
    await expect(page.getByTestId('mock-count-company')).toHaveAttribute(
      'href',
      /\/response\/?\?publishUri=company&serviceType=ENDPOINT$/,
    );
    const bodies = mockApi.callsOf(RSP.list).map((c) => c.body);
    for (const ep of endpoints) {
      expect(bodies).toContainEqual({ publishUri: ep.publishUri, serviceType: 'ENDPOINT' });
    }
  });

  test('EP-04 單一服務筆數查詢失敗顯示「—」，連結仍正確', async ({ page, mockApi }) => {
    const handler: MockHandler = (call) => {
      const body = call.body as { publishUri: string };
      return body.publishUri === 'company' ? { json: fail('查詢失敗') } : { json: ok([]) };
    };
    mockApi.set(RSP.list, handler);
    await page.goto('endpoint/');
    const link = page.getByTestId('mock-count-company');
    await expect(link).toHaveText('— ›');
    await expect(link).toHaveAttribute('href', /\/response\/?\?publishUri=company&serviceType=ENDPOINT$/);
    await expect(page.getByTestId('mock-count-order')).toHaveText('0 筆 ›');
  });

  test('EP-09 載入中、完全空白、搜尋無結果、載入失敗與重試', async ({ page, mockApi }) => {
    mockApi.set(EP.list, () => ({ json: ok(endpoints), delayMs: 1500 }));
    await page.goto('endpoint/');
    await expect(page.getByTestId('loading-state')).toBeVisible();
    await expect(row(page, 'company')).toBeVisible();
    await expect(page.getByTestId('loading-state')).toHaveCount(0);

    // 搜尋無結果
    await page.getByRole('textbox', { name: '搜尋 Endpoint' }).fill('zzz-not-exist');
    await expect(page.getByTestId('no-results-state')).toContainText('找不到符合條件的 Endpoint');
    await page.getByRole('button', { name: '清除條件' }).click();
    await expect(rows(page)).toHaveCount(3);

    // 完全空白
    mockApi.set(EP.list, ok([]));
    await page.reload();
    await expect(page.getByTestId('empty-state')).toContainText('還沒有任何 Endpoint');
    await expect(page.getByTestId('no-results-state')).toHaveCount(0);

    // 失敗與重試
    mockApi.set(EP.list, fail('資料庫連線失敗'));
    await page.reload();
    const error = page.getByTestId('error-state');
    await expect(error).toContainText('資料載入失敗');
    await expect(error).toContainText('資料庫連線失敗');
    mockApi.set(EP.list, ok(endpoints));
    await error.getByRole('button', { name: '重新載入' }).click();
    await expect(row(page, 'company')).toBeVisible();
  });
});

test.describe('SC-ENDPOINT-02 Endpoint 啟停、批次、刪除與原生對話框', () => {
  test('EP-05 單筆啟用：先確認、送出正確參數、toast 復原送反向請求', async ({ page, mockApi }) => {
    const dialogs = trackNativeDialogs(page);
    await page.goto('endpoint/');
    const sw = page.getByLabel('company 狀態');
    await expect(sw).not.toBeChecked();

    // 取消時不送請求
    await sw.click();
    const confirm = page.getByRole('dialog', { name: '啟用 company？' });
    await expect(confirm).toBeVisible();
    await confirm.getByRole('button', { name: '取消' }).click();
    await expect(confirm).toBeHidden();
    expect(mockApi.callsOf(EP.switch)).toHaveLength(0);
    await expect(sw).not.toBeChecked();

    await sw.click();
    await page.getByRole('dialog', { name: '啟用 company？' }).getByRole('button', { name: '啟用' }).click();
    await expect(toast(page)).toContainText('已啟用 company');
    await expect(sw).toBeChecked();
    expect(mockApi.callsOf(EP.switch).map((c) => c.query)).toEqual([{ publishUri: 'company', isActive: 'true' }]);

    await toast(page).getByRole('button', { name: '復原' }).click();
    await expect(toast(page)).toContainText('已復原');
    await expect(sw).not.toBeChecked();
    expect(mockApi.callsOf(EP.switch).map((c) => c.query)).toEqual([
      { publishUri: 'company', isActive: 'true' },
      { publishUri: 'company', isActive: 'false' },
    ]);
    expect(dialogs).toEqual([]);
  });

  test('EP-05 切換失敗：顯示錯誤 toast，開關維持原狀', async ({ page, mockApi }) => {
    mockApi.set(EP.switch, fail('發布失敗：找不到類別'));
    await page.goto('endpoint/');
    const sw = page.getByLabel('e2e-order-endpoint 狀態');
    await expect(sw).toBeChecked();
    await sw.click();
    await page.getByRole('dialog', { name: '停用 e2e-order-endpoint？' }).getByRole('button', { name: '停用' }).click();
    await expect(toast(page)).toContainText('無法停用 e2e-order-endpoint');
    await expect(toast(page)).toContainText('發布失敗：找不到類別');
    await expect(toast(page).getByRole('button', { name: '復原' })).toHaveCount(0);
    await expect(sw).toBeChecked();
  });

  test('EP-06 批次操作列只在勾選後出現；批次停用逐筆呼叫並彙總部分失敗', async ({ page, mockApi }) => {
    const dialogs = trackNativeDialogs(page);
    mockApi.set(EP.switch, (call) =>
      call.query.publishUri === 'order' ? { json: fail('停用失敗') } : { json: ok(null) },
    );
    await page.goto('endpoint/');
    await expect(row(page, 'company')).toBeVisible();
    await expect(page.getByTestId('batch-bar')).toHaveCount(0);

    await page.getByLabel('選取 e2e-order-endpoint').check();
    const bar = page.getByTestId('batch-bar');
    await expect(bar).toContainText('已選取 1 筆');
    await expect(row(page, 'e2e-order-endpoint')).toHaveCSS('background-color', 'rgb(245, 248, 255)');
    await expect(bar.getByRole('button')).toHaveText(['批次啟用', '批次停用', '刪除', '取消選取']);

    await page.getByLabel('選取 order', { exact: true }).check();
    await expect(bar).toContainText('已選取 2 筆');

    await bar.getByRole('button', { name: '批次停用' }).click();
    const confirm = page.getByRole('dialog', { name: '批次停用 2 個 Endpoint？' });
    await expect(confirm.getByTestId('confirm-names').getByRole('listitem')).toHaveText(['e2e-order-endpoint', 'order']);
    await confirm.getByRole('button', { name: '停用 2 個' }).click();

    await expect(toast(page)).toContainText('停用成功 1 筆、失敗 1 筆');
    await expect(toast(page)).toContainText('order');
    expect(mockApi.callsOf(EP.switch).map((c) => c.query)).toEqual([
      { publishUri: 'e2e-order-endpoint', isActive: 'false' },
      { publishUri: 'order', isActive: 'false' },
    ]);
    await expect(page.getByTestId('batch-bar')).toHaveCount(0);

    // 取消選取也會讓批次列消失
    await page.getByLabel('選取 company').check();
    await expect(page.getByTestId('batch-bar')).toBeVisible();
    await page.getByRole('button', { name: '取消選取' }).click();
    await expect(page.getByTestId('batch-bar')).toHaveCount(0);
    expect(dialogs).toEqual([]);
  });

  test('EP-06 批次啟用全部成功時顯示成功筆數', async ({ page, mockApi }) => {
    await page.goto('endpoint/');
    await page.getByLabel('選取 company').check();
    await page.getByTestId('batch-bar').getByRole('button', { name: '批次啟用' }).click();
    await page.getByRole('dialog', { name: '批次啟用 1 個 Endpoint？' }).getByRole('button', { name: '啟用 1 個' }).click();
    await expect(toast(page)).toContainText('已啟用 1 筆');
    expect(mockApi.callsOf(EP.switch).map((c) => c.query)).toEqual([{ publishUri: 'company', isActive: 'true' }]);
  });

  test('EP-07 單筆刪除：確認框文案符合後端行為，成功 toast 不提供復原', async ({ page, mockApi }) => {
    const dialogs = trackNativeDialogs(page);
    await page.goto('endpoint/');
    await page.getByRole('button', { name: 'company 更多操作' }).click();
    await page.getByRole('menuitem', { name: '刪除' }).click();

    const confirm = page.getByRole('dialog', { name: '刪除 1 個 Endpoint？' });
    await expect(confirm).toContainText('這些服務會先停止再移除，無法復原。');
    await expect(confirm).not.toContainText('Mock 回應一併移除');
    await expect(confirm.getByTestId('confirm-names').getByRole('listitem')).toHaveText(['company']);
    const del = confirm.getByRole('button', { name: '刪除 1 個' });
    await expect(del).toHaveCSS('background-color', 'rgb(220, 38, 38)');
    await del.click();

    await expect(toast(page)).toContainText('已刪除 1 個 Endpoint');
    await expect(toast(page).getByRole('button', { name: '復原' })).toHaveCount(0);
    expect(mockApi.callsOf(EP.remove).map((c) => c.body)).toEqual([['company']]);
    expect(dialogs).toEqual([]);
  });

  test('EP-07 批次刪除兩筆：標題、名稱與按鈕依實際選取', async ({ page, mockApi }) => {
    const dialogs = trackNativeDialogs(page);
    await page.goto('endpoint/');
    await page.getByLabel('選取 company').check();
    await page.getByLabel('選取 order', { exact: true }).check();
    await page.getByTestId('batch-bar').getByRole('button', { name: '刪除' }).click();

    const confirm = page.getByRole('dialog', { name: '刪除 2 個 Endpoint？' });
    await expect(confirm.getByTestId('confirm-names').getByRole('listitem')).toHaveText(['company', 'order']);
    await expect(confirm).not.toContainText('Mock 回應一併移除');
    // danger 確認框預設焦點在「取消」
    await expect(confirm.getByRole('button', { name: '取消' })).toBeFocused();
    await confirm.getByRole('button', { name: '刪除 2 個' }).click();

    await expect(toast(page)).toContainText('已刪除 2 個 Endpoint');
    expect(mockApi.callsOf(EP.remove).map((c) => c.body)).toEqual([['company', 'order']]);
    await expect(page.getByTestId('batch-bar')).toHaveCount(0);
    expect(dialogs).toEqual([]);
  });

  test('WSDL-06 Endpoint 頁不再開啟 WSDL 彈窗，改連到 /wsdl', async ({ page }) => {
    await page.goto('endpoint/');
    await page.getByRole('main').getByRole('link', { name: 'WSDL 轉換' }).click();
    await expect(page).toHaveURL(/\/wsdl\/?$/);
    await expect(page.getByRole('heading', { name: 'WSDL 轉換', level: 1 })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
