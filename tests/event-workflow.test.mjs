// Run only inside the Firestore emulator. Provider responses below are fakes;
// this suite never sends email or creates/charges a PayPal order.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Use the Firestore emulator, never a live database.');
const requireApi = createRequire(resolve('artifacts/api-server/package.json'));
const { build } = requireApi('esbuild');
const outfile = resolve('artifacts/api-server/node_modules/.cache/event-workflow-test.mjs');
globalThis.__eventTestPayments = { orders: new Map(), captures: 0, amountOverride: null, stateOverride: null, signatureValid: true, reads: 0 };
globalThis.__eventTestEmail = { sent: new Map(), attempts: 0, fail: false, ambiguous: false };
await build({
  stdin: {
    contents: `export {eventAction,eventPayPalWebhook,EVENT_ID} from './lib/event-workflow'; export {eventFirebase} from './lib/event-firebase';`,
    resolveDir: resolve('artifacts/api-server/src'), loader: 'ts',
  },
  outfile, platform: 'node', format: 'esm', bundle: true, packages: 'external',
  plugins: [{
    name: 'fake-providers',
    setup(b) {
      b.onResolve({ filter: /^\.\/paypal(?:\.js)?$/ }, (args) =>
        args.importer.endsWith('/event-workflow.ts') ? { path: 'paypal', namespace: 'fake' } : undefined);
      b.onResolve({ filter: /^@replit\/connectors-sdk$/ }, () => ({ path: 'email', namespace: 'fake' }));
      b.onLoad({ filter: /.*/, namespace: 'fake' }, ({ path }) => ({
        contents: path === 'paypal' ? `
          export async function createPayPalOrder(input) {
            const state=globalThis.__eventTestPayments;
            const id='TEST-ORDER-'+(state.orders.size+1);
            state.orders.set(id,{amount:input.cart[0].amount});
            return {id,amount:String(input.cart[0].amount),currency:'USD'};
          }
          export async function capturePayPalOrder(id) {
            const state=globalThis.__eventTestPayments;
            state.captures++;
            const o=state.orders.get(id);
            return {captureStatus:'COMPLETED',paymentStatus:state.stateOverride||'COMPLETED',orderId:id,captureId:'CAPTURE-'+id,amount:(state.amountOverride??o.amount).toFixed(2),currency:'USD'};
          }
          export async function getPayPalOrder(id) {
            globalThis.__eventTestPayments.reads++;
            const state=globalThis.__eventTestPayments, o=state.orders.get(id);
            return {captureStatus:'COMPLETED',paymentStatus:state.stateOverride||'COMPLETED',orderId:id,captureId:'CAPTURE-'+id,amount:(state.amountOverride??o.amount).toFixed(2),currency:'USD'};
          }
          export async function verifyPayPalWebhook(){return globalThis.__eventTestPayments.signatureValid;}
          export function isPayPalApiError(){return false;}
        ` : `
          export class ReplitConnectors {
            async proxy(connector,path,init) {
              const state=globalThis.__eventTestEmail;
              if(path.endsWith('/profile')) return Response.json({emailAddress:'sender@example.test'});
              if(init.method==='GET') {
                const id=decodeURIComponent(path).match(/rfc822msgid:([^&]+)/)?.[1];
                return Response.json({messages:state.sent.has(id)?[{id:state.sent.get(id)}]:[]});
              }
              state.attempts++;
              if(state.fail) return Response.json({error:'rejected'},{status:429});
              const mime=Buffer.from(JSON.parse(init.body).raw,'base64url').toString();
              const id=mime.match(/Message-ID: <([^>]+)>/)[1];
              state.sent.set(id,'MESSAGE-'+state.attempts);
              if(state.ambiguous) throw new Error('Simulated lost response after send');
              return Response.json({id:'MESSAGE-'+state.attempts});
            }
          }
        `, loader: 'js',
      }));
    },
  }],
});
const { eventAction, eventPayPalWebhook, eventFirebase, EVENT_ID } = await import(pathToFileURL(outfile).href);
const { db } = eventFirebase();
const run = randomUUID().slice(0, 8);
const user = { uid: `event-test-${run}`, email: 'attendee@example.test' };
const onlineUser = { uid: `online-test-${run}`, email: 'online@example.test' };
const other = { uid: `other-test-${run}` };
const admin = { uid: `admin-test-${run}`, admin: true };
const attendee = { name: 'Workflow Test', phone: '+962790000001', email: 'attendee@example.test' };
const receiptDataUrl = `data:image/jpeg;base64,${'A'.repeat(120)}`;
await db.doc('siteSettings/config').set({ event: {
  enabled: true, cliqAlias: 'TEST-ONLY', confirmationEmailProvider: 'gmail',
  confirmationEmailFrom: 'sender@example.test', confirmationTime: '1:00 PM–4:00 PM Jordan time',
} }, { merge: true });

