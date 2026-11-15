import { test, expect } from './fixtures/mock-api';
import type { Locator, Page } from '@playwright/test';
import type { MockApi } from './fixtures/mock-api';

const SAVE = 'POST /dynamic-api/api/saveController';
const UPLOAD = 'POST /dynamic-api/common/uploadJarFile';
const LIST = 'GET /dynamic-api/api/getControllers';

const PUBLISH_URI_LABEL = '發布名稱 (Publish URI)';
const PUBLISH_URI_REQUIRED = '請輸入發布路徑';
const CLASS_PATH_REQUIRED = 'Class 路徑為必填';
const SUCCESS = 'Restful Controller 新增成功！';

const fields = (page: Page) => {
  const dialog = page.getByRole('dialog');
  return {
    dialog,
    publishUri: dialog.getByLabel(PUBLISH_URI_LABEL),
    classPath: dialog.getByLabel('Class 路徑'),
    submit: dialog.getByRole('button', { name: '新增', exact: true }),
  };
};

/** 驗證失敗時：對話框仍開啟、沒有成功訊息、沒有送出新增或上傳請求 */
const expectNotSubmitted = async (dialog: Locator, mockApi: MockApi) => {
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(SUCCESS)).toHaveCount(0);
  expect(mockApi.callsOf(SAVE)).toHaveLength(0);
  expect(mockApi.callsOf(UPLOAD)).toHaveLength(0);
};

test.describe('Restful 新增表單', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('restful/');
    await page.getByRole('button', { name: '新增 Restful' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('發布路徑完全空白：欄位下方顯示錯誤且不送出，補值後錯誤消失', async ({ page, mockApi }) => {
    const { dialog, publishUri, classPath, submit } = fields(page);
    await classPath.fill('com.example.E2eController');
    await submit.click();

    await expect(publishUri).toHaveAccessibleDescription(PUBLISH_URI_REQUIRED);
    await expect(publishUri).toHaveAttribute('aria-invalid', 'true');
    await expect(dialog.getByText(PUBLISH_URI_REQUIRED)).toBeVisible();
    await expectNotSubmitted(dialog, mockApi);

    // 錯誤狀態恢復：補上有效值後錯誤文字消失、欄位不再標記為無效
    await publishUri.fill('e2e-new-restful');
    await expect(dialog.getByText(PUBLISH_URI_REQUIRED)).toHaveCount(0);
    await expect(publishUri).not.toHaveAttribute('aria-invalid', 'true');
    expect(mockApi.callsOf(SAVE)).toHaveLength(0);
    expect(mockApi.unhandled).toEqual([]);
  });

  test('發布路徑只有空白字元：同樣顯示錯誤且不送出', async ({ page, mockApi }) => {
    const { dialog, publishUri, classPath, submit } = fields(page);
    await publishUri.fill('   ');
    await classPath.fill('com.example.E2eController');
    await submit.click();

    await expect(publishUri).toHaveAccessibleDescription(PUBLISH_URI_REQUIRED);
    await expect(publishUri).toHaveAttribute('aria-invalid', 'true');
    await expectNotSubmitted(dialog, mockApi);
    expect(mockApi.unhandled).toEqual([]);
  });

  test('Class 路徑空白：欄位下方顯示錯誤且不送出', async ({ page, mockApi }) => {
    const { dialog, publishUri, classPath, submit } = fields(page);
    await publishUri.fill('e2e-new-restful');
    await submit.click();

    await expect(classPath).toHaveAccessibleDescription(CLASS_PATH_REQUIRED);
    await expect(classPath).toHaveAttribute('aria-invalid', 'true');
    await expect(publishUri).not.toHaveAttribute('aria-invalid', 'true');
    await expectNotSubmitted(dialog, mockApi);
    expect(mockApi.unhandled).toEqual([]);
  });

  test('填入有效值送出成功並回到列表', async ({ page, mockApi }) => {
    const { dialog, publishUri, classPath, submit } = fields(page);
    await publishUri.fill('e2e-new-restful');
    await classPath.fill('com.example.E2eController');
    await submit.click();

    await expect(dialog.getByRole('alert')).toContainText(SUCCESS);

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

  test('發布路徑頭尾帶空白：送出時已去掉空白', async ({ page, mockApi }) => {
    const { dialog, publishUri, classPath, submit } = fields(page);
    await publishUri.fill('  e2e-new-restful  ');
    await classPath.fill('com.example.E2eController');
    await submit.click();

    await expect(dialog.getByRole('alert')).toContainText(SUCCESS);
    const saves = mockApi.callsOf(SAVE);
    expect(saves).toHaveLength(1);
    expect(saves[0].body).toMatchObject({
      publishUri: 'e2e-new-restful',
      classPath: 'com.example.E2eController',
    });
    expect(mockApi.callsOf(UPLOAD)).toHaveLength(0);
    await expect(dialog).toBeHidden({ timeout: 8_000 });
    await expect
      .poll(() => mockApi.callsOf(LIST).length)
      .toBeGreaterThanOrEqual(2);
    expect(mockApi.unhandled).toEqual([]);
  });
});
