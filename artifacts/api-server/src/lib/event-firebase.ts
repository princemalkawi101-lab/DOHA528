import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export function eventFirebase() {
  let app = getApps().find((entry) => entry.name === "event-workflow");
  if (!app) {
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      if (process.env.NODE_ENV === "production") throw new Error("Firestore emulator is forbidden in production.");
      app = initializeApp({ projectId: process.env.GCLOUD_PROJECT || "demo-power-healing" }, "event-workflow");
      return { db: getFirestore(app), auth: getAuth(app) };
    }
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
