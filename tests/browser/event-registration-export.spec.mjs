import { test, expect } from '@playwright/test';
import { assertFails } from '@firebase/rules-unit-testing';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { environment, identity, password, patch, registrations, rules, seed } from './fixtures.mjs';

let env;
const downloadButton = (page) => page.getByTestId('button-download-event-csv');
const count = (page) => page.getByTestId('status-event-export-count');
const select = (page) => page.getByTestId('select-event-export');

test.beforeEach(async ({ context }) => {
  env = await environment();
  await env.clearFirestore();
  // Fail closed: only local app/emulator requests and blob downloads can leave a
  // test context. In particular no live Firebase, PayPal, Gmail, or Resend.
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.protocol === 'blob:' || url.protocol === 'data:') return route.continue();
    if (url.hostname === '127.0.0.1' && ['3199', '9198', '8185'].includes(url.port)) {
      if (url.port === '3199' && url.pathname.startsWith('/api/')) {
        return route.fulfill({ status: 501, json: { error: 'Unmocked API request blocked by browser tests' } });
      }
      return route.continue();
    }
    return route.abort('blockedbyclient');
  });
});

test.afterEach(async () => {
  if (!env) return;
  await env.clearFirestore();
  await env.cleanup();
});

for (const attendance of ['in-person', 'online']) {
  test(`additional booking preserves and restores existing ${attendance} booking`, async ({ page }) => {
    await env.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'siteSettings/config'), {
      event: { enabled: true, cliqAlias: 'SYNTHETIC', cliqAccountName: 'Synthetic test' },
    }));
    const oldToken = 'a'.repeat(64);
    await page.addInitScript(token => {
      if (!localStorage.getItem('power-healing-event-guest')) localStorage.setItem('power-healing-event-guest', token);
    }, oldToken);
    const oldBooking = {
      id: 'synthetic-existing', name: 'حجز سابق', phone: '0790000000', email: 'old@example.test',
      attendance, status: attendance === 'online' ? 'approved' : 'pending', membershipStatus: 'Standard',
    };
    const bookings = new Map([[`Guest ${oldToken}`, oldBooking]]);
    const writes = [];
    await page.route('**/api/event', async route => {
      const body = route.request().postDataJSON();
      const authorization = route.request().headers().authorization;
      if (body.action === 'mine') return route.fulfill({ json: { registration: bookings.get(authorization) || null } });
      if (body.action === 'register-cliq') {
        writes.push(authorization);
        const next = { ...oldBooking, ...body, id: 'synthetic-new', attendance: 'in-person', status: 'pending' };
        bookings.set(authorization, next);
        return route.fulfill({ json: { registration: next } });
      }
      throw new Error(`Unexpected payment operation ${body.action}`);
    });
    await page.goto('/event');
    await expect(page.getByTestId('button-new-event-booking')).toBeVisible();
    // Switching attendance alone must never charge the existing guest again.
    await page.getByTestId('tab-online').click();
    await expect(page.locator('#ev-name-online')).toHaveCount(0);
    await page.getByTestId('tab-in-person').click();
    await expect(page.getByTestId('input-name')).toHaveCount(0);
    page.once('dialog', dialog => dialog.accept());
    await page.getByTestId('button-new-event-booking').click();
    await expect(page.getByTestId('input-name')).toHaveValue('');
    const newToken = await page.evaluate(() => localStorage.getItem('power-healing-event-guest'));
    expect(newToken).not.toBe(oldToken);
    // Both payment forms are available for the new booking.
    await page.getByTestId('tab-online').click();
    await expect(page.locator('#ev-name-online')).toHaveValue('');
    await page.reload();
    await expect(page.getByTestId('input-name')).toHaveValue('');
    await page.getByTestId('input-name').fill('حجز جديد');
    await page.getByTestId('input-phone').fill('0790000001');
    await page.locator('#ev-email').fill('new@example.test');
    await page.locator('input[type=file]').setInputFiles({
      name: 'synthetic.png', mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64'),
    });
    await page.getByTestId('button-submit').click();
    await expect(page.getByTestId('modal-post-registration')).toBeVisible();
    await page.getByTestId('button-close-post').click();
    await page.reload();
    await expect(page.getByTestId('status-submitted')).toContainText('حجز جديد');
    await page.getByTestId('select-previous-booking').selectOption(oldToken);
    await expect(page.getByTestId(attendance === 'online' ? 'status-paypal-done' : 'status-submitted')).toContainText('حجز سابق');
    await page.reload();
    await expect(page.getByTestId(attendance === 'online' ? 'status-paypal-done' : 'status-submitted')).toContainText('حجز سابق');
    expect(writes).toEqual([`Guest ${newToken}`]);
    expect(bookings.get(`Guest ${oldToken}`)).toEqual(oldBooking);
  });
}

