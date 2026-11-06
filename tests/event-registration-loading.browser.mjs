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
  // A fresh browser context is signed out. Do not fabricate a Firebase user.
  let capability;
  let mode = 'stall';
  let count = 0;
  let heldStatus;
  let receiptSubmitted = false;
  let fixtureRegistration = null;
  await page.route('**/node_modules/.vite/deps/@paypal_react-paypal-js.js*', async route => {
    await route.fulfill({ contentType: 'application/javascript', body: `
      import React from '/node_modules/.vite/deps/react.js';
      const jsx = React.createElement;
      export function PayPalScriptProvider({children}) { return children; }
      export function PayPalButtons(props) {
        return jsx('button', {'data-testid':'fixture-paypal', children:'PayPal fixture',
          onClick:async()=>{ try { await props.createOrder(); } catch(e) { props.onError(e); } }
        });
      }` });
  });
  await page.route('**/api/event', async route => {
    assert.equal(new URL(route.request().url()).pathname, '/api/event');
    const body = route.request().postDataJSON();
    const authorization = route.request().headers().authorization;
    assert.match(authorization, /^Guest [a-f0-9]{64}$/);
    capability ??= authorization;
    assert.equal(authorization, capability, 'The same guest must own lookup, receipt and payment');
    if (body.action === 'register-cliq') {
      assert.match(body.receiptDataUrl, /^data:image\/jpeg;base64,/);
      assert.ok(body.receiptDataUrl.length > 100);
      receiptSubmitted = true;
      fixtureRegistration = {
        id: 'fixture-pending', name: body.name, phone: body.phone, email: body.email,
        attendance: 'in-person', status: 'pending', membershipStatus: 'Standard',
      };
      return route.fulfill({ json: { registration: fixtureRegistration } });
    }
    assert.equal(body.action, 'mine', 'Never create real PayPal orders in this test');
    count += 1;
    if (mode === 'hold') { heldStatus = route; return; }
    if (mode === 'stall') return; // Intentionally unanswered until the app aborts.
    if (mode === 'html') return route.fulfill({ status: 200, contentType: 'text/html', body: '<html>Fallback</html>' });
    if (mode === 'server-error') return route.fulfill({ status: 500, json: { error: 'Fixture backend failure' } });
    return route.fulfill({ json: { registration: fixtureRegistration } });
  });
  await page.goto(`${process.env.EVENT_TEST_URL || 'http://localhost:80'}/event`);
  const error = page.getByTestId('event-registration-error');
  await error.waitFor({ state: 'visible', timeout: 25000 });
  await error.scrollIntoViewIfNeeded();
  assert.match(await error.innerText(), /استعراض التذاكر/);
  await page.getByTestId('input-name').waitFor({ state: 'visible' });
  await page.getByTestId('tab-online').click();
  assert.equal(await page.getByTestId('tab-online').getAttribute('aria-selected'), 'true');
  await page.getByTestId('fixture-paypal').click();
  const paypalMessage = page.getByText(/تعذّر التحقق من تسجيلك، لذلك لم تبدأ عملية الدفع/);
  await paypalMessage.waitFor({ state: 'visible' });
  await page.getByTestId('tab-in-person').click();
  assert.equal(await page.getByTestId('tab-in-person').getAttribute('aria-selected'), 'true');
  await page.screenshot({ path: `${output}/timeout.jpg` });
  mode = 'success';
  await error.getByRole('button', { name: 'إعادة التحقق من التسجيل' }).click();
  await page.getByTestId('input-name').waitFor({ state: 'visible' });
  assert.equal(await error.count(), 0);
  await page.screenshot({ path: `${output}/recovered.jpg` });
  mode = 'html';
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await error.waitFor({ state: 'visible' });
  assert.match(await error.innerText(), /استعراض التذاكر/);
  await page.getByTestId('input-name').waitFor({ state: 'visible' });
  mode = 'server-error';
  await error.getByRole('button', { name: 'إعادة التحقق من التسجيل' }).click();
  await error.waitFor({ state: 'visible' });
  await page.getByTestId('input-name').waitFor({ state: 'visible' });
  mode = 'success';
  await error.getByRole('button', { name: 'إعادة التحقق من التسجيل' }).click();
  await page.getByTestId('input-name').waitFor({ state: 'visible' });
  assert.ok(count >= 5);
  await page.getByTestId('input-name').fill('Synthetic Receipt Test');
  await page.getByTestId('input-phone').fill('00962790000000');
  await page.getByTestId('input-event-email').fill('receipt-fixture@example.test');
  const input = page.getByTestId('input-receipt');
  await input.evaluate(node => { node.__pickerFixture = true; });
  mode = 'hold';
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await page.waitForFunction(() => document.querySelector('[data-testid="input-receipt"]')?.__pickerFixture === true);
  await input.setInputFiles({
    name: 'synthetic-receipt.png', mimeType: '',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64'),
  });
  await page.getByTestId('receipt-preview').waitFor({ state: 'visible' });
  assert.equal(await input.evaluate(node => node.__pickerFixture), true, 'Focus must not unmount the file input');
  await page.waitForFunction(() => {
    const img = document.querySelector('[data-testid="receipt-preview"] img');
    return img?.complete && img.naturalWidth > 0;
  });
  while (!heldStatus) await page.waitForTimeout(20);
  await heldStatus.fulfill({ json: { registration: null } });
  mode = 'success';
  await page.screenshot({ path: `${output}/receipt-preview.jpg` });
  await page.getByTestId('button-submit').click();
  await page.getByText('تم استلام طلبك وهو قيد المراجعة، وسنرسل لك بريداً للتأكيد فور التحقق.', { exact: false }).waitFor({ state: 'visible' });
  assert.equal(receiptSubmitted, true);
  assert.ok(page.url().endsWith('/event'), 'Guest checkout must not redirect to login');
  await page.reload();
  await page.getByTestId('event-registration-status').getByText(/قيد المراجعة/).waitFor({ state: 'visible' });
  console.log('PASS: signed-out guest receipt booking, persistent capability, timeout/HTML/HTTP500 ticket fallback, specific PayPal error, and mobile image focus/compression. No account creation, real writes or payments.');
} finally {
  await browser.close();
}
