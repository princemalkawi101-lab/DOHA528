import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { chromium } from '@playwright/test';

// Browser-only identity and status fixtures: no accounts, Firestore writes,
// receipts, payment orders, or emails. Use the normal shared preview proxy.
const browser = await chromium.launch({
  executablePath: existsSync('/repl/tools/bin/chromium') ? '/repl/tools/bin/chromium' : undefined,
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 402, height: 874 } });
const output = 'generated-artifacts/event-loading';
await mkdir(output, { recursive: true });
try {
  await page.addInitScript(() => {
    window.__eventStatusUser = { uid: 'browser-status-fixture', email: 'fixture@example.test' };
  });
  await page.route('**/src/lib/auth.tsx*', async route => {
    const response = await route.fetch();
    const source = await response.text();
    assert.ok(source.includes('return ctx;'), 'Auth fixture must match the real module');
    await route.fulfill({
      response,
      body: source.replace('return ctx;', 'return {user: window.__eventStatusUser, loading: false, isAdmin: false};'),
    });
  });
  let mode = 'stall';
  let count = 0;
  await page.route('**/api/event', async route => {
    assert.equal(new URL(route.request().url()).pathname, '/api/event');
    const body = route.request().postDataJSON();
    assert.equal(body.action, 'mine', 'No mutations are allowed in this test');
    count += 1;
    if (mode === 'stall') return; // Intentionally unanswered until the app aborts.
    if (mode === 'html') return route.fulfill({ status: 200, contentType: 'text/html', body: '<html>Fallback</html>' });
    if (mode === 'server-error') return route.fulfill({ status: 500, json: { error: 'Fixture backend failure' } });
    return route.fulfill({ json: { registration: null } });
  });
  await page.goto(`${process.env.EVENT_TEST_URL || 'http://localhost:80'}/event`);
  const error = page.getByTestId('event-registration-error');
  await error.waitFor({ state: 'visible', timeout: 25000 });
  await error.scrollIntoViewIfNeeded();
  assert.match(await error.innerText(), /استعراض التذاكر/);
  await page.getByTestId('input-name').waitFor({ state: 'visible' });
  await page.getByTestId('tab-online').click();
  assert.equal(await page.getByTestId('tab-online').getAttribute('aria-selected'), 'true');
  await page.getByTestId('tab-in-person').click();
  assert.equal(await page.getByTestId('tab-in-person').getAttribute('aria-selected'), 'true');
  await page.screenshot({ path: `${output}/timeout.jpg` });
  mode = 'success';
  await error.getByRole('button', { name: 'إعادة المحاولة' }).click();
  await page.getByTestId('input-name').waitFor({ state: 'visible' });
  assert.equal(await error.count(), 0);
  await page.screenshot({ path: `${output}/recovered.jpg` });
  mode = 'html';
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await error.waitFor({ state: 'visible' });
  assert.match(await error.innerText(), /استعراض التذاكر/);
  await page.getByTestId('input-name').waitFor({ state: 'visible' });
  mode = 'server-error';
  await error.getByRole('button', { name: 'إعادة المحاولة' }).click();
  await error.waitFor({ state: 'visible' });
  await page.getByTestId('input-name').waitFor({ state: 'visible' });
  mode = 'success';
  await error.getByRole('button', { name: 'إعادة المحاولة' }).click();
  await page.getByTestId('input-name').waitFor({ state: 'visible' });
  assert.ok(count >= 5);
  console.log('PASS: timeout, HTML fallback, and HTTP500 preserve selectable tickets; inline retry recovers. Same-origin /api/event; no writes/payments.');
} finally {
  await browser.close();
}