async function login(page, user) {
  await page.goto('/login');
  await page.evaluate(() => sessionStorage.setItem('dh_redirect_after_login', '/admin'));
  await page.locator('input[type=email]').fill(user.email);
  await page.locator('input[autocomplete=current-password]').fill(password);
  await page.locator('button[type=submit]').click();
  await expect(page).toHaveURL(/\/admin$/);
}

test('online and VIP Telegram buttons remain distinct after reopening the confirmation', async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await env.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'siteSettings/config'), {
    event: { enabled: true, cliqAlias: 'SYNTHETIC' },
  }));
  let registration = {
    id: 'synthetic-online', name: 'مشترك أونلاين', phone: '0790000000', email: 'online@example.test',
    attendance: 'online', status: 'approved', membershipStatus: 'Standard',
    onlineTelegramUrl: 'https://t.me/+_5Dhdrs3Iq8zNzRk',
  };
  await page.route('**/api/event', route => route.fulfill({ json: { registration } }));
  await page.goto('/event');
  await page.getByTestId('button-view-current-booking').click();
  await expect(page.getByTestId('link-online-telegram')).toHaveAttribute('href', registration.onlineTelegramUrl);
  await expect(page.getByTestId('link-telegram')).toHaveCount(0);
  await page.getByTestId('button-decline-vip').click();
  await expect(page.getByTestId('link-online-telegram')).toBeVisible();
  await page.getByTestId('button-close-post').click();
  await page.reload();
  await page.getByTestId('button-view-current-booking').click();
  await expect(page.getByTestId('link-online-telegram')).toHaveAttribute('href', registration.onlineTelegramUrl);
  await page.getByTestId('button-close-post').click();
  registration = { ...registration, membershipStatus: 'VIP Member', telegramUrl: 'https://t.me/+dl3H-ZKTnqg2N2Y0' };
  await page.reload();
  await page.getByTestId('button-view-current-booking').click();
  await expect(page.getByTestId('link-online-telegram')).toHaveAttribute('href', registration.onlineTelegramUrl);
  await expect(page.getByTestId('link-telegram')).toHaveAttribute('href', registration.telegramUrl);
  for (const id of ['link-online-telegram', 'link-telegram']) {
    const colors = await page.getByTestId(id).evaluate(link => {
      const style = getComputedStyle(link);
      return { foreground: style.color, background: style.backgroundColor };
    });
    const luminance = value => value.match(/[\d.]+/g).slice(0, 3).map(Number)
      .map(value => value / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
      .reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    const light = luminance(colors.foreground), dark = luminance(colors.background);
    expect((Math.max(light, dark) + .05) / (Math.min(light, dark) + .05)).toBeGreaterThan(4.5);
  }
  await page.getByTestId('modal-post-registration').screenshot({ path: 'generated-artifacts/event-registration-browser/online-vip-access.jpg' });
});

async function openEvent(page) {
  await page.getByRole('button', { name: 'الفعالية', exact: true }).click();
  await expect(select(page)).toBeVisible();
}

