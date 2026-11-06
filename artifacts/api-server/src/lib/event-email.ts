import { createHash } from "node:crypto";
import { ReplitConnectors } from "@replit/connectors-sdk";
import { FieldValue, type Transaction } from "firebase-admin/firestore";
import { eventFirebase } from "./event-firebase.js";

type EmailEntry = { name?: string; email?: string; attendance?: string };
// Keep the connector boundary independent of ambient DOM/fetch Response types.
type EmailHttpResponse = {
  readonly ok: boolean;
  json(): Promise<unknown>;
};
const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[s]!);
const validAddress = (value: string) => /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value);

export async function sendEventConfirmation(id: string, entry: EmailEntry) {
  const { db } = eventFirebase();
  const ref = db.collection("eventRegistrations").doc(id);
  const settings = (await db.doc("siteSettings/config").get()).data()?.event ?? {};
  const provider = settings.confirmationEmailProvider || "gmail";
  const lock = await db.runTransaction(async (tx: Transaction) => {
    const data = (await tx.get(ref)).data()!;
    if (data.confirmationEmailStatus === "sent") return { alreadySent: true, uncertain: false };
    if (data.emailLeaseUntil > Date.now()) return { busy: true, uncertain: false };
    tx.update(ref, { emailLeaseUntil: Date.now() + 60000, confirmationEmailStatus: "sending" });
    return { uncertain: data.confirmationEmailStatus === "uncertain" };
  });
  if (lock.alreadySent) return { emailStatus: "sent", emailError: "" };
  if (lock.busy) return { emailStatus: "sending", emailError: "An email is already being processed. Refresh its status shortly." };
  let deliveryMayHaveSucceeded = false;
  try {
    if (!entry.email || !validAddress(entry.email)) throw new Error("This registration has no valid confirmation email.");
    const time = String(settings.confirmationTime || "من 1:00 مساءً إلى 4:00 مساءً بتوقيت الأردن");
    const access = entry.attendance === "online"
      ? String(settings.onlineAccessInfo || "تم تأكيد حضورك أونلاين. ستصلك تفاصيل الدخول قبل موعد الورشة.")
      : String(settings.inPersonAccessInfo || "الحضور حضوري في الأردن، عمّان. يرجى الاحتفاظ برسالة التأكيد وإبراز الاسم المسجل عند الوصول.");
    const text = `مرحبًا ${entry.name || ""}،\nتم تأكيد تسجيلك في ورشة تجسيد النجاح مع Master Doha Malkawi.\nالتاريخ: السبت 21 نوفمبر 2026\nالوقت: ${time}\n${access}\nنتطلع للقائك.`;
    const subject = "تأكيد الحجز — ورشة تجسيد النجاح";
    const connectors = new ReplitConnectors();
    let emailId: string;
    if (provider === "gmail") {
      const profile = await connectors.proxy("google-mail", "/gmail/v1/users/me/profile", { method: "GET" }) as unknown as EmailHttpResponse;
      const account = await profile.json() as { emailAddress?: string };
      if (!profile.ok || !account.emailAddress) throw new Error("Gmail sender is unavailable. Reconnect the sending account.");
      const from = String(settings.confirmationEmailFrom || account.emailAddress).trim();
      if (from.toLowerCase() !== account.emailAddress.toLowerCase()) throw new Error("Configured sender must match the connected Gmail account.");
      const messageId = `event-approved-${createHash("sha256").update(id).digest("hex").slice(0, 32)}@power-healing.local`;
      // Gmail has no idempotency header: read back a deterministic Message-ID
      // before retrying a potentially successful send.
      const sent = await connectors.proxy("google-mail", `/gmail/v1/users/me/messages?q=${encodeURIComponent(`in:sent rfc822msgid:${messageId}`)}&maxResults=1`, { method: "GET" }) as unknown as EmailHttpResponse;
      const found = await sent.json() as { messages?: { id: string }[] };
      if (!sent.ok) throw new Error("Unable to check previously sent confirmations. No duplicate email was sent.");
      if (found.messages?.[0]) {
        emailId = found.messages[0].id;
      } else {
        if (lock.uncertain) throw new Error("Previous email delivery is uncertain. Check Gmail Sent before attempting another send.");
        const mime = [
          `From: ${from}`, `To: ${entry.email}`,
          `Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`,
          `Message-ID: <${messageId}>`, "MIME-Version: 1.0",
          'Content-Type: text/plain; charset="UTF-8"', "Content-Transfer-Encoding: base64",
          "", Buffer.from(text).toString("base64").match(/.{1,76}/g)!.join("\r\n"),
        ].join("\r\n");
        deliveryMayHaveSucceeded = true;
        const response = await connectors.proxy("google-mail", "/gmail/v1/users/me/messages/send", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raw: Buffer.from(mime).toString("base64url") }),
        }) as unknown as EmailHttpResponse;
        const result = await response.json() as { id?: string };
        if (!response.ok) { deliveryMayHaveSucceeded = false; throw new Error("Gmail rejected the confirmation. Check the account and sending limits."); }
        if (!result.id) throw new Error("Gmail response was incomplete. Delivery needs verification.");
        emailId = result.id;
      }
    } else if (provider === "resend") {
      const from = String(settings.confirmationEmailFrom || process.env.RESEND_FROM_EMAIL || "").trim();
      if (!validAddress(from)) throw new Error("Set a verified Resend sender email in event settings.");
      const payload = {
        from, to: [entry.email], subject, text,
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:2;color:#174c3c">${escapeHtml(text).replace(/\n/g, "<br>")}</div>`,
      };
      const headers = { "Content-Type": "application/json", "Idempotency-Key": `event-approved-${id}` };
      const response = (process.env.RESEND_API_KEY
        ? await fetch("https://api.resend.com/emails", {
            method: "POST", headers: { ...headers, Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
            body: JSON.stringify(payload), signal: AbortSignal.timeout(15000),
          })
        : await connectors.proxy("resend", "/emails", { method: "POST", headers, body: JSON.stringify(payload) })) as unknown as EmailHttpResponse;
      const result = await response.json() as { id?: string; message?: string };
      if (!response.ok || !result.id) throw new Error(result.message || "Resend rejected the confirmation.");
      emailId = result.id;
    } else {
      throw new Error("Unsupported confirmation email provider.");
    }
    await ref.update({
      confirmationEmailStatus: "sent", confirmationEmailId: emailId,
      confirmationEmailSentAt: FieldValue.serverTimestamp(), confirmationEmailError: "", emailLeaseUntil: 0,
    });
    return { emailStatus: "sent", emailError: "" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email delivery failed.";
    const status = deliveryMayHaveSucceeded || lock.uncertain ? "uncertain" : "failed";
    await ref.update({
      confirmationEmailStatus: status, confirmationEmailError: message.slice(0, 350),
      confirmationEmailAttemptedAt: FieldValue.serverTimestamp(), emailLeaseUntil: 0,
    });
    return { emailStatus: status, emailError: message.slice(0, 350) };
  }
}
