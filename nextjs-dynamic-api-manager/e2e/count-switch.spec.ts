import type { Page } from '@playwright/test';
import { test, expect, EP, RF, ok, type MockApi } from './fixtures/mock-api';
import type { Endpoint, Restful } from '../src/types/models';

// SC-COUNT-02（issue #19）：在 SOAP Endpoint 與 RESTful API 之間快速反覆切換，
// 清單 API 延遲且回應順序顛倒時，側欄數字、目前頁統計與表格列仍各自對應正確類型。
// 根因在後端（並行查詢讀錯 SQL），由 backend 的 ServiceListConcurrencyTest 驗證；
// 本測試證明前端本身不會把兩類資料寫反或沿用過期回應，修正前後都應通過。

const ep = (n: number): Endpoint => ({
  id: `ep-id-${n}`,
  publishUri: `ep-${n}`,
  beanName: `ep${n}Bean`,
  classPath: `com.example.Ep${n}`,
  jarFileId: `jar-ep-${n}`,
  jarFileName: `ep-${n}.jar`,
  file: null,
  isActive: n % 2 === 1,
  ignoreCdata: false,
});

const rf = (n: number): Restful => ({
  id: `rf-id-${n}`,
  publishUri: `rf-${n}`,
  classPath: `com.example.Rf${n}`,
  jarFileId: `jar-rf-${n}`,
  jarFileName: `rf-${n}.jar`,
  file: null,
  isActive: n % 2 === 0,
});

const ENDPOINTS = [1, 2, 3].map(ep);
const RESTFULS = [1, 2, 3, 4].map(rf);
const SLOW_MS = 400;

/** 依呼叫次數交替延遲：Endpoint 奇數次慢、偶數次快；Controller 相反，讓先送出的請求較晚回應 */
function installAlternatingDelays(mockApi: MockApi, endpoints: Endpoint[], restfuls: Restful[]) {
  let epCalls = 0;
  let rfCalls = 0;
  mockApi.set(EP.list, () => {
    epCalls += 1;
    return { json: ok(endpoints), delayMs: epCalls % 2 === 1 ? SLOW_MS : 0 };
  });
  mockApi.set(RF.list, () => {
    rfCalls += 1;
    return { json: ok(restfuls), delayMs: rfCalls % 2 === 1 ? 0 : SLOW_MS };
  });
}

const nav = (page: Page) => page.getByRole('navigation', { name: '主選單' });
const rows = (page: Page) => page.locator('tbody tr[data-testid^="row-"]');

async function expectEndpointPage(page: Page, endpointCount: number, restfulCount: number) {
  await expect(page).toHaveURL(/\/endpoint\/?$/);
  await expect(page.getByTestId('nav-count-endpoints')).toHaveText(String(endpointCount));
  await expect(page.getByTestId('nav-count-controllers')).toHaveText(String(restfulCount));
  await expect(page.getByTestId('stat-全部服務')).toHaveText(String(endpointCount));
  await expect(rows(page)).toHaveCount(endpointCount);
  for (let n = 1; n <= endpointCount; n += 1) {
    await expect(page.getByTestId(`row-ep-${n}`)).toBeVisible();
  }
  await expect(page.locator('tbody tr[data-testid^="row-rf-"]')).toHaveCount(0);
}

async function expectRestfulPage(page: Page, endpointCount: number, restfulCount: number) {
  await expect(page).toHaveURL(/\/restful\/?$/);
  await expect(page.getByTestId('nav-count-endpoints')).toHaveText(String(endpointCount));
  await expect(page.getByTestId('nav-count-controllers')).toHaveText(String(restfulCount));
  // RESTful 頁沒有統計卡，以表格列數代表該頁的全部服務數
  await expect(rows(page)).toHaveCount(restfulCount);
  for (let n = 1; n <= restfulCount; n += 1) {
    await expect(page.getByTestId(`row-rf-${n}`)).toBeVisible();
  }
  await expect(page.locator('tbody tr[data-testid^="row-ep-"]')).toHaveCount(0);
}

const clickEndpoint = (page: Page) => nav(page).getByRole('link', { name: /^SOAP Endpoint/ }).click();
const clickRestful = (page: Page) => nav(page).getByRole('link', { name: /^RESTful API/ }).click();

test.describe('SC-COUNT-02 Endpoint／RESTful 切換時數量與清單一致（issue #19）', () => {
  test('延遲且順序顛倒的回應下快速反覆切換，側欄、統計與表格都對應正確類型', async ({ page, mockApi }) => {
    installAlternatingDelays(mockApi, ENDPOINTS, RESTFULS);
    await page.goto('endpoint/');
    await expectEndpointPage(page, 3, 4);

    // 不等回應完成，連續點擊側欄 8 次
    for (let i = 0; i < 8; i += 1) {
      await (i % 2 === 0 ? clickRestful(page) : clickEndpoint(page));
    }
    await expectEndpointPage(page, 3, 4);

    // 再逐次切換，每次停下後等延遲回應結束再斷言
    for (let i = 0; i < 6; i += 1) {
      if (i % 2 === 0) {
        await clickRestful(page);
        await expectRestfulPage(page, 3, 4);
      } else {
        await clickEndpoint(page);
        await expectEndpointPage(page, 3, 4);
      }
    }

    // 側欄與清單頁確實多次並行呼叫兩支 API
    expect(mockApi.callsOf(EP.list).length).toBeGreaterThanOrEqual(8);
    expect(mockApi.callsOf(RF.list).length).toBeGreaterThanOrEqual(8);
    expect(mockApi.unhandled).toEqual([]);
  });

  test('RESTful 0 筆時，切換後側欄與表格為 0，不沿用 Endpoint 資料', async ({ page, mockApi }) => {
    installAlternatingDelays(mockApi, ENDPOINTS, []);
    await page.goto('endpoint/');
    await expectEndpointPage(page, 3, 0);

    for (let i = 0; i < 6; i += 1) {
      await (i % 2 === 0 ? clickRestful(page) : clickEndpoint(page));
    }
    await clickRestful(page);
    await expect(page).toHaveURL(/\/restful\/?$/);
    await expect(page.getByTestId('nav-count-endpoints')).toHaveText('3');
    await expect(page.getByTestId('nav-count-controllers')).toHaveText('0');
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(rows(page)).toHaveCount(0);
    await expect(page.locator('tbody tr[data-testid^="row-ep-"]')).toHaveCount(0);

    await clickEndpoint(page);
    await expectEndpointPage(page, 3, 0);
  });
});
