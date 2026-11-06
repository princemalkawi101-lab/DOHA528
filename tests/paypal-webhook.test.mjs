// Offline contract test: fetch is replaced before importing provider code.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const requireApi = createRequire(resolve('artifacts/api-server/package.json'));
const { build } = requireApi('esbuild');
const outfile = resolve('artifacts/api-server/node_modules/.cache/paypal-webhook-test.mjs');
await build({
  entryPoints: ['artifacts/api-server/src/lib/paypal.ts'], outfile,
  bundle: true, platform: 'node', format: 'esm', packages: 'external',
});
// Synthetic credentials only; no real secrets or network requests are used.
process.env.PAYPAL_CLIENT_ID = 'offline-test-client';
process.env.PAYPAL_SECRET = 'offline-test-secret';
process.env.PAYPAL_ENVIRONMENT = 'sandbox';
delete process.env.PAYPAL_WEBHOOK_ID;
let calls = [];
let verificationStatus = 'SUCCESS';
let httpStatus = 200;
globalThis.fetch = async (url, init) => {
  assert.ok(url.startsWith('https://api-m.sandbox.paypal.com/'));
  calls.push({ url, init });
  if (url.endsWith('/v1/oauth2/token')) return Response.json({ access_token: 'offline-token' });
  assert.ok(url.endsWith('/v1/notifications/verify-webhook-signature'));
  return Response.json({ verification_status: verificationStatus }, { status: httpStatus });
};
const { verifyPayPalWebhook } = await import(pathToFileURL(outfile).href);
const headers = {
  'paypal-auth-algo': 'SHA256withRSA',
  'paypal-cert-url': 'https://api.paypal.com/v1/notifications/certs/test',
  'paypal-transmission-id': 'test-transmission',
  'paypal-transmission-sig': 'test-signature',
  'paypal-transmission-time': '2026-11-06T12:00:00Z',
};
const event = { id: 'WH-OFFLINE', event_type: 'PAYMENT.CAPTURE.COMPLETED', resource: { id: 'CAPTURE-OFFLINE' } };
await assert.rejects(verifyPayPalWebhook(headers, event), /PAYPAL_WEBHOOK_ID/);
assert.equal(calls.length, 0);
process.env.PAYPAL_WEBHOOK_ID = 'offline-webhook-id';
assert.equal(await verifyPayPalWebhook({}, event), false);
assert.equal(await verifyPayPalWebhook({ ...headers, 'paypal-transmission-sig': ['a', 'b'] }, event), false);
assert.equal(calls.length, 0);
assert.equal(await verifyPayPalWebhook(headers, event), true);
assert.deepEqual(JSON.parse(calls.at(-1).init.body), {
  webhook_id: 'offline-webhook-id', webhook_event: event, auth_algo: headers['paypal-auth-algo'],
  cert_url: headers['paypal-cert-url'], transmission_id: headers['paypal-transmission-id'],
  transmission_sig: headers['paypal-transmission-sig'], transmission_time: headers['paypal-transmission-time'],
});
verificationStatus = 'FAILURE';
assert.equal(await verifyPayPalWebhook(headers, event), false);
verificationStatus = undefined;
assert.equal(await verifyPayPalWebhook(headers, event), false);
httpStatus = 503;
await assert.rejects(verifyPayPalWebhook(headers, event), /PayPal/);
globalThis.fetch = async () => { throw new Error('offline network failure'); };
await assert.rejects(verifyPayPalWebhook(headers, event));
console.log('PayPal webhook verification tests passed without network access or live charges.');
