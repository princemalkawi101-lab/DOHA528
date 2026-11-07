// Synthetic transport only: never use a live connector, key or recipient.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const requireApi = createRequire(resolve('artifacts/api-server/package.json'));
const { build } = requireApi('esbuild');
const outfile = resolve('artifacts/api-server/node_modules/.cache/event-mail-transport-test.mjs');
await build({
  entryPoints: ['artifacts/api-server/src/lib/event-mail-transport.ts'],
  outfile, bundle: true, platform: 'node', format: 'esm', packages: 'external',
  plugins: [{
    name: 'block-live-connectors',
    setup(b) {
      b.onResolve({ filter: /^@replit\/connectors-sdk$/ }, () => ({ path: 'blocked', namespace: 'fixture' }));
      b.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
        contents: 'export class ReplitConnectors { constructor(){throw new Error("Live connector forbidden in mail test");} }',
      }));
    },
  }],
});
process.env.VERCEL = '1';
process.env.RESEND_API_KEY = 'synthetic-test-key-not-valid';
process.env.RESEND_FROM_EMAIL = 'notifications@example.test';
const { deliverEventMail } = await import(pathToFileURL(outfile));
const requests = [];
globalThis.fetch = async (url, init) => {
  assert.equal(url, 'https://api.resend.com/emails');
  requests.push({ headers: init.headers, body: JSON.parse(init.body) });
  return Response.json({ id: 'fixture-email-id' });
};
const mail = {
  key: 'event-admin-booking-fixture', to: 'admin@example.test',
  subject: 'Synthetic booking', text: 'Synthetic details', html: '<p>Synthetic details</p>',
  attachments: [{ filename: 'cliq-receipt.jpg', content: Buffer.from('synthetic-image'), contentType: 'image/jpeg' }],
};
assert.equal(await deliverEventMail(mail, { confirmationEmailProvider: 'gmail' }, false), 'fixture-email-id');
assert.equal(requests[0].headers['Idempotency-Key'], mail.key);
assert.equal(requests[0].body.from, 'notifications@example.test');
assert.deepEqual(requests[0].body.to, ['admin@example.test']);
assert.equal(requests[0].body.attachments[0].filename, 'cliq-receipt.jpg');
assert.equal(Buffer.from(requests[0].body.attachments[0].content, 'base64').toString(), 'synthetic-image');
globalThis.fetch = async () => Response.json({ message: 'secret provider detail' }, { status: 403 });
await assert.rejects(deliverEventMail(mail, {}, false), e => !e.uncertain && !e.message.includes('secret'));
globalThis.fetch = async () => { throw new Error('secret network detail'); };
await assert.rejects(deliverEventMail(mail, {}, false), e => e.uncertain && !e.message.includes('secret'));
await assert.rejects(deliverEventMail(mail, {}, true), e => e.uncertain);
delete process.env.RESEND_API_KEY;
await assert.rejects(deliverEventMail(mail, { confirmationEmailProvider: 'gmail' }, false), /RESEND_API_KEY/);
console.log('PASS: direct Vercel Resend path, explicit sender, receipt attachment, idempotency key, safe provider errors and uncertain-delivery protection; no real email sent.');
