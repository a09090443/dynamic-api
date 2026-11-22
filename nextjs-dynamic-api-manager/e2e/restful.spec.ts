import type { Page } from '@playwright/test';
import { test, expect, RF } from './fixtures/mock-api';
import { trackNativeDialogs } from './fixtures/helpers';

const toast = (page: Page) => page.getByTestId('toast');

/** 取主要表格元件的計算後樣式，用來與 Endpoint 清單對照 */
const styleOf = (page: Page) =>
  page.evaluate(() => {
    const css = (el: Element | null, prop: string) => (el ? getComputedStyle(el).getPropertyValue(prop) : null);
    const th = document.querySelector('thead th');
    const edit = document.querySelector('tbody tr button');
    const track = document.querySelector('[data-testid="status-switch"] .MuiSwitch-root');
    return {
      headBg: css(th, 'background-color'),
      headSize: css(th, 'font-size'),
      headWeight: css(th, 'font-weight'),
      editHeight: css(edit, 'height'),
      editRadius: css(edit, 'border-radius'),
      switchWidth: css(track, 'width'),
      switchHeight: css(track, 'height'),
    };
  });

test.describe('SC-RESTFUL-01 RESTful 清單：樣式一致、啟停可復原、刪除不可復原', () => {
  test('OTH-02 表格、開關、按鈕樣式與 Endpoint 清單相同', async ({ page }) => {
    await page.goto('endpoint/');
    await expect(page.getByTestId('row-company')).toBeVisible();
    const endpointStyle = await styleOf(page);

    await page.goto('restful/');
    await expect(page.getByTestId('row-e2e-inventory-restful')).toBeVisible();
    const restfulStyle = await styleOf(page);

    expect(restfulStyle).toEqual(endpointStyle);
    expect(restfulStyle.headBg).toBe('rgb(249, 250, 251)');
    expect(restfulStyle.switchWidth).toBe('36px');
    expect(restfulStyle.switchHeight).toBe('20px');
  });

  test('OTH-02 啟停經確認框、toast 復原送反向請求；刪除經確認、無復原；沒有原生對話框', async ({ page, mockApi }) => {
    const dialogs = trackNativeDialogs(page);
    await page.goto('restful/');
    const sw = page.getByLabel('e2e-inventory-restful 狀態');
    await expect(sw).not.toBeChecked();
    await sw.click();
    await page
      .getByRole('dialog', { name: '啟用 e2e-inventory-restful？' })
      .getByRole('button', { name: '啟用' })
      .click();
    await expect(toast(page)).toContainText('已啟用 e2e-inventory-restful');
    await expect(sw).toBeChecked();
    await toast(page).getByRole('button', { name: '復原' }).click();
    await expect(sw).not.toBeChecked();
    expect(mockApi.callsOf(RF.switch).map((c) => c.query)).toEqual([
      { publishUri: 'e2e-inventory-restful', isActive: 'true' },
      { publishUri: 'e2e-inventory-restful', isActive: 'false' },
    ]);

    await page.getByRole('button', { name: '刪除 e2e-inventory-restful' }).click();
    const confirm = page.getByRole('dialog', { name: '刪除 1 個 RESTful 服務？' });
    await expect(confirm).toContainText('這些服務會先停止再移除，無法復原。');
    await expect(confirm).not.toContainText('Mock 回應一併移除');
    await confirm.getByRole('button', { name: '刪除 1 個' }).click();
    await expect(toast(page)).toContainText('已刪除 1 個 RESTful 服務');
    await expect(toast(page).getByRole('button', { name: '復原' })).toHaveCount(0);
    expect(mockApi.callsOf(RF.remove).map((c) => c.body)).toEqual([['e2e-inventory-restful']]);
    expect(dialogs).toEqual([]);
  });
});
