import { ReplitConnectors } from "@replit/connectors-sdk";
import { FieldValue } from "firebase-admin/firestore";
import { eventFirebase } from "./event-firebase";

type EmailEntry = { name?: string; email?: string; attendance?: string; confirmationEmailStatus?: string };
const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[s]!);

export async function sendEventConfirmation(id: string, entry: EmailEntry) {
  const { db } = eventFirebase();
  const ref = db.collection("eventRegistrations").doc(id);
  const settings = (await db.doc("siteSettings/config").get()).data()?.event ?? {};
  const from = String(settings.confirmationEmailFrom || process.env.RESEND_FROM_EMAIL || "").trim();
  if (entry.confirmationEmailStatus === "sent") return { emailStatus: "sent", emailError: "" };
  try {
    if (!entry.email) throw new Error("This registration has no email address. Add one before retrying.");
    if (!/^[^\s<>]+@[^\s<>]+\.[^\s<>]+$/.test(from)) throw new Error("Set a verified Resend sender email in event settings.");
    const time = String(settings.confirmationTime || "من 1:00 مساءً إلى 4:00 مساءً بتوقيت الأردن");
    const access = entry.attendance === "online"
      ? String(settings.onlineAccessInfo || "تم تأكيد حضورك أونلاين. ستصلك تفاصيل الدخول قبل موعد الورشة.")
      : String(settings.inPersonAccessInfo || "الحضور حضوري في الأردن، عمّان. يرجى الاحتفاظ برسالة التأكيد وإبراز الاسم المسجل عند الوصول.");
    const text = `مرحبًا ${entry.name || ""}،\nتم تأكيد تسجيلك في ورشة تجسيد النجاح مع Master Doha Malkawi.\nالتاريخ: السبت 21 نوفمبر 2026\nالوقت: ${time}\n${access}\nنتطلع للقائك.`;
    const payload = {
      from, to: [entry.email], subject: "تأكيد الحجز — ورشة تجسيد النجاح",
      text, html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:2;color:#174c3c">${escapeHtml(text).replace(/\n/g, "<br>")}</div>`,
    };
    const headers = { "Content-Type": "application/json", "Idempotency-Key": `event-approved-${id}` };
    const response = process.env.RESEND_API_KEY
      ? await fetch("https://api.resend.com/emails", {
          method: "POST", headers: { ...headers, Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
          body: JSON.stringify(payload), signal: AbortSignal.timeout(15000),
        })
      : await new ReplitConnectors().proxy("resend", "/emails", {
          method: "POST", headers, body: JSON.stringify(payload),
        });
    const result = await response.json() as { id?: string; message?: string };
    if (!response.ok || !result.id) throw new Error(result.message || "Email provider rejected the confirmation.");
    await ref.update({
      confirmationEmailStatus: "sent", confirmationEmailId: result.id,
      confirmationEmailSentAt: FieldValue.serverTimestamp(), confirmationEmailError: "",
    });
    return { emailStatus: "sent", emailError: "" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email delivery failed.";
    await ref.update({
      confirmationEmailStatus: "failed", confirmationEmailError: message.slice(0, 350),
      confirmationEmailAttemptedAt: FieldValue.serverTimestamp(),
    });
    return { emailStatus: "failed", emailError: message.slice(0, 350) };
  }
}
