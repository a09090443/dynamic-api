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

// ---- 過期回應晚到（ISSUE19-UI-STALE-RESPONSE-COVERAGE）----
// 同一支清單 API 依送出時機回傳可分辨的資料：被扣住的舊請求回 Endpoint 2 筆（ep-old-*）／RESTful 1 筆（rf-old-*），
// 之後送出的新請求立即回 Endpoint 3 筆／RESTful 4 筆。舊請求由測試手動放行，並以序號確認它們在新回應之後才完成。

const EP_LIST_PATH = '/dynamic-api/ws/getEndpoints';
const RF_LIST_PATH = '/dynamic-api/api/getControllers';
const OLD_ENDPOINTS = ['old-1', 'old-2'].map((tag) => ({ ...ep(0), id: `ep-id-${tag}`, publishUri: `ep-${tag}` }));
const OLD_RESTFULS = ['old-1'].map((tag) => ({ ...rf(0), id: `rf-id-${tag}`, publishUri: `rf-${tag}` }));

interface ListCall {
  api: 'ep' | 'rf';
  kind: 'old' | 'new';
  /** 請求抵達攔截器的順序 */
  requestSeq: number;
  /** route.fulfill 完成且瀏覽器收完回應後的順序；尚未完成為 undefined */
  fulfillSeq?: number;
}

/**
 * 在 spec 內以 page.route 攔截兩支清單 API（比 mockApi 晚註冊，優先處理）。
 * hold 模式下抵達的請求一律扣住，release() 時才以舊資料回應；其餘請求立即以新資料回應。
 */
async function installStaleControl(page: Page) {
  let mode: 'new' | 'hold' = 'new';
  let requestSeq = 0;
  let fulfillSeq = 0;
  const calls: ListCall[] = [];
  let held: { call: ListCall; open: () => void; done: Promise<void> }[] = [];

  // 瀏覽器端：記錄兩支清單 API 的 XHR loadend 次數，用來確認回應已交給前端程式處理
  await page.addInitScript(
    ([epPath, rfPath]) => {
      const w = window as unknown as { __listLoadEnd: number };
      w.__listLoadEnd = 0;
      const send = XMLHttpRequest.prototype.send;
      const open = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function (this: XMLHttpRequest & { __url?: string }, ...args: unknown[]) {
        this.__url = String(args[1]);
        return (open as (...a: unknown[]) => void).apply(this, args);
      } as typeof XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.send = function (this: XMLHttpRequest & { __url?: string }, body?: Document | XMLHttpRequestBodyInit | null) {
        const url = this.__url ?? '';
        if (url.includes(epPath) || url.includes(rfPath)) {
          this.addEventListener('loadend', () => {
            w.__listLoadEnd += 1;
          });
        }
        return send.call(this, body);
      };
    },
    [EP_LIST_PATH, RF_LIST_PATH],
  );

  await page.route(
    (url) => url.pathname === EP_LIST_PATH || url.pathname === RF_LIST_PATH,
    async (route) => {
      const request = route.request();
      const api = new URL(request.url()).pathname === EP_LIST_PATH ? 'ep' : 'rf';
      const call: ListCall = { api, kind: mode === 'hold' ? 'old' : 'new', requestSeq: ++requestSeq };
      calls.push(call);
      const data =
        api === 'ep' ? (call.kind === 'old' ? OLD_ENDPOINTS : ENDPOINTS) : call.kind === 'old' ? OLD_RESTFULS : RESTFULS;
      const respond = async () => {
        await route.fulfill({ json: ok(data) });
        await (await request.response())?.finished();
        call.fulfillSeq = ++fulfillSeq;
      };
      if (call.kind === 'new') {
        await respond();
        return;
      }
      let open = () => undefined as void;
      const gate = new Promise<void>((resolve) => {
        open = resolve;
      });
      const done = gate.then(respond);
      held.push({ call, open, done });
      await done;
    },
  );

  return {
    calls,
    heldCount: (api: 'ep' | 'rf') => held.filter((h) => h.call.api === api).length,
    hold: () => {
      mode = 'hold';
    },
    immediate: () => {
      mode = 'new';
    },
    /** 依抵達的相反順序放行全部扣住的舊請求，等到每一個都 fulfill 且瀏覽器收完，回傳這批舊請求 */
    release: async () => {
      const batch = held;
      held = [];
      for (const h of [...batch].reverse()) h.open();
      await Promise.all(batch.map((h) => h.done));
      return batch.map((h) => h.call);
    },
  };
}