await assert.rejects(eventAction(user, { action: 'register-cliq', ...attendee, email: 'bad', receiptDataUrl }));
const core = await eventAction(user, { action: 'register-cliq', ...attendee, receiptDataUrl });
assert.equal(core.registration.status, 'pending');
assert.equal(core.registration.email, attendee.email);
assert.equal(core.registration.telegramUrl, undefined);
const persisted = (await db.doc(`eventRegistrations/${core.registration.id}`).get()).data();
assert.equal(persisted.receiptDataUrl, receiptDataUrl);
const duplicate = await eventAction(user, { action: 'register-cliq', ...attendee, receiptDataUrl });
assert.equal(duplicate.registration.id, core.registration.id);
assert.equal((await eventAction(other, { action: 'mine' })).registration, null);
await assert.rejects(eventAction(other, { action: 'create-order', tier: 'vip', registrationId: core.registration.id }));
await assert.rejects(eventAction(user, { action: 'review', registrationId: core.registration.id, status: 'approved' }));
const vipOrder = await eventAction(user, { action: 'create-order', tier: 'vip', registrationId: core.registration.id, amount: 1 });
assert.equal(globalThis.__eventTestPayments.orders.get(vipOrder.id).amount, 49);
const reusedOrder = await eventAction(user, { action: 'create-order', tier: 'vip', registrationId: core.registration.id });
assert.equal(reusedOrder.id, vipOrder.id);
await assert.rejects(eventAction(other, { action: 'capture-order', orderId: vipOrder.id }));
globalThis.__eventTestPayments.amountOverride = 30;
await assert.rejects(eventAction(user, { action: 'capture-order', orderId: vipOrder.id }));
assert.equal((await eventAction(user, { action: 'mine' })).registration.membershipStatus, 'Standard');
globalThis.__eventTestPayments.amountOverride = null;
globalThis.__eventTestPayments.stateOverride = 'PENDING';
await assert.rejects(eventAction(user, { action: 'capture-order', orderId: vipOrder.id }));
globalThis.__eventTestPayments.stateOverride = null;
const vip = await eventAction(user, { action: 'capture-order', orderId: vipOrder.id });
assert.equal(vip.registration.membershipStatus, 'VIP Member');
assert.equal(vip.registration.status, 'pending', 'VIP payment must not approve an unreviewed CliQ receipt');
assert.ok(vip.registration.telegramUrl.startsWith('https://t.me/'));
const calls = globalThis.__eventTestPayments.captures;
await eventAction(user, { action: 'capture-order', orderId: vipOrder.id });
assert.equal(globalThis.__eventTestPayments.captures, calls, 'Retry must not recapture');
await assert.rejects(eventAction(user, { action: 'create-order', tier: 'vip', registrationId: core.registration.id }));
const approved = await eventAction(admin, { action: 'review', registrationId: core.registration.id, status: 'approved' });
assert.equal(approved.emailStatus, 'sent');
assert.equal((await eventAction(user, { action: 'mine' })).registration.membershipStatus, 'VIP Member');
const emailAttempts = globalThis.__eventTestEmail.attempts;
await eventAction(admin, { action: 'retry-email', registrationId: core.registration.id });
assert.equal(globalThis.__eventTestEmail.attempts, emailAttempts);

const onlineOrder = await eventAction(onlineUser, { action: 'create-order', tier: 'online', ...attendee, amount: 1 });
assert.equal(globalThis.__eventTestPayments.orders.get(onlineOrder.id).amount, 30);
const online = await eventAction(onlineUser, { action: 'capture-order', orderId: onlineOrder.id });
assert.equal(online.registration.status, 'approved');
assert.equal(online.registration.telegramUrl, undefined);
globalThis.__eventTestEmail.fail = true;
const failed = await eventAction(admin, { action: 'review', registrationId: online.registration.id, status: 'approved' });
assert.equal(failed.emailStatus, 'failed');
assert.equal((await eventAction(onlineUser, { action: 'mine' })).registration.status, 'approved');
globalThis.__eventTestEmail.fail = false;
globalThis.__eventTestEmail.ambiguous = true;
assert.equal((await eventAction(admin, { action: 'retry-email', registrationId: online.registration.id })).emailStatus, 'uncertain');
globalThis.__eventTestEmail.ambiguous = false;
const attemptsBeforeRecovery = globalThis.__eventTestEmail.attempts;
assert.equal((await eventAction(admin, { action: 'retry-email', registrationId: online.registration.id })).emailStatus, 'sent');
assert.equal(globalThis.__eventTestEmail.attempts, attemptsBeforeRecovery, 'Lost Gmail response must be read back, not sent again');

await db.doc('siteSettings/config').update({ 'event.enabled': false });
await assert.rejects(eventAction(other, { action: 'register-cliq', ...attendee, receiptDataUrl }));
await assert.rejects(eventAction(other, { action: 'create-order', tier: 'online', ...attendee }));
assert.ok((await eventAction(user, { action: 'mine' })).registration.telegramUrl);
await db.doc('siteSettings/config').update({ 'event.enabled': true });