async function admin(page) {
  const user = await identity(true);
  await login(page, user);
  await openEvent(page);
  return user;
}

test('private WhatsApp email settings save and reload only through authenticated admin API', async ({ page }) => {
  await page.setViewportSize({ width: 402, height: 874 });
  await seed(env);
  let saved = {
    enabled: false, url: '', invitation: 'Synthetic invitation',
    buttonLabel: 'الانضمام إلى قناة الورشة', revision: 0,
  };
  const writes = [];
  await page.route('**/api/event', async route => {
    const request = route.request();
    const body = request.postDataJSON();
    const token = request.headers().authorization?.replace(/^Bearer /, '');
    const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    expect(claims.admin).toBe(true);
    if (body.action === 'get-private-email-settings') return route.fulfill({ json: { whatsapp: saved } });
    if (body.action === 'save-private-email-settings') {
      writes.push(body);
      saved = { ...body.whatsapp, revision: body.whatsapp.revision + 1 };
      return route.fulfill({ json: { whatsapp: saved } });
    }
    throw new Error(`Unexpected API action: ${body.action}`);
  });
  await admin(page);
  await page.getByTestId('event-mail-settings-panel').locator('summary').click();
  await expect(page.getByTestId('checkbox-event-whatsapp-enabled')).toBeEnabled();
  await page.getByTestId('checkbox-event-whatsapp-enabled').check();
  await page.getByTestId('input-event-whatsapp-url').fill('https://whatsapp.com/channel/SYNTHETIC_ONLY');
  await page.getByTestId('input-event-whatsapp-invitation').fill('انضم لمتابعة تفاصيل الورشة');
  await page.getByTestId('input-event-whatsapp-label').fill('انضم لقناة الورشة');
  await page.getByTestId('button-save-event-whatsapp').click();
  await expect(page.getByTestId('event-whatsapp-saved')).toBeVisible();
  expect(writes).toHaveLength(1);
  expect(writes[0].whatsapp.url).toBe('https://whatsapp.com/channel/SYNTHETIC_ONLY');
  const widths = await page.getByTestId('event-whatsapp-settings').evaluate(section => ({ width: section.clientWidth, content: section.scrollWidth }));
  expect(widths.content).toBeLessThanOrEqual(widths.width + 1);
  await page.getByTestId('event-whatsapp-settings').screenshot({ path: 'generated-artifacts/event-registration-browser/private-whatsapp-settings.jpg' });
  await page.reload();
  await openEvent(page);
  await page.getByTestId('event-mail-settings-panel').locator('summary').click();
  await expect(page.getByTestId('input-event-whatsapp-url')).toHaveValue(saved.url);
  await expect(page.getByTestId('checkbox-event-whatsapp-enabled')).toBeChecked();
  await page.getByTestId('checkbox-event-whatsapp-enabled').uncheck();
  await page.getByTestId('button-save-event-whatsapp').click();
  await expect(page.getByTestId('event-whatsapp-saved')).toBeVisible();
  expect(saved.enabled).toBe(false);
  expect(saved.revision).toBe(2);
  let publicData;
  await env.withSecurityRulesDisabled(async context => {
    publicData = (await getDocs(collection(context.firestore(), 'siteSettings'))).docs.map(doc => doc.data());
  });
  expect(JSON.stringify(publicData)).not.toContain('SYNTHETIC_ONLY');
});

// Independent RFC-4180 reader so browser tests assert rows rather than calling
// the production exporter to manufacture their own expected result.
function parseCsv(text) {
  const rows = [];
  let row = [], cell = '', quoted = false;
  text = text.replace(/^\uFEFF/, '');
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && char === ',') { row.push(cell); cell = ''; }
    else if (!quoted && char === '\r' && text[i + 1] === '\n') {
      row.push(cell); rows.push(row); row = []; cell = ''; i++;
    } else cell += char;
  }
  return rows;
}

