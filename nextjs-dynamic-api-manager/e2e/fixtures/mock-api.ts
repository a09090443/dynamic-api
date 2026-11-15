import { test as base, expect, type Request } from '@playwright/test';
import { endpoints, responses, restfuls, savedRestful } from './mock-data';

/** 被攔截的管理 API 呼叫紀錄 */
export interface ApiCall {
  method: string;
  path: string;
  body: unknown;
}

export interface ApiEnvelope {
  code: number;
  message: string;
  data: unknown;
}

export interface MockApi {
  /** 依呼叫順序記錄的管理 API 請求 */
  calls: ApiCall[];
  /** 被保底規則擋下（非測試前端 origin）的網址 */
  blocked: string[];
  /** 沒有定義假資料、被回 code=500 的 API（`${METHOD} ${pathname}`） */
  unhandled: string[];
  /** 覆寫某個 API 的回應，key 格式為 `${METHOD} ${pathname}` */
  set: (key: string, body: ApiEnvelope) => void;
  /** 取得特定 API 的呼叫紀錄 */
  callsOf: (key: string) => ApiCall[];
}

const API_PATH = /^\/dynamic-api\/(ws|api|common)(\/|$)/;

const ok = (data: unknown): ApiEnvelope => ({ code: 200, message: 'OK', data });

const defaultResponses = (): Record<string, ApiEnvelope> => ({
  'GET /dynamic-api/ws/getEndpoints': ok(endpoints),
  'GET /dynamic-api/api/getControllers': ok(restfuls),
  'POST /dynamic-api/common/getResponseList': ok(responses),
  'POST /dynamic-api/api/saveController': ok(savedRestful),
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
          const path = new URL(request.url()).pathname;
          const key = `${request.method()} ${path}`;
          calls.push({ method: request.method(), path, body: readBody(request) });
          let json = table[key];
          if (!json) {
            unhandled.push(key);
            json = { code: 500, message: `E2E 未定義假資料: ${key}`, data: null };
          }
          await route.fulfill({ json });
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