type StaleControl = Awaited<ReturnType<typeof installStaleControl>>;

/** 等瀏覽器端處理完所有清單回應，再多讓出兩個畫格與一個 task，讓 React 套用過期回應（若會套用） */
async function waitBrowserProcessed(page: Page, ctl: StaleControl) {
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __listLoadEnd: number }).__listLoadEnd))
    .toBe(ctl.calls.length);
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 0)));
      }),
  );
}

/**
 * 一輪「舊回應晚到」：扣住 6 次快速切換期間的所有清單請求，最後一次切換的新請求立即回應；
 * 新畫面穩定後才放行舊請求，並確認舊回應確實在新回應之後完成，再斷言畫面仍是最新資料。
 */
async function staleRound(page: Page, ctl: StaleControl, target: 'endpoint' | 'restful') {
  const toTarget = target === 'restful' ? clickRestful : clickEndpoint;
  const toOther = target === 'restful' ? clickEndpoint : clickRestful;
  const roundStart = ctl.calls.length;

  ctl.hold();
  for (let i = 0; i < 6; i += 1) {
    await (i % 2 === 0 ? toTarget(page) : toOther(page));
  }
  // 停在另一頁；確認該頁與側欄的請求已被扣住（兩支 API 都至少各有側欄 1 次＋其中之一的清單頁 1 次）
  await expect(page).toHaveURL(target === 'restful' ? /\/endpoint\/?$/ : /\/restful\/?$/);
  await expect.poll(() => ctl.heldCount('ep')).toBeGreaterThanOrEqual(target === 'restful' ? 2 : 1);
  await expect.poll(() => ctl.heldCount('rf')).toBeGreaterThanOrEqual(target === 'restful' ? 1 : 2);

  // 第 7 次切換：新請求立即以新資料回應
  ctl.immediate();
  await toTarget(page);
  if (target === 'restful') {
    await expectRestfulPage(page, 3, 4);
  } else {
    await expectEndpointPage(page, 3, 4);
  }
  const roundCalls = () => ctl.calls.slice(roundStart);
  const newCalls = roundCalls().filter((c) => c.kind === 'new');
  expect(newCalls.some((c) => c.api === 'ep')).toBe(true);
  expect(newCalls.some((c) => c.api === 'rf')).toBe(true);
  expect(newCalls.every((c) => c.fulfillSeq !== undefined)).toBe(true);

  // 放行舊請求並等它們全部完成
  const oldCalls = await ctl.release();
  expect(oldCalls.filter((c) => c.api === 'ep').length).toBeGreaterThanOrEqual(1);
  expect(oldCalls.filter((c) => c.api === 'rf').length).toBeGreaterThanOrEqual(1);

  // 完成順序：舊請求先送出，卻在本輪所有新回應之後才完成
  const lastNewFulfill = Math.max(...newCalls.map((c) => c.fulfillSeq as number));
  const firstNewRequest = Math.min(...newCalls.map((c) => c.requestSeq));
  for (const c of oldCalls) {
    expect(c.requestSeq).toBeLessThan(firstNewRequest);
    expect(c.fulfillSeq).toBeGreaterThan(lastNewFulfill);
  }

  // 舊回應已交給前端處理後，畫面仍是最新資料
  await waitBrowserProcessed(page, ctl);
  if (target === 'restful') {
    await expectRestfulPage(page, 3, 4);
  } else {
    await expectEndpointPage(page, 3, 4);
  }
  await expect(page.locator('tbody tr[data-testid*="-old-"]')).toHaveCount(0);
}

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

  test('舊請求的回應在新回應之後才完成時，側欄、統計與表格仍維持最新資料', async ({ page, mockApi }) => {
    const ctl = await installStaleControl(page);
    await page.goto('endpoint/');
    await expectEndpointPage(page, 3, 4);

    // 第 1 輪停在 RESTful、第 2 輪停在 Endpoint（含「全部服務」統計卡），各 7 次側欄點擊
    await staleRound(page, ctl, 'restful');
    await staleRound(page, ctl, 'endpoint');

    expect(ctl.calls.filter((c) => c.kind === 'old').length).toBeGreaterThanOrEqual(6);
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
