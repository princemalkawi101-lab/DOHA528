import { createHash } from "node:crypto";
import nodemailer from "nodemailer";
import { ReplitConnectors } from "@replit/connectors-sdk";

export const validEmailAddress = (value: string) => /^[^\s<>@\r\n]+@[^\s<>@\r\n]+\.[^\s<>@\r\n]+$/.test(value);
export type EventAttachment = { filename: string; content: Buffer; contentType: string };
export type EventMail = {
  key: string; to: string; subject: string; text: string; html: string;
  attachments?: EventAttachment[];
};
export type MailSettings = { confirmationEmailProvider?: string; confirmationEmailFrom?: string };
export class EventMailError extends Error {
  constructor(message: string, public uncertain = false) { super(message); }
}
type EmailResponse = { ok: boolean; status?: number; json(): Promise<unknown> };

function resendRejection(status: number | undefined, name: unknown, message: unknown): EventMailError {
  // Classify provider diagnostics without persisting raw payloads, addresses,
  // credentials, or SDK errors in Firestore or the browser.
  const code = typeof name === "string" ? name : "";
  const detail = typeof message === "string" ? message.toLowerCase() : "";
  if (status === 409 || code === "invalid_idempotent_request") return new EventMailError("تعارض مع رسالة سابقة لدى Resend. لا تكرر الإرسال قبل التحقق من الرسالة السابقة.", true);
  if (status === 401) return new EventMailError("مفتاح Resend غير صالح أو ملغى. حدّث RESEND_API_KEY في بيئة التشغيل ثم أعد النشر.");
  if (code === "daily_quota_exceeded" || (status === 429 && detail.includes("daily"))) return new EventMailError("وصل حساب Resend إلى حد الإرسال اليومي. أعد المحاولة بعد تجدد الحد.");
  if (code === "monthly_quota_exceeded" || (status === 429 && detail.includes("monthly"))) return new EventMailError("وصل حساب Resend إلى حد الإرسال الشهري. راجع حدود الحساب.");
  if (status === 429) return new EventMailError("Resend يحدّ الإرسال مؤقتًا. انتظر قليلًا ثم أعد المحاولة.");
  if (status === 403 && (detail.includes("domain") || detail.includes("testing"))) return new EventMailError("Resend لا يسمح بنطاق المرسل لهذا المفتاح. تأكد أن RESEND_FROM_EMAIL من الدومين الموثّق وأن المفتاح يملك صلاحية الإرسال منه.");
  if (status === 403) return new EventMailError("مفتاح Resend لا يملك صلاحية الإرسال المطلوبة. تحقق من صلاحياته في حساب Resend.");
  if (status && status >= 500) return new EventMailError("تعطّل مؤقت لدى Resend؛ تحقق من سجل الرسائل قبل إعادة الإرسال.", true);
  return new EventMailError(`رفض Resend بيانات الرسالة${status ? ` (${status})` : ""}. راجع عنوان المرسل والمستلم والمرفقات.`);
}

