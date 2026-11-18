import { test, expect, type MockApi } from './fixtures/mock-api';

// page.goto 一律用不含開頭斜線的相對路徑，才會保留 baseURL 的 /dynamic-api/ basePath

const expectNoRealBackend = (mockApi: MockApi) => {
  expect(mockApi.blocked.filter((url) => url.includes('localhost:8080'))).toEqual([]);
  expect(mockApi.unhandled).toEqual([]);
};

test.describe('主要頁面', () => {
  test('首頁會導向 SOAP Endpoint 清單', async ({ page, mockApi }) => {
    await page.goto('./');
    await expect(page).toHaveURL(/\/dynamic-api\/endpoint\/$/);
    await expect(page.getByRole('heading', { name: 'SOAP Endpoint', level: 1 })).toBeVisible();
    expectNoRealBackend(mockApi);
  });

  test('Endpoint 列表顯示假資料', async ({ page, mockApi }) => {
    await page.goto('endpoint/');
    await expect(page.getByRole('heading', { name: 'SOAP Endpoint', level: 1 })).toBeVisible();
    const table = page.getByRole('table');
    await expect(table.getByRole('link', { name: 'e2e-order-endpoint', exact: true })).toBeVisible();
    await expect(table.getByText('orderEndpoint', { exact: true })).toBeVisible();
    expect(mockApi.callsOf('GET /dynamic-api/ws/getEndpoints').length).toBeGreaterThanOrEqual(1);
    expectNoRealBackend(mockApi);
  });

  test('Restful 列表顯示假資料', async ({ page, mockApi }) => {
    await page.goto('restful/');
    await expect(page.getByRole('heading', { name: 'RESTful API', level: 1 })).toBeVisible();
    const table = page.getByRole('table');
    await expect(table.getByText('e2e-inventory-restful', { exact: true })).toBeVisible();
    await expect(
      table.getByRole('cell', { name: 'com.example.InventoryController', exact: true }),
    ).toBeVisible();
    expect(mockApi.callsOf('GET /dynamic-api/api/getControllers').length).toBeGreaterThanOrEqual(1);
    expectNoRealBackend(mockApi);
  });

  test('Mock 回應列表顯示假資料', async ({ page, mockApi }) => {
    await page.goto('response/?publishUri=e2e-order-endpoint&serviceType=ENDPOINT');
    await expect(
      page.getByRole('heading', { name: 'e2e-order-endpoint 的 Mock 回應', level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole('cell', { name: 'getOrder', exact: true })).toBeVisible();

    const listCalls = mockApi.callsOf('POST /dynamic-api/common/getResponseList');
    expect(listCalls.length).toBeGreaterThanOrEqual(1);
    expect(listCalls[0].body).toEqual({
      publishUri: 'e2e-order-endpoint',
      serviceType: 'ENDPOINT',
    });
    expectNoRealBackend(mockApi);
  });
});
