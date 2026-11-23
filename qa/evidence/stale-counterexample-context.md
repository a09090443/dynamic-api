# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: count-switch.spec.ts >> SC-COUNT-02 Endpoint／RESTful 切換時數量與清單一致（issue #19） >> 舊請求的回應在新回應之後才完成時，側欄、統計與表格仍維持最新資料
- Location: e2e/count-switch.spec.ts:280:3

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByTestId('nav-count-endpoints')
Expected: "3"
Received: "2"
Timeout:  5000ms

Call log:
  - Expect "toHaveText" getByTestId('nav-count-endpoints') with timeout 5000ms
  - waiting for getByTestId('nav-count-endpoints')
    14 × locator resolved to <span class="MuiBox-root css-126dl5y" data-testid="nav-count-endpoints">2</span>
       - unexpected value "2"

```

```yaml
- text: "2"
```

# Test source

```ts
  1   | import type { Page } from '@playwright/test';
  2   | import { test, expect, EP, RF, ok, type MockApi } from './fixtures/mock-api';
  3   | import type { Endpoint, Restful } from '../src/types/models';
  4   | 
  5   | // SC-COUNT-02（issue #19）：在 SOAP Endpoint 與 RESTful API 之間快速反覆切換，
  6   | // 清單 API 延遲且回應順序顛倒時，側欄數字、目前頁統計與表格列仍各自對應正確類型。
  7   | // 根因在後端（並行查詢讀錯 SQL），由 backend 的 ServiceListConcurrencyTest 驗證；
  8   | // 本測試證明前端本身不會把兩類資料寫反或沿用過期回應，修正前後都應通過。
  9   | 
  10  | const ep = (n: number): Endpoint => ({
  11  |   id: `ep-id-${n}`,
  12  |   publishUri: `ep-${n}`,
  13  |   beanName: `ep${n}Bean`,
  14  |   classPath: `com.example.Ep${n}`,
  15  |   jarFileId: `jar-ep-${n}`,
  16  |   jarFileName: `ep-${n}.jar`,
  17  |   file: null,
  18  |   isActive: n % 2 === 1,
  19  |   ignoreCdata: false,
  20  | });
  21  | 
  22  | const rf = (n: number): Restful => ({
  23  |   id: `rf-id-${n}`,
  24  |   publishUri: `rf-${n}`,
  25  |   classPath: `com.example.Rf${n}`,
  26  |   jarFileId: `jar-rf-${n}`,
  27  |   jarFileName: `rf-${n}.jar`,
  28  |   file: null,
  29  |   isActive: n % 2 === 0,
  30  | });
  31  | 
  32  | const ENDPOINTS = [1, 2, 3].map(ep);
  33  | const RESTFULS = [1, 2, 3, 4].map(rf);
  34  | const SLOW_MS = 400;
  35  | 
  36  | /** 依呼叫次數交替延遲：Endpoint 奇數次慢、偶數次快；Controller 相反，讓先送出的請求較晚回應 */
  37  | function installAlternatingDelays(mockApi: MockApi, endpoints: Endpoint[], restfuls: Restful[]) {
  38  |   let epCalls = 0;
  39  |   let rfCalls = 0;
  40  |   mockApi.set(EP.list, () => {
  41  |     epCalls += 1;
  42  |     return { json: ok(endpoints), delayMs: epCalls % 2 === 1 ? SLOW_MS : 0 };
  43  |   });
  44  |   mockApi.set(RF.list, () => {
  45  |     rfCalls += 1;
  46  |     return { json: ok(restfuls), delayMs: rfCalls % 2 === 1 ? 0 : SLOW_MS };
  47  |   });
  48  | }
  49  | 
  50  | const nav = (page: Page) => page.getByRole('navigation', { name: '主選單' });
  51  | const rows = (page: Page) => page.locator('tbody tr[data-testid^="row-"]');
  52  | 
  53  | async function expectEndpointPage(page: Page, endpointCount: number, restfulCount: number) {
  54  |   await expect(page).toHaveURL(/\/endpoint\/?$/);
  55  |   await expect(page.getByTestId('nav-count-endpoints')).toHaveText(String(endpointCount));
  56  |   await expect(page.getByTestId('nav-count-controllers')).toHaveText(String(restfulCount));
  57  |   await expect(page.getByTestId('stat-全部服務')).toHaveText(String(endpointCount));
  58  |   await expect(rows(page)).toHaveCount(endpointCount);
  59  |   for (let n = 1; n <= endpointCount; n += 1) {
  60  |     await expect(page.getByTestId(`row-ep-${n}`)).toBeVisible();
  61  |   }
  62  |   await expect(page.locator('tbody tr[data-testid^="row-rf-"]')).toHaveCount(0);
  63  | }
  64  | 
  65  | async function expectRestfulPage(page: Page, endpointCount: number, restfulCount: number) {
  66  |   await expect(page).toHaveURL(/\/restful\/?$/);
> 67  |   await expect(page.getByTestId('nav-count-endpoints')).toHaveText(String(endpointCount));
      |                                                         ^ Error: expect(locator).toHaveText(expected) failed
  68  |   await expect(page.getByTestId('nav-count-controllers')).toHaveText(String(restfulCount));
  69  |   // RESTful 頁沒有統計卡，以表格列數代表該頁的全部服務數
  70  |   await expect(rows(page)).toHaveCount(restfulCount);
  71  |   for (let n = 1; n <= restfulCount; n += 1) {
  72  |     await expect(page.getByTestId(`row-rf-${n}`)).toBeVisible();
  73  |   }
  74  |   await expect(page.locator('tbody tr[data-testid^="row-ep-"]')).toHaveCount(0);
  75  | }
  76  | 
  77  | const clickEndpoint = (page: Page) => nav(page).getByRole('link', { name: /^SOAP Endpoint/ }).click();
  78  | const clickRestful = (page: Page) => nav(page).getByRole('link', { name: /^RESTful API/ }).click();
  79  | 
  80  | // ---- 過期回應晚到（ISSUE19-UI-STALE-RESPONSE-COVERAGE）----
  81  | // 同一支清單 API 依送出時機回傳可分辨的資料：被扣住的舊請求回 Endpoint 2 筆（ep-old-*）／RESTful 1 筆（rf-old-*），
  82  | // 之後送出的新請求立即回 Endpoint 3 筆／RESTful 4 筆。舊請求由測試手動放行，並以序號確認它們在新回應之後才完成。
  83  | 
  84  | const EP_LIST_PATH = '/dynamic-api/ws/getEndpoints';
  85  | const RF_LIST_PATH = '/dynamic-api/api/getControllers';
  86  | const OLD_ENDPOINTS = ['old-1', 'old-2'].map((tag) => ({ ...ep(0), id: `ep-id-${tag}`, publishUri: `ep-${tag}` }));
  87  | const OLD_RESTFULS = ['old-1'].map((tag) => ({ ...rf(0), id: `rf-id-${tag}`, publishUri: `rf-${tag}` }));
  88  | 
  89  | interface ListCall {
  90  |   api: 'ep' | 'rf';
  91  |   kind: 'old' | 'new';
  92  |   /** 請求抵達攔截器的順序 */
  93  |   requestSeq: number;
  94  |   /** route.fulfill 完成且瀏覽器收完回應後的順序；尚未完成為 undefined */
  95  |   fulfillSeq?: number;
  96  | }
  97  | 
  98  | /**
  99  |  * 在 spec 內以 page.route 攔截兩支清單 API（比 mockApi 晚註冊，優先處理）。
  100 |  * hold 模式下抵達的請求一律扣住，release() 時才以舊資料回應；其餘請求立即以新資料回應。
  101 |  */
  102 | async function installStaleControl(page: Page) {
  103 |   let mode: 'new' | 'hold' = 'new';
  104 |   let requestSeq = 0;
  105 |   let fulfillSeq = 0;
  106 |   const calls: ListCall[] = [];
  107 |   let held: { call: ListCall; open: () => void; done: Promise<void> }[] = [];
  108 | 
  109 |   // 瀏覽器端：記錄兩支清單 API 的 XHR loadend 次數，用來確認回應已交給前端程式處理
  110 |   await page.addInitScript(
  111 |     ([epPath, rfPath]) => {
  112 |       const w = window as unknown as { __listLoadEnd: number };
  113 |       w.__listLoadEnd = 0;
  114 |       const send = XMLHttpRequest.prototype.send;
  115 |       const open = XMLHttpRequest.prototype.open;
  116 |       XMLHttpRequest.prototype.open = function (this: XMLHttpRequest & { __url?: string }, ...args: unknown[]) {
  117 |         this.__url = String(args[1]);
  118 |         return (open as (...a: unknown[]) => void).apply(this, args);
  119 |       } as typeof XMLHttpRequest.prototype.open;
  120 |       XMLHttpRequest.prototype.send = function (this: XMLHttpRequest & { __url?: string }, body?: Document | XMLHttpRequestBodyInit | null) {
  121 |         const url = this.__url ?? '';
  122 |         if (url.includes(epPath) || url.includes(rfPath)) {
  123 |           this.addEventListener('loadend', () => {
  124 |             w.__listLoadEnd += 1;
  125 |           });
  126 |         }
  127 |         return send.call(this, body);
  128 |       };
  129 |     },
  130 |     [EP_LIST_PATH, RF_LIST_PATH],
  131 |   );
  132 | 
  133 |   await page.route(
  134 |     (url) => url.pathname === EP_LIST_PATH || url.pathname === RF_LIST_PATH,
  135 |     async (route) => {
  136 |       const request = route.request();
  137 |       const api = new URL(request.url()).pathname === EP_LIST_PATH ? 'ep' : 'rf';
  138 |       const call: ListCall = { api, kind: mode === 'hold' ? 'old' : 'new', requestSeq: ++requestSeq };
  139 |       calls.push(call);
  140 |       const data =
  141 |         api === 'ep' ? (call.kind === 'old' ? OLD_ENDPOINTS : ENDPOINTS) : call.kind === 'old' ? OLD_RESTFULS : RESTFULS;
  142 |       const respond = async () => {
  143 |         await route.fulfill({ json: ok(data) });
  144 |         await (await request.response())?.finished();
  145 |         call.fulfillSeq = ++fulfillSeq;
  146 |       };
  147 |       if (call.kind === 'new') {
  148 |         await respond();
  149 |         return;
  150 |       }
  151 |       let open = () => undefined as void;
  152 |       const gate = new Promise<void>((resolve) => {
  153 |         open = resolve;
  154 |       });
  155 |       const done = gate.then(respond);
  156 |       held.push({ call, open, done });
  157 |       await done;
  158 |     },
  159 |   );
  160 | 
  161 |   return {
  162 |     calls,
  163 |     heldCount: (api: 'ep' | 'rf') => held.filter((h) => h.call.api === api).length,
  164 |     hold: () => {
  165 |       mode = 'hold';
  166 |     },
  167 |     immediate: () => {
```