export async function deliverEventMail(mail: EventMail, settings: MailSettings, uncertain: boolean): Promise<string> {
  if (!validEmailAddress(mail.to)) throw new EventMailError("عنوان البريد الإلكتروني غير صالح.");
  // A direct Resend key is an explicit deployment transport configuration.
  // It works outside Replit even when older Firestore settings still say Gmail.
  const provider = process.env.RESEND_API_KEY ? "resend" : settings.confirmationEmailProvider || "gmail";
  const messageId = `event-${createHash("sha256").update(mail.key).digest("hex").slice(0, 40)}@power-healing.local`;
  if (provider === "gmail") {
    if (process.env.VERCEL) throw new EventMailError("اتصال Gmail الخاص بـ Replit غير متاح على Vercel. اضبط RESEND_API_KEY وRESEND_FROM_EMAIL لمرسل موثّق ثم أعد النشر.");
    const connectors = new ReplitConnectors();
    const profile = await connectors.proxy("google-mail", "/gmail/v1/users/me/profile", { method: "GET" }) as unknown as EmailResponse;
    const account = await profile.json() as { emailAddress?: string };
    if (!profile.ok || !account.emailAddress) throw new EventMailError("حساب Gmail المتصل غير متاح.");
    const from = (settings.confirmationEmailFrom || account.emailAddress).trim();
    if (from.toLowerCase() !== account.emailAddress.toLowerCase()) throw new EventMailError("بريد المرسل يجب أن يطابق حساب Gmail المتصل.");
    const sent = await connectors.proxy("google-mail", `/gmail/v1/users/me/messages?q=${encodeURIComponent(`in:sent rfc822msgid:${messageId}`)}&maxResults=1`, { method: "GET" }) as unknown as EmailResponse;
    const found = await sent.json() as { messages?: { id: string }[] };
    if (!sent.ok) throw new EventMailError("تعذّر فحص رسائل Gmail السابقة؛ لم نرسل نسخة مكررة.");
    if (found.messages?.[0]) return found.messages[0].id;
    if (uncertain) throw new EventMailError("حالة رسالة سابقة غير محسومة. تحقق من بريد Gmail المرسل قبل الإعادة.", true);
    // Build multipart MIME locally so CliQ receipts are real attachments.
    const builder = nodemailer.createTransport({ streamTransport: true, buffer: true, newline: "windows" });
    const built = await builder.sendMail({ ...mail, from, messageId: `<${messageId}>` });
    if (!Buffer.isBuffer(built.message)) throw new EventMailError("تعذّر تجهيز رسالة البريد.");
    try {
      const response = await connectors.proxy("google-mail", "/gmail/v1/users/me/messages/send", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: built.message.toString("base64url") }),
      }) as unknown as EmailResponse;
      const result = await response.json() as { id?: string };
      if (!response.ok) throw new EventMailError("رفض Gmail الإرسال. تحقق من الحساب وحدود الإرسال.");
      if (!result.id) throw new EventMailError("رد Gmail غير مكتمل؛ يحتاج الإرسال للتحقق.", true);
      return result.id;
    } catch (error) {
      if (error instanceof EventMailError) throw error;
      throw new EventMailError("تعذّر التحقق من نتيجة Gmail؛ راجع البريد المرسل.", true);
    }
  }
  if (provider !== "resend") throw new EventMailError("مزود البريد غير مدعوم.");
  const from = (process.env.RESEND_FROM_EMAIL || settings.confirmationEmailFrom || "").trim();
  if (!validEmailAddress(from) || from.toLowerCase().endsWith("@gmail.com")) throw new EventMailError("Resend يحتاج بريد مرسل من دومين موثّق، وليس Gmail.");
  if (process.env.VERCEL && !process.env.RESEND_API_KEY) throw new EventMailError("أضف RESEND_API_KEY وRESEND_FROM_EMAIL إلى أسرار Vercel.");
  if (uncertain) throw new EventMailError("نتيجة الإرسال السابق غير محسومة؛ تحقق منها قبل الإعادة.", true);
  const headers = { "Content-Type": "application/json", "Idempotency-Key": mail.key };
  const payload = JSON.stringify({
    from, to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html,
    attachments: mail.attachments?.map((a) => ({ filename: a.filename, content: a.content.toString("base64"), content_type: a.contentType })),
  });
  try {
    const response = (process.env.RESEND_API_KEY
      ? await fetch("https://api.resend.com/emails", { method: "POST", headers: { ...headers, Authorization: `Bearer ${process.env.RESEND_API_KEY}` }, body: payload, signal: AbortSignal.timeout(15000) })
      : await new ReplitConnectors().proxy("resend", "/emails", { method: "POST", headers, body: payload })) as unknown as EmailResponse;
    const result = await response.json() as { id?: string; name?: string; message?: string };
    if (!response.ok) throw resendRejection(response.status, result.name, result.message);
    if (!result.id) throw new EventMailError("رد Resend غير مكتمل؛ يحتاج الإرسال للتحقق.", true);
    return result.id;
  } catch (error) {
    if (error instanceof EventMailError) throw error;
    throw new EventMailError("تعذّر التحقق من نتيجة الإرسال عبر Resend.", true);
  }
}
