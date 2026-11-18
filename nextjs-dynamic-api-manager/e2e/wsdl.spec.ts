import type { Page } from '@playwright/test';
import { test, expect, EP, type MockHandler } from './fixtures/mock-api';
import { trackNativeDialogs } from './fixtures/helpers';

const ZIP_BYTES = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00, 0x01, 0x02, 0x03, 0x04]);
const WSDL_URL = 'https://example.test/service.wsdl';
const PKG = 'com.example.generated';
const WSDL_FILE_BODY = '<definitions xmlns="http://schemas.xmlsoap.org/wsdl/" name="e2e-file"/>';

const zipReply = (delayMs = 0): MockHandler => () => ({
  status: 200,
  body: ZIP_BYTES,
  contentType: 'application/zip',
  headers: { 'Content-Disposition': 'attachment; filename=generated_wsdl_object.zip' },
  delayMs,
});

const submit = (page: Page) => page.getByRole('button', { name: /轉換並下載|轉換中/ });
const urlInput = (page: Page) => page.getByRole('textbox', { name: /^WSDL 網址/ });

/** 確認 multipart 本文中出現（或沒有）某個欄位名稱 */
const hasField = (raw: string | null, name: string) => (raw ?? '').includes(`name="${name}"`);

test.describe('SC-WSDL-01 WSDL 轉換頁', () => {
  test('WSDL-01 標題、說明與四步驟說明列（非可點精靈）', async ({ page }) => {
    await page.goto('wsdl/');
    await expect(page.getByRole('heading', { name: 'WSDL 轉換', level: 1 })).toBeVisible();
    await expect(
      page.getByText('把 WSDL 轉成 Java 物件並打包成 ZIP 下載，作為撰寫 Endpoint 實作的起點。', { exact: true }),
    ).toBeVisible();
    const steps = page.getByRole('list', { name: '使用步驟' }).getByRole('listitem');
    await expect(steps).toHaveCount(4);
    await expect(steps.nth(0)).toContainText('提供 WSDL');
    await expect(steps.nth(1)).toContainText('下載 ZIP');
    await expect(steps.nth(2)).toContainText('實作並打包 JAR');
    await expect(steps.nth(3)).toContainText('新增 Endpoint');
    await expect(page.getByRole('list', { name: '使用步驟' }).getByRole('link')).toHaveCount(0);
    await expect(page.getByRole('list', { name: '使用步驟' }).getByRole('button')).toHaveCount(0);
  });

  test('WSDL-02 來源互斥、初值為空、未填或副檔名錯誤時顯示驗證且不送出', async ({ page, mockApi }) => {
    await page.goto('wsdl/');
    await expect(page.getByRole('radio', { name: /WSDL 網址/ })).toBeChecked();
    await expect(urlInput(page)).toHaveValue('');
    await expect(page.getByTestId('wsdl-dropzone')).toHaveCount(0);
    await expect(page.getByTestId('wsdl-result-idle')).toContainText('尚未轉換');

    await submit(page).click();
    await expect(page.getByText('請輸入 WSDL 網址')).toBeVisible();

    await page.getByRole('radio', { name: /上傳檔案/ }).check();
    await expect(page.getByTestId('wsdl-dropzone')).toBeVisible();
    await expect(page.locator('#wsdl-url')).toHaveCount(0);
    await expect(page.getByTestId('wsdl-dropzone')).toContainText('接受 .wsdl、.xml，一次一個檔案');
    await expect(page.getByTestId('wsdl-file-input')).toHaveAttribute('accept', '.wsdl,.xml');

    await submit(page).click();
    await expect(page.getByText('請選擇 .wsdl 或 .xml 檔案')).toBeVisible();

    await page.getByTestId('wsdl-file-input').setInputFiles({ name: 'invalid.txt', mimeType: 'text/plain', buffer: Buffer.from('x') });
    await expect(page.getByText('不接受「invalid.txt」，請選擇 .wsdl 或 .xml 檔案')).toBeVisible();
    await submit(page).click();

    expect(mockApi.callsOf(EP.wsdl)).toHaveLength(0);
  });

  test('WSDL-03／WSDL-04 網址模式送 wsdlUrl（不送 wsdlPath）、轉換中停用、成功觸發下載', async ({ page, mockApi }) => {
    const dialogs = trackNativeDialogs(page);
    mockApi.set(EP.wsdl, zipReply(1200));
    await page.goto('wsdl/');
    await urlInput(page).fill(WSDL_URL);
    await page.getByLabel('Package 名稱').fill(PKG);

    const download = page.waitForEvent('download');
    await submit(page).click();
    await expect(page.getByTestId('wsdl-result-converting')).toBeVisible();
    await expect(submit(page)).toBeDisabled();
    const file = await download;
    expect(file.suggestedFilename()).toBe('generated_wsdl_object.zip');

    const success = page.getByTestId('wsdl-result-success');
    await expect(success).toContainText('已產生並開始下載');
    await expect(success).toContainText('generated_wsdl_object.zip');
    await expect(success.getByRole('link', { name: '新增 Endpoint' })).toHaveAttribute('href', /\/endpoint\/?$/);
    await expect(page.getByText('ZIP 內容')).toHaveCount(0);
    await expect(page.getByTestId('wsdl-result-error')).toHaveCount(0);
    await expect(submit(page)).toBeEnabled();

    const calls = mockApi.callsOf(EP.wsdl);
    expect(calls).toHaveLength(1);
    const raw = calls[0].raw;
    expect(hasField(raw, 'wsdlUrl')).toBe(true);
    expect(raw).toContain(WSDL_URL);
    expect(raw).not.toContain('wsdlPath');
    expect(hasField(raw, 'packageName')).toBe(true);
    expect(raw).toContain(PKG);
    expect(hasField(raw, 'file')).toBe(false);

    // 重新下載使用同一份結果，不重新呼叫 API
    const again = page.waitForEvent('download');
    await success.getByRole('button', { name: '重新下載' }).click();
    expect((await again).suggestedFilename()).toBe('generated_wsdl_object.zip');
    expect(mockApi.callsOf(EP.wsdl)).toHaveLength(1);
    expect(dialogs).toEqual([]);
  });

  test('WSDL-03 檔案模式送 file；Package 名稱留空時不送 packageName', async ({ page, mockApi }) => {
    mockApi.set(EP.wsdl, zipReply());
    await page.goto('wsdl/');
    await page.getByRole('radio', { name: /上傳檔案/ }).check();
    await page.getByTestId('wsdl-file-input').setInputFiles({
      name: 'sample.wsdl',
      mimeType: 'application/xml',
      buffer: Buffer.from('<definitions xmlns="http://schemas.xmlsoap.org/wsdl/"/>'),
    });
    await expect(page.getByTestId('wsdl-file-name')).toContainText('sample.wsdl');
    const download = page.waitForEvent('download');
    await submit(page).click();
    await download;
    const raw = mockApi.callsOf(EP.wsdl)[0].raw;
    expect(hasField(raw, 'file')).toBe(true);
    expect(raw).toContain('filename="sample.wsdl"');
    expect(hasField(raw, 'wsdlUrl')).toBe(false);
    expect(hasField(raw, 'packageName')).toBe(false);
    expect(raw).not.toContain('wsdlPath');
  });

  const failures = [
    { name: 'HTTP 204', handler: (() => ({ status: 204 })) as MockHandler, detail: 'HTTP 204' },
    {
      name: 'HTTP 500 純文字錯誤',
      handler: (() => ({ status: 500, body: 'WSDL 解析失敗：連線逾時', contentType: 'text/plain;charset=UTF-8' })) as MockHandler,
      detail: 'WSDL 解析失敗：連線逾時',
    },
    { name: '網路錯誤', handler: (() => ({ abort: true })) as MockHandler, detail: '' },
  ];

  for (const c of failures) {
    test(`WSDL-05 網址模式 ${c.name}：顯示「無法轉換」與再試一次，輸入保留`, async ({ page, mockApi }) => {
      mockApi.set(EP.wsdl, c.handler);
      let downloads = 0;
      page.on('download', () => downloads++);
      await page.goto('wsdl/');
      await urlInput(page).fill(WSDL_URL);
      await page.getByLabel('Package 名稱').fill(PKG);
      await submit(page).click();

      const error = page.getByTestId('wsdl-result-error');
      await expect(error).toContainText('無法轉換：讀不到這個 WSDL');
      await expect(error).toContainText('輸入的內容會保留，不必重填。');
      if (c.detail) await expect(error).toContainText(c.detail);
      await expect(page.getByTestId('wsdl-result-success')).toHaveCount(0);
      await expect(page.getByText('已產生並開始下載')).toHaveCount(0);
      await expect(urlInput(page)).toHaveValue(WSDL_URL);
      await expect(page.getByLabel('Package 名稱')).toHaveValue(PKG);
      expect(downloads).toBe(0);

      // 再試一次會重新送出同樣的輸入；這次成功
      mockApi.set(EP.wsdl, zipReply());
      const download = page.waitForEvent('download');
      await error.getByRole('button', { name: '再試一次' }).click();
      await download;
      await expect(page.getByTestId('wsdl-result-success')).toBeVisible();
      await expect(page.getByTestId('wsdl-result-error')).toHaveCount(0);
      const calls = mockApi.callsOf(EP.wsdl);
      expect(calls).toHaveLength(2);
      expect(calls[1].raw).toContain(WSDL_URL);
    });
  }

  // ISS-WSDL-FILE-FAILURE-EVIDENCE：檔案模式失敗後保留所選檔案與 Package 名稱，再試一次送出原本的 file 與 packageName
  for (const c of failures) {
    test(`WSDL-05 檔案模式 ${c.name}：保留檔名與 Package 名稱，再試一次用原檔重送 multipart`, async ({ page, mockApi }) => {
      mockApi.set(EP.wsdl, c.handler);
      let downloads = 0;
      page.on('download', () => downloads++);
      await page.goto('wsdl/');
      await page.getByRole('radio', { name: /上傳檔案/ }).check();
      await page.getByTestId('wsdl-file-input').setInputFiles({
        name: 'sample.wsdl',
        mimeType: 'application/xml',
        buffer: Buffer.from(WSDL_FILE_BODY),
      });
      await page.getByLabel('Package 名稱').fill(PKG);
      await submit(page).click();

      const error = page.getByTestId('wsdl-result-error');
      await expect(error).toContainText('無法轉換：讀不到這個 WSDL');
      if (c.detail) await expect(error).toContainText(c.detail);
      await expect(page.getByTestId('wsdl-result-success')).toHaveCount(0);
      await expect(page.getByRole('radio', { name: /上傳檔案/ })).toBeChecked();
      await expect(page.getByTestId('wsdl-file-name')).toHaveText('已選擇：sample.wsdl');
      await expect(page.getByLabel('Package 名稱')).toHaveValue(PKG);
      expect(downloads).toBe(0);

      mockApi.set(EP.wsdl, zipReply());
      const download = page.waitForEvent('download');
      await error.getByRole('button', { name: '再試一次' }).click();
      await download;
      await expect(page.getByTestId('wsdl-result-success')).toBeVisible();
      const calls = mockApi.callsOf(EP.wsdl);
      expect(calls).toHaveLength(2);
      for (const call of calls) {
        expect(hasField(call.raw, 'file')).toBe(true);
        expect(call.raw).toContain('filename="sample.wsdl"');
        expect(call.raw).toContain(WSDL_FILE_BODY);
        expect(hasField(call.raw, 'packageName')).toBe(true);
        expect(call.raw).toContain(PKG);
        expect(hasField(call.raw, 'wsdlUrl')).toBe(false);
      }
    });
  }

  // ISS-WSDL-PENDING-INPUT：轉換中鎖定來源、網址／檔案與 Package 名稱，結果與下載只對應送出當下的輸入
  test('WSDL-04 網址模式轉換中：輸入全部鎖定，完成卡與下載對應送出時的網址與 Package', async ({ page, mockApi }) => {
    mockApi.set(EP.wsdl, zipReply(1500));
    await page.goto('wsdl/');
    await urlInput(page).fill(WSDL_URL);
    await page.getByLabel('Package 名稱').fill(PKG);
    const download = page.waitForEvent('download');
    await submit(page).click();
    await expect(page.getByTestId('wsdl-result-converting')).toBeVisible();

    await expect(urlInput(page)).toBeDisabled();
    await expect(page.getByLabel('Package 名稱')).toBeDisabled();
    await expect(page.getByRole('radio', { name: /上傳檔案/ })).toBeDisabled();
    await expect(page.getByRole('radio', { name: /WSDL 網址/ })).toBeDisabled();
    await expect(page.getByRole('button', { name: '清除網址' })).toHaveCount(0);
    // 嘗試切換來源也不會生效
    await page.getByRole('radio', { name: /上傳檔案/ }).click({ force: true });
    await expect(page.getByRole('radio', { name: /WSDL 網址/ })).toBeChecked();

    await download;
    await expect(page.getByTestId('wsdl-result-success')).toBeVisible();
    await expect(urlInput(page)).toBeEnabled();
    await expect(urlInput(page)).toHaveValue(WSDL_URL);
    await expect(page.getByLabel('Package 名稱')).toHaveValue(PKG);
    const calls = mockApi.callsOf(EP.wsdl);
    expect(calls).toHaveLength(1);
    expect(calls[0].raw).toContain(WSDL_URL);
    expect(calls[0].raw).toContain(PKG);

    // 完成後改輸入：舊結果立即作廢，不會對到新輸入
    await page.getByLabel('Package 名稱').fill('com.example.other');
    await expect(page.getByTestId('wsdl-result-success')).toHaveCount(0);
    await expect(page.getByRole('button', { name: '重新下載' })).toHaveCount(0);
    await expect(page.getByTestId('wsdl-result-idle')).toBeVisible();
  });

  test('WSDL-04 檔案模式轉換中：檔案區與 Package 鎖定，延遲失敗後仍保留送出的檔案', async ({ page, mockApi }) => {
    mockApi.set(EP.wsdl, () => ({ status: 500, body: '解析失敗', contentType: 'text/plain;charset=UTF-8', delayMs: 1500 }));
    await page.goto('wsdl/');
    await page.getByRole('radio', { name: /上傳檔案/ }).check();
    await page.getByTestId('wsdl-file-input').setInputFiles({ name: 'first.wsdl', mimeType: 'application/xml', buffer: Buffer.from(WSDL_FILE_BODY) });
    await page.getByLabel('Package 名稱').fill(PKG);
    await submit(page).click();
    await expect(page.getByTestId('wsdl-result-converting')).toBeVisible();

    await expect(page.getByTestId('wsdl-dropzone')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByTestId('wsdl-file-input')).toBeDisabled();
    await expect(page.getByLabel('Package 名稱')).toBeDisabled();
    await expect(page.getByRole('radio', { name: /WSDL 網址/ })).toBeDisabled();

    await expect(page.getByTestId('wsdl-result-error')).toContainText('解析失敗');
    await expect(page.getByTestId('wsdl-file-name')).toHaveText('已選擇：first.wsdl');
    await expect(page.getByLabel('Package 名稱')).toHaveValue(PKG);
    await expect(page.getByLabel('Package 名稱')).toBeEnabled();
    const calls = mockApi.callsOf(EP.wsdl);
    expect(calls).toHaveLength(1);
    expect(calls[0].raw).toContain('filename="first.wsdl"');
  });
});
