// Run only inside the Firestore emulator. Provider responses below are fakes;
// this suite never sends email or creates/charges a PayPal order.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { randomUUID, randomBytes } from 'node:crypto';

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Use the Firestore emulator, never a live database.');
const requireApi = createRequire(resolve('artifacts/api-server/package.json'));
const { build } = requireApi('esbuild');
const outfile = resolve('artifacts/api-server/node_modules/.cache/event-workflow-test.mjs');
globalThis.__eventTestPayments = { orders: new Map(), captures: 0, amountOverride: null, stateOverride: null, signatureValid: true, reads: 0 };
globalThis.__eventTestEmail = { sent: new Map(), attempts: 0, fail: false, ambiguous: false, messages: [] };
await build({
  stdin: {
    contents: `export {eventAction,eventPayPalWebhook,EVENT_ID} from './lib/event-workflow'; export {eventFirebase} from './lib/event-firebase'; export {eventIdentity} from './lib/event-identity';`,
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
              state.messages.push(mime);
              const id=mime.match(/Message-ID:\\s*<([^>]+)>/i)[1];
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
const { eventAction, eventPayPalWebhook, eventFirebase, eventIdentity, EVENT_ID } = await import(pathToFileURL(outfile).href);
const { db } = eventFirebase();
const run = randomUUID().slice(0, 8);
const capability = `Guest ${randomBytes(32).toString('hex')}`;
const user = await eventIdentity(capability);
const onlineUser = await eventIdentity(`Guest ${randomBytes(32).toString('hex')}`);
const other = await eventIdentity(`Guest ${randomBytes(32).toString('hex')}`);
assert.deepEqual(await eventIdentity(capability), user, 'Guest resumes using the same capability');
assert.notEqual(user.uid, other.uid);
assert.equal(user.admin, undefined);
assert.equal(user.email, undefined);
assert.ok(!user.uid.includes(capability.slice(6)), 'Store only a digest, not the secret');
await assert.rejects(eventIdentity(''), /booking session/);
await assert.rejects(eventIdentity('Guest predictable'), /booking session/);
const admin = { uid: `admin-test-${run}`, admin: true };
const attendee = { name: 'Workflow Test', phone: '+962790000001', email: 'attendee@example.test' };
const receiptDataUrl = `data:image/jpeg;base64,${'A'.repeat(120)}`;
await db.doc('siteSettings/config').set({ event: {
  enabled: true, cliqAlias: 'TEST-ONLY', confirmationEmailProvider: 'gmail',
  confirmationEmailFrom: 'sender@example.test', confirmationTime: '1:00 PM–4:00 PM Jordan time',
} }, { merge: true });
const privatePath = 'eventPrivateSettings/success-workshop-amman-2026';
await db.doc(privatePath).delete();
const defaults = await eventAction(admin, { action: 'get-private-email-settings' });
assert.equal(defaults.whatsapp.enabled, false);
const whatsapp = {
  ...defaults.whatsapp, enabled: true,
  url: 'https://whatsapp.com/channel/SYNTHETIC_ONLY',
  invitation: 'Join the workshop <script>test</script>',
  buttonLabel: 'Join <workshop>',
};
await assert.rejects(eventAction(user, { action: 'get-private-email-settings' }), e => e.status === 403);
await assert.rejects(eventAction(user, { action: 'save-private-email-settings', whatsapp }), e => e.status === 403);
await assert.rejects(eventAction({ uid: 'non-admin' }, { action: 'get-private-email-settings' }), e => e.status === 403);
for (const url of ['javascript:alert(1)', 'https://whatsapp.com.evil.test/channel/x', 'https://evil.test', 'https://chat.whatsapp.com@evil.test/x']) {
  await assert.rejects(eventAction(admin, { action: 'save-private-email-settings', whatsapp: { ...whatsapp, url } }));
}
const privateSaved = await eventAction(admin, { action: 'save-private-email-settings', whatsapp });
assert.equal(privateSaved.whatsapp.revision, 1);
assert.equal((await eventAction(admin, { action: 'get-private-email-settings' })).whatsapp.url, whatsapp.url);
await assert.rejects(eventAction(admin, { action: 'save-private-email-settings', whatsapp }), e => e.status === 409);
assert.ok(!JSON.stringify((await db.doc('siteSettings/config').get()).data()).includes(whatsapp.url));
function readableMime(message) {
  return message + '\n' + [...message.matchAll(/Content-Transfer-Encoding: base64\r?\n\r?\n([A-Za-z0-9+/=\r\n]+)/gi)]
    .map(match => Buffer.from(match[1].replace(/\s/g, ''), 'base64').toString()).join('\n')
    + '\n' + message.replace(/=\r?\n/g, '').replace(/=([A-F0-9]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

await assert.rejects(eventAction(user, { action: 'register-cliq', ...attendee, email: 'bad', receiptDataUrl }));
const core = await eventAction(user, { action: 'register-cliq', ...attendee, receiptDataUrl });
assert.equal(core.registration.status, 'pending');
assert.equal(core.registration.email, attendee.email);
const pendingData = (await db.collection('eventRegistrations').doc(core.registration.id).get()).data();
assert.equal(pendingData.adminNotificationEmailStatus, 'sent', 'Admin receives a new pending CliQ booking');
assert.equal(pendingData.confirmationEmailStatus, 'not_sent', 'Pending receipt is not an approved ticket');
assert.ok(!globalThis.__eventTestEmail.messages.some(m => readableMime(m).includes(whatsapp.url)), 'No WhatsApp invite in pending/admin notifications');
assert.ok(!JSON.stringify(await eventAction(user, { action: 'mine' })).includes(whatsapp.url), 'Guest status never includes private WhatsApp');
const receiptMail = globalThis.__eventTestEmail.messages.find(m => /To: Dohamlk74@gmail.com/i.test(m) && /cliq-receipt.jpg/.test(m));
assert.ok(receiptMail, 'CliQ admin mail has a real receipt attachment');
assert.match(receiptMail, /Content-Type: image\/jpeg/i);
await assert.rejects(eventAction(user, { action: 'retry-admin-email', registrationId: core.registration.id }), e => e.status === 403);
const notificationsBeforeRetry = globalThis.__eventTestEmail.attempts;
await eventAction(admin, { action: 'retry-admin-email', registrationId: core.registration.id });
assert.equal(globalThis.__eventTestEmail.attempts, notificationsBeforeRetry, 'Admin mail retry is idempotent');
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
const arrival = (u, id, arrived = true, expectedRevision = 0) =>
  eventAction(u, { action: 'arrival', registrationId: id, arrived, expectedRevision });
const failsWithStatus = (promise, status) => assert.rejects(promise, (error) => error.status === status);
await failsWithStatus(arrival(user, core.registration.id), 403);
await failsWithStatus(arrival(other, core.registration.id, false), 403);
await failsWithStatus(arrival(admin, 'missing-registration'), 404);
await failsWithStatus(arrival(admin, core.registration.id), 409); // Pending VIP is not an entry ticket.
await assert.rejects(eventAction(admin, { action: 'arrival', registrationId: core.registration.id, arrived: 'true', expectedRevision: 0 }));
await assert.rejects(eventAction(admin, { action: 'arrival', registrationId: core.registration.id, arrived: true }));
const calls = globalThis.__eventTestPayments.captures;
await eventAction(user, { action: 'capture-order', orderId: vipOrder.id });
assert.equal(globalThis.__eventTestPayments.captures, calls, 'Retry must not recapture');
await assert.rejects(eventAction(user, { action: 'create-order', tier: 'vip', registrationId: core.registration.id }));
const approved = await eventAction(admin, { action: 'review', registrationId: core.registration.id, status: 'approved' });
assert.equal(approved.emailStatus, 'sent');
const confirmedMail = globalThis.__eventTestEmail.messages.map(readableMime).find(m => m.includes(`href="${whatsapp.url}"`));
assert.ok(confirmedMail, 'Approved CliQ attendee receives clickable WhatsApp button');
assert.ok(confirmedMail.includes('Join &lt;workshop&gt;'));
assert.ok(!confirmedMail.includes('<script>test</script></p>'), 'Invitation HTML is escaped');
assert.equal((await eventAction(user, { action: 'mine' })).registration.membershipStatus, 'VIP Member');
const emailAttempts = globalThis.__eventTestEmail.attempts;
await eventAction(admin, { action: 'retry-email', registrationId: core.registration.id });
assert.equal(globalThis.__eventTestEmail.attempts, emailAttempts);
const disabledWhatsApp = await eventAction(admin, { action: 'save-private-email-settings', whatsapp: { ...privateSaved.whatsapp, enabled: false } });
await eventAction(admin, { action: 'retry-email', registrationId: core.registration.id });
assert.equal(globalThis.__eventTestEmail.attempts, emailAttempts, 'Editing settings never resends a previously sent confirmation');
await eventAction(admin, { action: 'save-private-email-settings', whatsapp: { ...disabledWhatsApp.whatsapp, enabled: true } });

// Atomic check-in retains the first arrival when two desks check in together.
const concurrentArrivals = await Promise.all([
  arrival(admin, core.registration.id),
  arrival({ uid: `second-admin-${run}`, admin: true }, core.registration.id),
]);
assert.deepEqual(concurrentArrivals.map((result) => result.outcome).sort(), ['already-arrived', 'arrived']);
const arrivalRef = db.doc(`eventRegistrations/${core.registration.id}`);
const firstArrival = (await arrivalRef.get()).data();
assert.equal(firstArrival.arrivalRevision, 1);
assert.equal(firstArrival.duplicateCheckIns, 1);
assert.equal(firstArrival.status, 'approved');
assert.equal(firstArrival.membershipStatus, 'VIP Member');
const duplicateArrival = await arrival(admin, core.registration.id, true, 1);
assert.equal(duplicateArrival.outcome, 'already-arrived');
assert.equal(duplicateArrival.arrivedAt, firstArrival.arrivedAt.toDate().toISOString());
const afterDuplicate = (await arrivalRef.get()).data();
assert.equal(afterDuplicate.arrivedBy, firstArrival.arrivedBy);
assert.equal(afterDuplicate.duplicateCheckIns, 2);
await failsWithStatus(eventAction(admin, { action: 'review', registrationId: core.registration.id, status: 'rejected' }), 409);
await failsWithStatus(arrival(admin, core.registration.id, false, 0), 409);
assert.equal((await arrival(admin, core.registration.id, false, 1)).outcome, 'undone');
assert.equal((await arrivalRef.get()).data().arrivedAt, null);
assert.equal((await arrivalRef.get()).data().arrivedBy, null);
assert.equal((await arrival(admin, core.registration.id, true, 2)).outcome, 'arrived');
await failsWithStatus(arrival(admin, core.registration.id, false, 1), 409);
assert.equal((await arrivalRef.get()).data().arrivalRevision, 3, 'Stale undo cannot clear a newer arrival');
await arrival(admin, core.registration.id, false, 3);
await eventAction(admin, { action: 'review', registrationId: core.registration.id, status: 'rejected' });
await failsWithStatus(arrival(admin, core.registration.id, true, 4), 409);
await eventAction(admin, { action: 'review', registrationId: core.registration.id, status: 'approved' });
// Approval and check-in/rejection races cannot leave a rejected attendee checked in.
await Promise.allSettled([
  arrival(admin, core.registration.id, true, 4),
  eventAction(admin, { action: 'review', registrationId: core.registration.id, status: 'rejected' }),
]);
const raced = (await arrivalRef.get()).data();
assert.ok(!(raced.status === 'rejected' && raced.arrivedAt));
// Legacy records need no arrival backfill; missing revision defaults to zero.
await arrivalRef.update({ arrivedAt: null, arrivalRevision: 0, status: 'approved', membershipStatus: 'Standard' });
assert.equal((await arrival(admin, core.registration.id)).outcome, 'arrived');
await arrival(admin, core.registration.id, false, 1);
await arrivalRef.update({ membershipStatus: 'VIP Member' });
await arrivalRef.update({ eventId: 'different-event' });
await failsWithStatus(arrival(admin, core.registration.id, true, 2), 404);
await arrivalRef.update({ eventId: EVENT_ID });

const onlineOrder = await eventAction(onlineUser, { action: 'create-order', tier: 'online', ...attendee, amount: 1 });
assert.equal(globalThis.__eventTestPayments.orders.get(onlineOrder.id).amount, 30);
globalThis.__eventTestEmail.fail = true;
const online = await eventAction(onlineUser, { action: 'capture-order', orderId: onlineOrder.id });
assert.equal(online.registration.status, 'approved');
assert.equal(online.registration.telegramUrl, undefined);
await failsWithStatus(arrival(admin, online.registration.id), 409);
assert.equal((await db.collection('eventRegistrations').doc(online.registration.id).get()).data().adminNotificationEmailStatus, 'failed', 'Email failure does not roll back successful payment');
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
// Verified online payments get the same private invitation without admin approval.
globalThis.__eventTestEmail.fail = false;
globalThis.__eventTestEmail.ambiguous = false;
const onlineInvite = await checkout();
const beforeOnlineInvite = globalThis.__eventTestEmail.messages.length;
await eventAction(onlineInvite.u, { action: 'capture-order', orderId: onlineInvite.order.id });
const onlineMails = globalThis.__eventTestEmail.messages.slice(beforeOnlineInvite).map(readableMime);
assert.equal(onlineMails.filter(m => m.includes(`href="${whatsapp.url}"`)).length, 1, 'Only confirmed online attendee mail gets the private button, not organizer mail');
const currentPrivate = await eventAction(admin, { action: 'get-private-email-settings' });
await eventAction(admin, { action: 'save-private-email-settings', whatsapp: { ...currentPrivate.whatsapp, enabled: false } });
const withoutInvite = await checkout();
const beforeDisabled = globalThis.__eventTestEmail.messages.length;
await eventAction(withoutInvite.u, { action: 'capture-order', orderId: withoutInvite.order.id });
assert.ok(!globalThis.__eventTestEmail.messages.slice(beforeDisabled).some(m => readableMime(m).includes(whatsapp.url)), 'Disabled invitation is omitted');
await db.doc(privatePath).delete();
for (const collection of ['eventRegistrations', 'eventPaymentOrders', 'eventCheckoutSessions']) {
  for (const u of [user, onlineUser, ...recoveryUsers]) {
    const rows = await db.collection(collection).where('userId', '==', u.uid).get();
    for (const row of rows.docs) await row.ref.delete();
  }
}
console.log('Event workflow tests passed: bookings, fixed prices, VIP/CliQ isolation, ownership, email recovery, webhook-only recovery, invalid signatures, duplicate/concurrent delivery and browser races.');
