import { test as base, expect, type Request } from '@playwright/test';
import { endpoints, responses, restfuls, savedRestful } from './mock-data';

/** 被攔截的管理 API 呼叫紀錄 */
export interface ApiCall {
  method: string;
  path: string;
  /** 查詢字串（GET 的 switchWebService 等以 query 傳參） */
  query: Record<string, string>;
  body: unknown;
  /** 原始本文（multipart 等非 JSON 本文用來核對欄位名稱） */
  raw: string | null;
}

export interface ApiEnvelope {
  code: number;
  message: string;
  data: unknown;
}

/** 非 envelope 的回覆：自訂 HTTP 狀態、本文、延遲或中斷連線 */
export interface MockReply {
  json?: ApiEnvelope;
  status?: number;
  body?: string | Buffer;
  contentType?: string;
  headers?: Record<string, string>;
  /** 模擬網路錯誤 */
  abort?: boolean;
  /** 回覆前等待毫秒數（用來觀察載入中／轉換中狀態） */
  delayMs?: number;
}

export type MockHandler = (call: ApiCall) => MockReply | Promise<MockReply>;

export interface MockApi {
  /** 依呼叫順序記錄的管理 API 請求 */
  calls: ApiCall[];
  /** 被保底規則擋下（非測試前端 origin）的網址 */
  blocked: string[];
  /** 沒有定義假資料、被回 code=500 的 API（`${METHOD} ${pathname}`） */
  unhandled: string[];
  /** 覆寫某個 API 的回應，key 格式為 `${METHOD} ${pathname}`；可給 envelope 或自訂 handler */
  set: (key: string, body: ApiEnvelope | MockHandler) => void;
  /** 取得特定 API 的呼叫紀錄 */
  callsOf: (key: string) => ApiCall[];
}

const API_PATH = /^\/dynamic-api\/(ws|api|common)(\/|$)/;

export const ok = (data: unknown): ApiEnvelope => ({ code: 200, message: 'OK', data });
export const fail = (message = '後端錯誤', code = 500): ApiEnvelope => ({ code, message, data: null });

export const EP = {
  list: 'GET /dynamic-api/ws/getEndpoints',
  switch: 'GET /dynamic-api/ws/switchWebService',
  remove: 'DELETE /dynamic-api/ws/removeWebService',
  wsdl: 'POST /dynamic-api/ws/genWsdlObj',
};
export const RF = {
  list: 'GET /dynamic-api/api/getControllers',
  switch: 'GET /dynamic-api/api/switchController',
  remove: 'DELETE /dynamic-api/api/removeController',
  save: 'POST /dynamic-api/api/saveController',
};
export const RSP = {
  list: 'POST /dynamic-api/common/getResponseList',
  save: 'POST /dynamic-api/common/saveMockResponse',
  update: 'POST /dynamic-api/common/updateResponse',
  remove: 'DELETE /dynamic-api/common/deleteResponse',
  switch: 'GET /dynamic-api/common/switchResponse',
};

/** getResponseList 預設依 publishUri＋serviceType 篩選假資料，讓各服務筆數不同 */
const responseListHandler: MockHandler = (call) => {
  const body = (call.body ?? {}) as { publishUri?: string; serviceType?: string };
  return {
    json: ok(responses.filter((r) => r.publishUri === body.publishUri && r.serviceType === body.serviceType)),
  };
};

const defaultResponses = (): Record<string, ApiEnvelope | MockHandler> => ({
  [EP.list]: ok(endpoints),
  [EP.switch]: ok(null),
  [EP.remove]: ok(null),
  [RF.list]: ok(restfuls),
  [RF.switch]: ok(null),
  [RF.remove]: ok(null),
  [RF.save]: ok(savedRestful),
  [RSP.list]: responseListHandler,
  [RSP.save]: ok(null),
  [RSP.update]: ok(null),
  [RSP.remove]: ok(null),
  [RSP.switch]: ok(null),
});

const readBody = (request: Request): unknown => {
  try {
    return request.postDataJSON();
  } catch {
    // multipart 等非 JSON 本文
    return request.postData();
  }
};

/**
 * 每個測試自動套用的 API 攔截夾具：
 * 1. 非測試前端 origin 的請求一律 abort（不連真後端或外部網站）。
 * 2. /dynamic-api/ws|api|common 一律以假資料 fulfill，未定義的 API 回 code=500，絕不轉送。
 * 兩條規則都在 provide 之前註冊，因此在任何 page.goto 之前生效。
 */
export const test = base.extend<{ mockApi: MockApi }>({
  mockApi: [
    // 回呼參數命名為 provide（不用 use），避免 eslint-plugin-react-hooks 誤判成 Hook
    async ({ page, baseURL }, provide) => {
      if (!baseURL) {
        throw new Error('playwright.config.ts 未設定 baseURL');
      }
      const origin = new URL(baseURL).origin;
      const table = defaultResponses();
      const calls: ApiCall[] = [];
      const blocked: string[] = [];
      const unhandled: string[] = [];

      // 保底規則（先註冊、後處理）：只放行測試前端伺服器本身
      await page.route('**/*', async (route) => {
        const url = route.request().url();
        if (new URL(url).origin !== origin) {
          blocked.push(url);
          await route.abort('blockedbyclient');
          return;
        }
        await route.continue();
      });

      // 管理 API 規則（後註冊、優先處理）
      await page.route(
        (url) => url.origin === origin && API_PATH.test(url.pathname),
        async (route) => {
          const request = route.request();
          // 頁面來源與 API 來源不同時（見 e2e/origin.spec.ts）瀏覽器會套用 CORS：預檢直接放行、回應帶允許標頭
          const cors = { 'access-control-allow-origin': '*' };
          if (request.method() === 'OPTIONS') {
            await route.fulfill({
              status: 204,
              headers: {
                ...cors,
                'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'access-control-allow-headers': '*',
              },
            });
            return;
          }
          const url = new URL(request.url());
          const path = url.pathname;
          const key = `${request.method()} ${path}`;
          const call: ApiCall = {
            method: request.method(),
            path,
            query: Object.fromEntries(url.searchParams.entries()),
            body: readBody(request),
            raw: request.postData(),
          };
          calls.push(call);
          const entry = table[key];
          if (!entry) {
            unhandled.push(key);
            await route.fulfill({ headers: cors, json: { code: 500, message: `E2E 未定義假資料: ${key}`, data: null } });
            return;
          }
          const reply: MockReply = typeof entry === 'function' ? await entry(call) : { json: entry };
          if (reply.delayMs) {
            await new Promise((r) => setTimeout(r, reply.delayMs));
          }
          if (reply.abort) {
            await route.abort('failed');
            return;
          }
          if (reply.json) {
            await route.fulfill({ status: reply.status ?? 200, headers: cors, json: reply.json });
            return;
          }
          await route.fulfill({
            status: reply.status ?? 200,
            body: reply.body ?? '',
            contentType: reply.contentType,
            headers: { ...cors, ...reply.headers },
          });
        },
      );

      await provide({
        calls,
        blocked,
        unhandled,
        set: (key, body) => {
          table[key] = body;
        },
        callsOf: (key) => calls.filter((c) => `${c.method} ${c.path}` === key),
      });
    },
    { auto: true },
  ],
});

export { expect };
