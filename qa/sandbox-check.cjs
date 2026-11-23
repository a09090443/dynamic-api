'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, expect } = require(process.env.AI_TEAM_E2E_PLAYWRIGHT);
const base = process.env.AI_TEAM_E2E_BASE;
const mode = process.env.AI_TEAM_E2E_MODE;
const output = process.env.AI_TEAM_E2E_OUTPUT;
const cases = [];
fs.mkdirSync(output, { recursive: true });

async function list(suffix) {
  const response = await fetch(`${base}/${suffix}`, { signal: AbortSignal.timeout(15000) });
  assert.equal(response.status, 200, `API HTTP status: ${suffix}`);
  const body = await response.json();
  assert.equal(body.code, 200, `API result code: ${suffix}`);
  assert.ok(Array.isArray(body.data), `API array: ${suffix}`);
  return body.data;
}
const identity = rows => rows.map(x => [x.id, x.publishUri, x.classPath, x.jarFileId]).sort();
async function scenario(name, action) {
  await action();
  cases.push(name);
  console.log(`SANDBOX_SCENARIO_PASS ${mode}:${name}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ locale: 'zh-TW', serviceWorkers: 'block' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    const [endpoints, controllers] = await Promise.all([list('ws/getEndpoints'), list('api/getControllers')]);
    if (mode !== 'main') {
      assert.equal(endpoints.length, 3);
      assert.equal(controllers.length, mode === 'zero' ? 0 : 4);
      assert.deepEqual(endpoints.map(x => x.publishUri).sort(), ['qa-ep-1', 'qa-ep-2', 'qa-ep-3']);
      assert.deepEqual(controllers.map(x => x.publishUri).sort(), mode === 'zero' ? [] : ['qa-rf-1', 'qa-rf-2', 'qa-rf-3', 'qa-rf-4']);
    }
    await scenario('real-parallel-lists', async () => {
      for (let batch = 0; batch < 16; batch++) {
        await Promise.all(Array.from({ length: 16 }, async (_, i) => {
          const endpoint = i % 2 === 0;
          const actual = await list(endpoint ? 'ws/getEndpoints' : 'api/getControllers');
          assert.deepEqual(identity(actual), identity(endpoint ? endpoints : controllers), 'concurrent query must retain service type and identifiers');
        }));
      }
    });
    await page.goto(`${base}/endpoint/`, { waitUntil: 'networkidle' });
    const check = async type => {
      await expect(page.getByTestId('nav-count-endpoints')).toHaveText(String(endpoints.length));
      await expect(page.getByTestId('nav-count-controllers')).toHaveText(String(controllers.length));
      const expected = type === 'ep' ? endpoints : controllers;
      const rows = page.locator('tbody tr[data-testid^="row-"]');
      if (expected.length <= 10) await expect(rows).toHaveCount(expected.length);
      const rendered = await rows.evaluateAll(nodes => nodes.map(n => n.getAttribute('data-testid')));
      for (const id of rendered) assert.ok(expected.some(x => id === `row-${x.publishUri}`), `foreign row: ${id}`);
      if (mode !== 'main') for (const item of expected) await expect(page.getByTestId(`row-${item.publishUri}`)).toBeVisible();
      if (type === 'ep') await expect(page.getByTestId('stat-全部服務')).toHaveText(String(endpoints.length));
    };
    await scenario('real-sidebar-list-consistency', async () => {
      await check('ep');
      const nav = page.getByRole('navigation', { name: '主選單' });
      for (let round = 0; round < 8; round++) {
        await nav.getByRole('link', { name: /^RESTful API/ }).click();
        await check('rf');
        await nav.getByRole('link', { name: /^SOAP Endpoint/ }).click();
        await check('ep');
      }
    });
    await scenario('rapid-navigation-and-zero-boundary', async () => {
      const nav = page.getByRole('navigation', { name: '主選單' });
      for (let i = 0; i < 12; i++) await nav.getByRole('link', { name: i % 2 ? /^SOAP Endpoint/ : /^RESTful API/ }).click();
      await check('ep');
      await nav.getByRole('link', { name: /^RESTful API/ }).click();
      await check('rf');
      assert.deepEqual(errors, [], 'browser runtime errors');
    });
    await page.screenshot({ path: path.join(output, `${mode}-passed.png`), fullPage: true });
    fs.writeFileSync(path.join(output, `${mode}.json`), JSON.stringify({ mode, base, scenarios: cases, passed: cases.length }));
  } catch (error) {
    await page.screenshot({ path: path.join(output, `${mode}-failed.png`), fullPage: true }).catch(() => {});
    throw error;
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
