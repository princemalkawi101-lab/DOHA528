import type { DocumentData } from "firebase-admin/firestore";

// Server-only invitations: never bundle these with public landing-page settings.
export const VIP_TELEGRAM_URL = "https://t.me/+dl3H-ZKTnqg2N2Y0";
export const ONLINE_TELEGRAM_URL = "https://t.me/+_5Dhdrs3Iq8zNzRk";
export const hasConfirmedOnlineAccess = (data: DocumentData) =>
  data.attendance === "online" && data.status === "approved"
  && data.paymentMethod === "paypal" && typeof data.paypalCaptureId === "string" && !!data.paypalCaptureId;
