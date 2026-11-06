import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

export const projectId = 'demo-power-healing-browser';
export const rules = await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8');
export const password = 'Synthetic-only-123!';

export async function environment(securityRules = rules) {
  return initializeTestEnvironment({
    projectId,
    firestore: { host: '127.0.0.1', port: 8185, rules: securityRules },
  });
}

export async function identity(admin = false) {
  const email = `${admin ? 'admin' : 'member'}-${randomUUID()}@example.test`;
  const response = await fetch('http://127.0.0.1:9198/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-browser-test-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  if (!response.ok) throw new Error(`Emulator identity creation failed: ${await response.text()}`);
  const { localId: uid } = await response.json();
  if (admin) {
    const claims = await fetch(`http://127.0.0.1:9198/identitytoolkit.googleapis.com/v1/projects/${projectId}/accounts:update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
      body: JSON.stringify({ localId: uid, customAttributes: JSON.stringify({ admin: true }) }),
    });
    if (!claims.ok) throw new Error(`Emulator admin claim failed: ${await claims.text()}`);
  }
  return { email, uid };
}

const base = {
  eventId: 'success-workshop-amman-2026',
  userId: 'synthetic-owner',
  name: 'تجربة، "اختبار"',
  phone: '+962790000001',
  email: 'synthetic@example.test',
  attendance: 'in-person',
  paymentMethod: 'cliq',
  status: 'approved',
  membershipStatus: 'Standard',
  confirmationEmailStatus: 'failed',
  confirmationEmailError: 'SYNTHETIC_EMAIL_ERROR',
  receiptDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
  paypalOrderId: 'PRIVATE_BASE_ORDER',
  vipPaypalOrderId: 'PRIVATE_VIP_ORDER',
  telegramUrl: 'https://example.test/PRIVATE_CHANNEL',
};
// Explicit expectations in the spec must not use the production selector.
export const registrations = [
  { ...base, id: 'standard' },
  { ...base, id: 'legacy', membershipStatus: undefined, email: undefined, attendance: 'online', paymentMethod: 'paypal' },
  { ...base, id: 'vip-approved', membershipStatus: 'VIP Member' },
  { ...base, id: 'vip-pending', membershipStatus: 'VIP Member', status: 'pending' },
  { ...base, id: 'vip-rejected', membershipStatus: 'VIP Member', status: 'rejected' },
  { ...base, id: 'pending', status: 'pending' },
  { ...base, id: 'rejected', status: 'rejected' },
  { ...base, id: 'paypal-pending', status: 'pending', attendance: 'online', paymentMethod: 'paypal' },
  { ...base, id: 'not-verified', status: 'pending', vipPaypalOrderId: 'ORDER_ONLY_NOT_VERIFIED' },
];

export async function seed(env, entries = registrations) {
  await env.withSecurityRulesDisabled(async (context) => {
    for (const [index, { id, ...data }] of entries.entries()) {
      await setDoc(doc(context.firestore(), 'eventRegistrations', id), {
        ...Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined)),
        createdAt: Timestamp.fromMillis(1_800_000_000_000 + index),
      });
    }
  });
}

export async function patch(env, id, values) {
  await env.withSecurityRulesDisabled((context) =>
    setDoc(doc(context.firestore(), 'eventRegistrations', id), values, { merge: true }));
}
