// Pure export tests: no Firebase connection, real attendees, email, or payments.
// Run with: node --test tests/event-registration-export.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const requireApi = createRequire(resolve('artifacts/api-server/package.json'));
const { build } = requireApi('esbuild');
const { outputFiles } = await build({
  entryPoints: ['artifacts/power-healing/src/lib/eventRegistrationExport.ts'],
  bundle: true, write: false, platform: 'node', format: 'esm',
});
const { selectEventExportEntries: select, buildEventRegistrationCsv: csv, downloadEventRegistrationCsv: download } =
  await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);

const base = {
  id: 'standard', name: 'ضحى، أحمد', phone: '+962790000001', email: 'test@example.test',
  attendance: 'in-person', paymentMethod: 'cliq', status: 'approved', membershipStatus: 'Standard',
  receiptDataUrl: 'PRIVATE_RECEIPT', telegramUrl: 'PRIVATE_CHANNEL', paypalOrderId: 'PRIVATE_ORDER',
  vipPaypalOrderId: 'PRIVATE_VIP_ORDER', confirmationEmailError: 'PRIVATE_ERROR',
  userId: 'PRIVATE_USER', paymentCredentials: 'PRIVATE_CREDENTIALS',
};
const entries = [
  base,
  { ...base, id: 'legacy', membershipStatus: undefined, attendance: 'online', paymentMethod: 'paypal' },
  { ...base, id: 'vip-approved', membershipStatus: 'VIP Member' },
  { ...base, id: 'vip-pending', membershipStatus: 'VIP Member', status: 'pending' },
  { ...base, id: 'vip-rejected', membershipStatus: 'VIP Member', status: 'rejected' },
  { ...base, id: 'pending', status: 'pending' },
  { ...base, id: 'rejected', status: 'rejected' },
  { ...base, id: 'paypal-pending', status: 'pending', paymentMethod: 'paypal' },
  { ...base, id: 'not-verified', status: 'pending', vipPaypalOrderId: 'ORDER_ONLY' },
];

test('separate lists preserve base approval and server-verified membership', () => {
  assert.deepEqual(select(entries, 'approved-standard').map((e) => e.id), ['standard', 'legacy']);
  assert.deepEqual(select(entries, 'verified-vip').map((e) => e.id), ['vip-approved', 'vip-pending', 'vip-rejected']);
  assert.deepEqual(select(entries, 'pending-cliq').map((e) => e.id), ['vip-pending', 'pending', 'not-verified']);
  const vipCsv = csv(entries, 'verified-vip');
  assert.match(vipCsv, /"pending","VIP Member"/);
  assert.match(vipCsv, /"rejected","VIP Member"/);
  assert.throws(() => select(entries, 'all'), /Unknown/);
});

test('allowlist excludes receipts, private links, credentials, and provider metadata', () => {
  for (const selection of ['approved-standard', 'verified-vip', 'pending-cliq']) {
    const text = csv(entries, selection);
    assert.ok(!text.includes('PRIVATE_'));
    assert.ok(!text.includes('ORDER_ONLY'));
    assert.ok(text.startsWith('\uFEFF"Registration reference","Name","Phone","Email","Attendance","Base ticket status","Membership status"\r\n'));
    assert.ok(text.endsWith('\r\n'));
    assert.ok(text.includes('ضحى، أحمد'));
  }
  assert.match(csv([entries[1]], 'approved-standard'), /"approved","Standard"/);
  assert.equal(csv([], 'verified-vip').split('\r\n').length, 2);
});

test('CSV escapes quotes, delimiters, newlines, and missing email', () => {
  const text = csv([{ ...base, name: 'A, "B"\r\nC', email: undefined }], 'approved-standard');
  assert.ok(text.includes('"A, ""B""\r\nC"'));
  assert.ok(text.includes(`"'${base.phone}","","in-person"`));
});

test('spreadsheet formulas are neutralized in every exported field', () => {
  for (const value of ['=1+1', '+SUM(1)', '-1+2', '@SUM(1)', '  =CMD()', '\t=1', '\r=1', '\n@SUM(1)', '\u00a0=1', '\u0000=1', '\tplain']) {
    const text = csv([{ ...base, id: value, name: value, phone: value, email: value }], 'approved-standard');
    assert.equal(text.split(`"'${value}"`).length - 1, 4, JSON.stringify(value));
  }
});

test('download creates a dated UTF-8 CSV and releases temporary browser resources', async () => {
  const originals = {
    document: globalThis.document, create: URL.createObjectURL,
    revoke: URL.revokeObjectURL, timeout: globalThis.setTimeout,
  };
  let blob;
  let clicked = false;
  let removed = false;
  let release;
  let revoked;
  const link = { click: () => { clicked = true; }, remove: () => { removed = true; } };
  try {
    globalThis.document = {
      createElement: (tag) => { assert.equal(tag, 'a'); return link; },
      body: { appendChild: (node) => assert.equal(node, link) },
    };
    URL.createObjectURL = (value) => { blob = value; return 'blob:test'; };
    URL.revokeObjectURL = (url) => { revoked = url; };
    globalThis.setTimeout = (callback) => { release = callback; };
    download(entries, 'verified-vip');
    assert.ok(clicked && removed);
    assert.equal(link.href, 'blob:test');
    assert.match(link.download, /^event-verified-vip-\d{4}-\d{2}-\d{2}\.csv$/);
    assert.equal(blob.type, 'text/csv;charset=utf-8');
    assert.deepEqual([...new Uint8Array(await blob.arrayBuffer()).slice(0, 3)], [239, 187, 191]);
    release();
    assert.equal(revoked, 'blob:test');
    assert.equal(await blob.text(), csv(entries, 'verified-vip').slice(1));
  } finally {
    globalThis.document = originals.document;
    URL.createObjectURL = originals.create;
    URL.revokeObjectURL = originals.revoke;
    globalThis.setTimeout = originals.timeout;
  }
});