async function downloadedRows(page, selection, ids) {
  await select(page).selectOption(selection);
  await expect(count(page)).toHaveText(`${ids.length} تسجيلات مطابقة`);
  const downloaded = page.waitForEvent('download');
  await downloadButton(page).click();
  const file = await downloaded;
  expect(file.suggestedFilename()).toMatch(new RegExp(`^event-${selection}-\\d{4}-\\d{2}-\\d{2}\\.csv$`));
  const bytes = await readFile(await file.path());
  expect([...bytes.subarray(0, 3)]).toEqual([239, 187, 191]);
  const text = bytes.toString('utf8');
  const [header, ...rows] = parseCsv(text);
  expect(header).toEqual([
    'Registration reference', 'Name', 'Phone', 'Email', 'Attendance',
    'Base ticket status', 'Membership status', 'Arrival status',
    'Arrived at (UTC)', 'Duplicate check-in attempts',
  ]);
  expect(rows.map((row) => row[0]).sort()).toEqual([...ids].sort());
  expect(text).not.toMatch(/PRIVATE_|SYNTHETIC_EMAIL_ERROR|ORDER_ONLY_NOT_VERIFIED|receiptDataUrl|userId/);
  for (const row of rows) {
    const source = registrations.find((entry) => entry.id === row[0]);
    expect(row[1]).toBe(source.name);
    expect(row[2]).toBe(`'${source.phone}`);
    expect(row[3]).toBe(source.email ?? '');
    expect(row[4]).toBe(source.attendance);
  }
  return rows;
}

test('visitors cannot see export controls or read registration data', async ({ page }) => {
  await seed(env);
  const downloads = [];
  page.on('download', (file) => downloads.push(file));
  await page.goto('/admin');
  await expect(page).toHaveURL(/\/login$/);
  await expect(select(page)).toHaveCount(0);
  await expect(downloadButton(page)).toHaveCount(0);
  await expect(page.getByText(registrations[0].name, { exact: true })).toHaveCount(0);
  await assertFails(getDocs(collection(env.unauthenticatedContext().firestore(), 'eventRegistrations')));
  expect(downloads).toHaveLength(0);
});

test('a signed-in non-administrator cannot export or bypass Firestore rules', async ({ page }) => {
  await seed(env);
  const user = await identity();
  await login(page, user);
  await expect(page.getByText(user.email, { exact: true })).toBeVisible();
  await expect(select(page)).toHaveCount(0);
  await expect(downloadButton(page)).toHaveCount(0);
  await expect(page.getByTestId('input-event-search')).toHaveCount(0);
  await expect(page.getByText(registrations[0].name, { exact: true })).toHaveCount(0);
  await assertFails(getDocs(collection(env.authenticatedContext(user.uid, { email: user.email }).firestore(), 'eventRegistrations')));
});

test('each selection downloads only matching rows, independently of the search', async ({ page }) => {
  await seed(env);
  await admin(page);
  await expect(downloadButton(page)).toBeEnabled();
  await expect(page.getByTestId('text-event-export-privacy')).toBeVisible();
  const standard = await downloadedRows(page, 'approved-standard', ['standard', 'legacy']);
  expect(standard.every((row) => row[5] === 'approved' && row[6] === 'Standard')).toBe(true);
  const vip = await downloadedRows(page, 'verified-vip', ['vip-approved', 'vip-pending', 'vip-rejected']);
  expect(vip.map((row) => row[5]).sort()).toEqual(['approved', 'pending', 'rejected']);
  expect(vip.every((row) => row[6] === 'VIP Member')).toBe(true);
  await downloadedRows(page, 'pending-cliq', ['pending', 'vip-pending', 'not-verified']);
  await page.getByTestId('input-event-search').fill('no-such-synthetic-person');
  await expect(page.locator('[data-testid^="event-registration-card-"]')).toHaveCount(0);
  await downloadedRows(page, 'approved-standard', ['standard', 'legacy']);
  await page.screenshot({ path: 'generated-artifacts/event-registration-browser/admin-exports.png', fullPage: true });
});

