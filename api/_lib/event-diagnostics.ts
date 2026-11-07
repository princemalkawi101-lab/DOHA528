import { randomUUID } from "node:crypto";

// Never log arbitrary provider messages, request bodies, authorization or env
// values: SDK errors can contain attendee data or credentials.
export function eventFailure(error: unknown, endpoint: "event" | "event-webhook") {
  const record = error && typeof error === "object" ? error as { code?: unknown; message?: unknown; name?: unknown } : {};
  const message = typeof record.message === "string" ? record.message : "";
  const configCodes: Record<string, string> = {
    "Firebase server credentials are not configured.": "FIREBASE_CREDENTIALS_MISSING",
    "Firebase server credentials must be valid JSON.": "FIREBASE_CREDENTIALS_JSON",
    "Firebase server credentials must be a service account object.": "FIREBASE_CREDENTIALS_FORMAT",
    "Firebase server credentials belong to a different project.": "FIREBASE_PROJECT_MISMATCH",
    "Firestore emulator is forbidden in production.": "FIREBASE_EMULATOR_FORBIDDEN",
  };
  const providerCodes: Record<string, string> = {
    "app/invalid-credential": "FIREBASE_CREDENTIALS_INVALID",
    "app/invalid-app-options": "FIREBASE_OPTIONS_INVALID",
    "7": "FIRESTORE_PERMISSION_DENIED",
    "16": "FIRESTORE_UNAUTHENTICATED",
    "5": "FIRESTORE_NOT_FOUND",
    "4": "FIRESTORE_DEADLINE_EXCEEDED",
    "14": "FIRESTORE_UNAVAILABLE",
    "ERR_MODULE_NOT_FOUND": "SERVER_MODULE_MISSING",
    "MODULE_NOT_FOUND": "SERVER_MODULE_MISSING",
    "ERR_REQUIRE_ESM": "SERVER_MODULE_FORMAT",
    "FIREBASE_CREDENTIALS_JSON_CONTROL_CHARACTER": "FIREBASE_CREDENTIALS_JSON_CONTROL_CHARACTER",
    "FIREBASE_CREDENTIALS_JSON_ESCAPE": "FIREBASE_CREDENTIALS_JSON_ESCAPE",
    "FIREBASE_CREDENTIALS_JSON_INCOMPLETE": "FIREBASE_CREDENTIALS_JSON_INCOMPLETE",
    "FIREBASE_CREDENTIALS_JSON_TRAILING_DATA": "FIREBASE_CREDENTIALS_JSON_TRAILING_DATA",
    "FIREBASE_CREDENTIALS_JSON_SYNTAX": "FIREBASE_CREDENTIALS_JSON_SYNTAX",
  };
  const providerCode = typeof record.code === "string" || typeof record.code === "number" ? String(record.code) : "";
  const code = Object.hasOwn(providerCodes, providerCode) ? providerCodes[providerCode]
    : Object.hasOwn(configCodes, message) ? configCodes[message] : "EVENT_SERVER_ERROR";
  const reference = randomUUID();
  console.error(JSON.stringify({ source: "event-workflow", endpoint, code, reference }));
  return {
    code,
    reference,
    error: `تعذّر الاتصال بخدمة الحجز على الخادم. رمز التشخيص: ${code} (${reference}). لا تدفع مرة أخرى إذا تم خصم المبلغ.`,
  };
}
