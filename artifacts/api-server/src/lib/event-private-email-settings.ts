import { z } from "zod";
import { eventFirebase } from "./event-firebase.js";

// Outside siteSettings: public site settings are deliberately visitor-readable.
export const PRIVATE_EVENT_MAIL_PATH = "eventPrivateSettings/success-workshop-amman-2026";
export const DEFAULT_WHATSAPP = {
  enabled: false, url: "", invitation: "انضم إلى قناة واتساب الخاصة بالورشة لمتابعة التفاصيل والتحديثات.",
  buttonLabel: "الانضمام إلى قناة الورشة على واتساب", revision: 0,
};
// Phone share/copy can insert invisible direction markers around RTL text.
const cleanInvite = (value: string) => value.replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "").trim();

export function validWhatsAppInvite(value: string): boolean {
  try {
    const url = new URL(cleanInvite(value));
    // WhatsApp commonly appends ?mode=... to shared invitations. Those
    // parameters do not change the validated WhatsApp host/invitation path.
    return url.protocol === "https:" && !url.username && !url.password && !url.port
      && ((url.hostname === "whatsapp.com" || url.hostname === "www.whatsapp.com")
        ? /^\/channel\/[A-Za-z0-9_-]+\/?$/.test(url.pathname)
        : url.hostname === "chat.whatsapp.com" && /^\/[A-Za-z0-9_-]+\/?$/.test(url.pathname));
  } catch { return false; }
}

export const whatsAppSettingsSchema = z.object({
  enabled: z.boolean(),
  url: z.string().transform(cleanInvite).pipe(z.string().max(2048)),
  invitation: z.string().trim().max(1200),
  buttonLabel: z.string().trim().min(1).max(80),
  revision: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
}).strict().superRefine((value, context) => {
  if ((value.enabled || value.url) && !validWhatsAppInvite(value.url)) {
    context.addIssue({ code: "custom", path: ["url"], message: "أدخل رابط قناة أو دعوة مجموعة واتساب صحيحًا يبدأ بـ https://." });
  }
});

export async function readPrivateWhatsAppSettings() {
  const snapshot = await eventFirebase().db.doc(PRIVATE_EVENT_MAIL_PATH).get();
  return whatsAppSettingsSchema.parse({ ...DEFAULT_WHATSAPP, ...snapshot.data()?.whatsapp });
}
