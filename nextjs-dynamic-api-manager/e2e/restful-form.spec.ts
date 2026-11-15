import { test, expect } from './fixtures/mock-api';

const SAVE = 'POST /dynamic-api/api/saveController';
const UPLOAD = 'POST /dynamic-api/common/uploadJarFile';
const LIST = 'GET /dynamic-api/api/getControllers';

test.describe('Restful 新增表單', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('restful/');
    await page.getByRole('button', { name: '新增 Restful' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('填入有效值送出成功', async ({ page, mockApi }) => {
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('發布名稱 (Publish URI)').fill('e2e-new-restful');
    await dialog.getByLabel('Class 路徑').fill('com.example.E2eController');
    await dialog.getByRole('button', { name: '新增', exact: true }).click();

    await expect(dialog.getByRole('alert')).toContainText('Restful Controller 新增成功！');

    const saves = mockApi.callsOf(SAVE);
    expect(saves).toHaveLength(1);
    expect(saves[0].body).toMatchObject({
      publishUri: 'e2e-new-restful',
      classPath: 'com.example.E2eController',
      jarFileId: '',
    });
    // 沒選檔案就不應上傳 JAR
    expect(mockApi.callsOf(UPLOAD)).toHaveLength(0);

    // 成功後倒數 3 秒自動關閉對話框並重新載入列表
    await expect(dialog).toBeHidden({ timeout: 8_000 });
    await expect
      .poll(() => mockApi.callsOf(LIST).length)
      .toBeGreaterThanOrEqual(2);
    expect(mockApi.unhandled).toEqual([]);
  });

  test('發布名稱空白時驗證失敗且不送出', async ({ page, mockApi }) => {
    const dialog = page.getByRole('dialog');
    const publishUri = dialog.getByLabel('發布名稱 (Publish URI)');
    await dialog.getByLabel('Class 路徑').fill('com.example.E2eController');
    await dialog.getByRole('button', { name: '新增', exact: true }).click();

    // 使用者實際看到的是瀏覽器原生 required 提示（欄位帶 required、form 沒有 noValidate）
    expect(await publishUri.evaluate((el) => (el as HTMLInputElement).validity.valueMissing)).toBe(true);
    expect(
      await publishUri.evaluate((el) => (el as HTMLInputElement).validationMessage),
    ).not.toBe('');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Restful Controller 新增成功！')).toHaveCount(0);
    expect(mockApi.callsOf(SAVE)).toHaveLength(0);

    // 略過原生檢查以驗證 yup 規則：直接派送 submit 事件給 react-hook-form
    await dialog
      .locator('form')
      .evaluate((form) =>
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
      );

    await expect(dialog.getByText('發布名稱為必填')).toBeVisible();
    expect(mockApi.callsOf(SAVE)).toHaveLength(0);
    expect(mockApi.unhandled).toEqual([]);
  });
});