test('loading blocks downloads until a successful live snapshot arrives', async ({ page }) => {
  await seed(env);
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  await page.route('http://127.0.0.1:8185/**', async (route) => {
    await gate;
    await route.continue();
  });
  try {
    await admin(page);
    await expect(downloadButton(page)).toBeDisabled();
    await expect(count(page)).toHaveText('بانتظار تحميل القائمة بنجاح.');
  } finally {
    release();
  }
  await expect(downloadButton(page)).toBeEnabled();
  await expect(count(page)).toHaveText('2 تسجيلات مطابقة');
});

test('empty lists and selections with no matches disable downloads', async ({ page }) => {
  await admin(page);
  for (const selection of ['approved-standard', 'verified-vip', 'pending-cliq']) {
    await select(page).selectOption(selection);
    await expect(count(page)).toHaveText('لا توجد تسجيلات مطابقة.');
    await expect(downloadButton(page)).toBeDisabled();
  }
  await seed(env, [registrations.find((entry) => entry.id === 'pending')]);
  await expect(downloadButton(page)).toBeEnabled();
  await expect(count(page)).toHaveText('1 تسجيلات مطابقة');
  await select(page).selectOption('verified-vip');
  await expect(downloadButton(page)).toBeDisabled();
  await expect(count(page)).toHaveText('لا توجد تسجيلات مطابقة.');
});

const deniedRules = rules.replace(
  'allow read, delete: if isAdmin();',
  'allow read, delete: if false;',
);

test('initial subscription errors block exports and show feedback', async ({ page }) => {
  await seed(env);
  const denied = await environment(deniedRules);
  try {
    await admin(page);
    await expect(page.getByTestId('event-registration-feedback')).toContainText('تعذّر تحميل');
    await expect(downloadButton(page)).toBeDisabled();
    await expect(count(page)).toHaveText('بانتظار تحميل القائمة بنجاح.');
  } finally {
    await denied.cleanup();
  }
});

test('a failed live subscription cannot export its previously loaded rows', async ({ page }) => {
  await seed(env);
  await admin(page);
  await expect(downloadButton(page)).toBeEnabled();
  const denied = await environment(deniedRules);
  try {
    await page.evaluate(async (fixtureUrl) => {
      const { reconnect } = await import(/* @vite-ignore */ fixtureUrl);
      await reconnect();
    }, `/@fs${fileURLToPath(new URL('./firebase.ts', import.meta.url))}`);
    await expect(page.getByTestId('event-registration-feedback')).toContainText('تعذّر تحميل');
    await expect(downloadButton(page)).toBeDisabled();
    await expect(count(page)).toHaveText('بانتظار تحميل القائمة بنجاح.');
  } finally {
    await denied.cleanup();
  }
});

test('external approval updates refresh counts and downloadable rows without reloading', async ({ page }) => {
  await seed(env);
  await admin(page);
  await select(page).selectOption('pending-cliq');
  await expect(count(page)).toHaveText('3 تسجيلات مطابقة');
  await patch(env, 'pending', { status: 'approved' });
  await expect(count(page)).toHaveText('2 تسجيلات مطابقة');
  const rows = await downloadedRows(page, 'approved-standard', ['standard', 'legacy', 'pending']);
  expect(rows.find((row) => row[0] === 'pending')[5]).toBe('approved');
  await patch(env, 'standard', { status: 'rejected' });
  await expect(count(page)).toHaveText('2 تسجيلات مطابقة');
});