// No browser approval callback: completed provider payments recover via webhook.
const recoveryUsers = [];
async function checkout(tier = 'online') {
  const u = { uid: `recover-${run}-${recoveryUsers.length}`, email: attendee.email };
  recoveryUsers.push(u);
  let registration;
  if (tier === 'vip') registration = (await eventAction(u, { action: 'register-cliq', ...attendee, receiptDataUrl })).registration;
  const order = await eventAction(u, { action: 'create-order', tier, ...attendee, registrationId: registration?.id });
  return { u, order, registration };
}
function webhook(order, amount = '30.00', overrides = {}) {
  return {
    id: 'WH-'+order.id, event_type: 'PAYMENT.CAPTURE.COMPLETED',
    resource: { id: 'CAPTURE-'+order.id, status: 'COMPLETED', amount: { value: amount, currency_code: 'USD' },
      supplementary_data: { related_ids: { order_id: order.id } }, ...overrides },
  };
}
const recovered = await checkout();
const delivery = webhook(recovered.order);
globalThis.__eventTestPayments.signatureValid = false;
const readsBefore = globalThis.__eventTestPayments.reads;
await assert.rejects(eventPayPalWebhook({}, delivery), /signature/);
assert.equal(globalThis.__eventTestPayments.reads, readsBefore);
assert.equal((await eventAction(recovered.u, { action: 'mine' })).registration, null);
globalThis.__eventTestPayments.signatureValid = true;
await assert.rejects(eventPayPalWebhook({}, webhook(recovered.order, '1.00')));
await assert.rejects(eventPayPalWebhook({}, webhook(recovered.order, '30.00', { id: 'WRONG-CAPTURE' })));
await assert.rejects(eventPayPalWebhook({}, webhook(recovered.order, '30.00', { amount: { value: '30.00', currency_code: 'EUR' } })));
globalThis.__eventTestPayments.stateOverride = 'PENDING';
await assert.rejects(eventPayPalWebhook({}, delivery));
globalThis.__eventTestPayments.stateOverride = null;
await db.doc('siteSettings/config').update({ 'event.enabled': false });
const capturesBeforeWebhook = globalThis.__eventTestPayments.captures;
await Promise.all(Array.from({ length: 4 }, () => eventPayPalWebhook({}, delivery)));
assert.equal(globalThis.__eventTestPayments.captures, capturesBeforeWebhook, 'Webhook never charges a customer');
const recoveredRegistration = (await eventAction(recovered.u, { action: 'mine' })).registration;
assert.equal(recoveredRegistration.status, 'approved');
assert.equal(recoveredRegistration.membershipStatus, 'Standard');
await eventAction(recovered.u, { action: 'capture-order', orderId: recovered.order.id });
assert.equal(globalThis.__eventTestPayments.captures, capturesBeforeWebhook, 'Browser retry after webhook must not capture');
await db.doc('siteSettings/config').update({ 'event.enabled': true });
const vipRecovery = await checkout('vip');
await Promise.all([
  eventPayPalWebhook({}, webhook(vipRecovery.order, '49.00')),
  eventAction(vipRecovery.u, { action: 'capture-order', orderId: vipRecovery.order.id }),
]);
const recoveredVip = (await eventAction(vipRecovery.u, { action: 'mine' })).registration;
assert.equal(recoveredVip.membershipStatus, 'VIP Member');
assert.equal(recoveredVip.status, 'pending');
assert.ok(recoveredVip.telegramUrl);
// Changed fixed amount, unknown tier, and a conflicting CliQ booking are rejected.
const tampered = await checkout();
const tamperedRef = db.doc(`eventPaymentOrders/${tampered.order.id}`);
await tamperedRef.update({ tier: 'other' });
await assert.rejects(eventPayPalWebhook({}, webhook(tampered.order)));
await tamperedRef.update({ tier: 'online', amount: 1 });
globalThis.__eventTestPayments.amountOverride = 1;
await assert.rejects(eventPayPalWebhook({}, webhook(tampered.order, '1.00')));
globalThis.__eventTestPayments.amountOverride = null;
await tamperedRef.update({ amount: 30 });
await eventAction(tampered.u, { action: 'register-cliq', ...attendee, receiptDataUrl });
await assert.rejects(eventPayPalWebhook({}, webhook(tampered.order)));
assert.equal((await eventAction(tampered.u, { action: 'mine' })).registration.status, 'pending');
assert.equal((await tamperedRef.get()).data().status, 'created', 'Conflict leaves payment available for manual recovery');
assert.equal((await eventPayPalWebhook({}, { id: 'WH-IGNORED', event_type: 'PAYMENT.CAPTURE.PENDING' })).ignored, true);
assert.equal((await eventPayPalWebhook({}, webhook({ id: 'UNKNOWN-ORDER' }))).ignored, true);
for (const collection of ['eventRegistrations', 'eventPaymentOrders', 'eventCheckoutSessions']) {
  for (const u of [user, onlineUser, ...recoveryUsers]) {
    const rows = await db.collection(collection).where('userId', '==', u.uid).get();
    for (const row of rows.docs) await row.ref.delete();
  }
}
console.log('Event workflow tests passed: bookings, fixed prices, VIP/CliQ isolation, ownership, email recovery, webhook-only recovery, invalid signatures, duplicate/concurrent delivery and browser races.');
