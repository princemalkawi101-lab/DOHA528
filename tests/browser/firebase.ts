// Only vite.browser-tests.config.ts resolves this module. No live configuration.
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { connectFirestoreEmulator, disableNetwork, enableNetwork, getFirestore } from 'firebase/firestore';

export const firebaseApp = initializeApp({
  apiKey: 'fake-browser-test-key',
  authDomain: 'demo-power-healing-browser.firebaseapp.com',
  projectId: 'demo-power-healing-browser',
  appId: 'browser-tests-only',
});
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
connectAuthEmulator(auth, 'http://127.0.0.1:9198', { disableWarnings: true });
connectFirestoreEmulator(db, '127.0.0.1', 8185);

// Exercise reconnection after permissions are revoked without replacing onSnapshot.
export async function reconnect() {
  await disableNetwork(db);
  await enableNetwork(db);
}
