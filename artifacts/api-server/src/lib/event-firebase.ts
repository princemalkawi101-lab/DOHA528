import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export function eventFirebase() {
  let app = getApps().find((entry) => entry.name === "event-workflow");
  if (!app) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) throw new Error("Firebase server credentials are not configured.");
    let credentials;
    try { credentials = JSON.parse(raw); } catch { throw new Error("Firebase server credentials must be valid JSON."); }
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    if (projectId && credentials.project_id !== projectId) {
      throw new Error("Firebase server credentials belong to a different project.");
    }
    app = initializeApp({ credential: cert(credentials) }, "event-workflow");
  }
  return { db: getFirestore(app), auth: getAuth(app) };
}
