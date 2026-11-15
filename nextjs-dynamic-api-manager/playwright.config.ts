import { defineConfig, devices } from '@playwright/test';

// 固定埠不可用 3000：src/config/config.ts 在網址含 ':3000' 時會改用 NEXT_PUBLIC_API_URL，
// 用 3100 才會讓 API 走同源的 /dynamic-api/...，可被 e2e/fixtures/mock-api.ts 攔截。
const PORT = 3100;
const BASE_ORIGIN = `http://127.0.0.1:${PORT}`;
const BASE_URL = `${BASE_ORIGIN}/dynamic-api/`;

export default defineConfig({
  testDir: './e2e',
  outputDir: 'test-results',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    // 結尾斜線必要：測試以相對路徑（例如 'endpoint/'）開頁，才會保留 basePath
    baseURL: BASE_URL,
    locale: 'zh-TW',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // DYNAMIC_API_E2E=1 讓 next.config 不做靜態匯出，next start 才能啟動；build 與 start 都會帶到
    command: `npm run build && npm run start -- --hostname 127.0.0.1 --port ${PORT}`,
    env: { DYNAMIC_API_E2E: '1' },
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 300_000,
    stdout: 'pipe',
  },
});