test('review and retry-email controls retain authenticated requests and busy protection', async ({ page }) => {
  await seed(env);
  const user = await admin(page);
  await expect(downloadButton(page)).toBeEnabled();
  const requests = [];
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  await page.route('**/api/event', async (route) => {
    const request = route.request();
    const body = request.postDataJSON();
    const token = request.headers().authorization?.replace(/^Bearer /, '');
    expect(token).toBeTruthy();
    const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    expect(claims.user_id).toBe(user.uid);
    expect(claims.admin).toBe(true);
    requests.push(body);
    if (body.action === 'review' && body.status === 'approved') {
      await gate;
      await patch(env, body.registrationId, { status: 'approved', confirmationEmailStatus: 'failed' });
      return route.fulfill({ json: { status: 'approved', emailStatus: 'failed', emailError: 'synthetic failure' } });
    }
    if (body.action === 'retry-email') {
      await patch(env, body.registrationId, { confirmationEmailStatus: 'sent' });
      return route.fulfill({ json: { emailStatus: 'sent' } });
    }
    if (body.action === 'review' && body.status === 'rejected') {
      await patch(env, body.registrationId, { status: 'rejected' });
      return route.fulfill({ json: { status: 'rejected' } });
    }
    throw new Error(`Unexpected operation: ${JSON.stringify(body)}`);
  });
  await select(page).selectOption('pending-cliq');
  await page.getByTestId('event-registration-card-pending').locator('summary').click();
  await page.getByTestId('approve-event-pending').click();
  try {
    await expect.poll(() => requests.length).toBe(1);
    await expect(downloadButton(page)).toBeDisabled();
    await expect(page.getByTestId('approve-event-vip-pending')).toBeDisabled();
  } finally {
    release();
  }
  await expect(count(page)).toHaveText('2 تسجيلات مطابقة');
  await expect(page.getByTestId('event-registration-feedback')).toContainText('synthetic failure');
  await expect(page.getByTestId('retry-event-email-pending')).toBeEnabled();
  await page.getByTestId('retry-event-email-pending').click();
  await expect(page.getByTestId('event-registration-feedback')).toHaveText('تم إرسال بريد التأكيد.');
  await expect(page.getByTestId('retry-event-email-pending')).toHaveCount(0);
  const card = page.getByTestId('event-registration-card-pending');
  await card.getByRole('button', { name: 'رفض', exact: true }).click();
  await expect(page.getByTestId('approve-event-pending')).toBeVisible();
  await expect(page.getByTestId('event-registration-feedback')).toHaveText('تم رفض التسجيل.');
  expect(requests).toEqual([
    { action: 'review', registrationId: 'pending', status: 'approved' },
    { action: 'retry-email', registrationId: 'pending' },
    { action: 'review', registrationId: 'pending', status: 'rejected' },
  ]);
});

test('mobile event panels collapse and receipts open inside an accessible dialog', async ({ page }) => {
  await seed(env);
  await page.setViewportSize({ width: 402, height: 874 });
  await admin(page);
  const settings = page.getByTestId('event-settings-panel');
  await expect(settings).not.toHaveAttribute('open', '');
  await settings.locator('summary').click();
  await expect(settings).toHaveAttribute('open', '');
  await settings.locator('summary').click();
  const panel = page.getByTestId('event-registrations-panel');
  await panel.locator('summary').first().click();
  await expect(select(page)).toBeHidden();
  await panel.locator('summary').first().click();
  const card = page.getByTestId('event-registration-card-pending');
  await card.locator('summary').click();
  const url = page.url();
  await card.getByRole('button', { name: /عرض إيصال CliQ/ }).click();
  const image = page.getByTestId('event-receipt-full');
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
  await expect(page).toHaveURL(url);
  await expect(page.getByRole('link', { name: 'تنزيل صورة الوصل' })).toHaveAttribute('download', 'cliq-receipt.jpg');
  await page.screenshot({ path: 'generated-artifacts/event-registration-browser/mobile-receipt-dialog.jpg' });
  await page.keyboard.press('Escape');
  await expect(image).toBeHidden();
  await card.locator('summary').click();
  await expect(card.getByTestId('approve-event-pending')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
