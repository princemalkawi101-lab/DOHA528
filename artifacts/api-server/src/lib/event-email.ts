import { FieldValue, type DocumentData, type Transaction } from "firebase-admin/firestore";
import { eventFirebase } from "./event-firebase.js";
import { deliverEventMail, EventMailError, type EventMail, type EventAttachment } from "./event-mail-transport.js";
import { readPrivateWhatsAppSettings } from "./event-private-email-settings.js";
import { ONLINE_TELEGRAM_URL, hasConfirmedOnlineAccess } from "./event-access.js";

type Kind = "confirmation" | "admin-booking" | "admin-vip";
const ADMIN_EMAIL = "Dohamlk74@gmail.com";
const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (s) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[s]!);
const prefixFor = (kind: Kind) => kind === "confirmation" ? "confirmationEmail" : kind === "admin-vip" ? "adminVipEmail" : "adminNotificationEmail";

function buildMail(id: string, data: DocumentData, settings: DocumentData, kind: Kind, whatsapp?: Awaited<ReturnType<typeof readPrivateWhatsAppSettings>>): EventMail {
  const time = String(settings.confirmationTime || "من 1:00 مساءً إلى 4:00 مساءً بتوقيت الأردن");
  let text: string;
  let subject: string;
  const attachments: EventAttachment[] = [];
  let invitationHtml = "";
  let invitationText = "";
  const includeWhatsApp = kind === "confirmation" && data.attendance === "in-person" && whatsapp?.enabled;
  if (kind === "confirmation") {
    const access = data.attendance === "online"
      ? String(settings.onlineAccessInfo || "تم تأكيد حضورك أونلاين. ستصلك تفاصيل الدخول قبل موعد الورشة.")
      : String(settings.inPersonAccessInfo || "الحضور حضوري في الأردن، عمّان. يرجى الاحتفاظ برسالة التأكيد وإبراز الاسم المسجل عند الوصول.");
    subject = "تأكيد الحجز — ورشة تجسيد النجاح";
    text = `مرحبًا ${data.name || ""}،\nتم تأكيد تسجيلك في ورشة تجسيد النجاح مع Master Doha Malkawi.\nالتاريخ: السبت 21 نوفمبر 2026\nالوقت: ${time}\n${access}\nنتطلع للقائك.`;
    if (includeWhatsApp) {
      invitationHtml = `<p>${escapeHtml(whatsapp.invitation).replace(/\n/g, "<br>")}</p><p><a href="${escapeHtml(whatsapp.url)}" style="display:inline-block;background:#174c3c;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">${escapeHtml(whatsapp.buttonLabel)}</a></p>`;
      invitationText = `\n\n${whatsapp.invitation}\n${whatsapp.buttonLabel}: ${whatsapp.url}`;
    } else if (hasConfirmedOnlineAccess(data)) {
      const label = "الانضمام إلى قناة الورشة للأونلاين على Telegram";
      invitationText = `\n\nتم تأكيد دفعك وحضورك أونلاين. انضم إلى قناة الورشة لمتابعة التفاصيل:\n${ONLINE_TELEGRAM_URL}`;
      invitationHtml = `<p>انضم إلى قناة الورشة الخاصة بالحضور أونلاين لمتابعة التفاصيل.</p><p><a href="${escapeHtml(ONLINE_TELEGRAM_URL)}" style="display:inline-block;background:#174c3c;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:bold">${label}</a></p>`;
    }
  } else {
    subject = kind === "admin-vip" ? "ترقية VIP مدفوعة — ورشة تجسيد النجاح" : "حجز جديد — ورشة تجسيد النجاح";
    text = `${subject}\nالاسم: ${data.name || ""}\nالهاتف: ${data.phone || ""}\nالبريد: ${data.email || ""}\nالحضور: ${data.attendance === "online" ? "أونلاين" : "حضوري — عمّان، الأردن"}\nطريقة الدفع: ${data.paymentMethod === "cliq" && kind !== "admin-vip" ? "CliQ" : "PayPal / بطاقة عبر PayPal"}\nالمبلغ: ${kind === "admin-vip" ? "49 USD (إضافية)" : data.paymentMethod === "cliq" ? "25 JOD" : "30 USD"}\nالحالة: ${data.status === "approved" ? "مقبول" : data.status === "rejected" ? "مرفوض" : "قيد مراجعة الوصل"}\nمرجع التسجيل: ${id}\nمرجع الدفع: ${kind === "admin-vip" ? data.vipPaypalOrderId || "" : data.paypalOrderId || ""}\nالتاريخ: 21 نوفمبر 2026\nالوقت: ${time}`;
    if (kind === "admin-booking" && data.paymentMethod === "cliq") {
      const match = typeof data.receiptDataUrl === "string" && data.receiptDataUrl.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
      if (!match) throw new EventMailError("إيصال CliQ غير متاح لإرفاقه. راجع التسجيل قبل إعادة إرسال إشعار الإدارة.");
      attachments.push({ filename: `cliq-receipt.${match[1] === "jpeg" ? "jpg" : match[1]}`, content: Buffer.from(match[2], "base64"), contentType: `image/${match[1]}` });
    }
  }
  return {
    key: `event-${kind}-${id}`, to: kind === "confirmation" ? String(data.email || "") : ADMIN_EMAIL,
    subject, text: text + invitationText, attachments,
    html: `<div dir="rtl" style="font-family:Arial,sans-serif;line-height:2;color:#174c3c">${escapeHtml(text).replace(/\n/g, "<br>")}${invitationHtml}</div>`,
  };
}

async function sendNotification(id: string, kind: Kind) {
  const { db } = eventFirebase();
  const ref = db.collection("eventRegistrations").doc(id);
  const prefix = prefixFor(kind);
  const leaseField = kind === "confirmation" ? "emailLeaseUntil" : `${prefix}LeaseUntil`;
  const settings = (await db.doc("siteSettings/config").get()).data()?.event ?? {};
  const lock = await db.runTransaction(async (tx: Transaction) => {
    const data = (await tx.get(ref)).data();
    if (!data || (kind === "confirmation" && data.status !== "approved")
      || (kind === "admin-vip" && data.membershipStatus !== "VIP Member")) return { skipped: true };
    if (data[`${prefix}Status`] === "sent") return { alreadySent: true };
    if (data[leaseField] > Date.now()) return { busy: true };
    const uncertain = data[`${prefix}Status`] === "uncertain" || data[`${prefix}Status`] === "sending";
    tx.update(ref, { [leaseField]: Date.now() + 60000, [`${prefix}Status`]: "sending" });
    return { data, uncertain };
  });
  if (lock.skipped) return { emailStatus: "not_sent", emailError: "" };
  if (lock.alreadySent) return { emailStatus: "sent", emailError: "" };
  if (lock.busy) return { emailStatus: "sending", emailError: "جارٍ إرسال الرسالة بالفعل." };
  let accepted = false;
  try {
    const whatsapp = kind === "confirmation" && lock.data!.attendance === "in-person" ? await readPrivateWhatsAppSettings() : undefined;
    const mail = buildMail(id, lock.data!, settings, kind, whatsapp);
    const emailId = await deliverEventMail(mail, settings, !!lock.uncertain);
    accepted = true;
    await ref.update({
      [`${prefix}Status`]: "sent", [`${prefix}Id`]: emailId,
      [`${prefix}SentAt`]: FieldValue.serverTimestamp(), [`${prefix}Error`]: "", [leaseField]: 0,
    });
    return { emailStatus: "sent", emailError: "" };
  } catch (error) {
    const status = accepted || lock.uncertain || (error instanceof EventMailError && error.uncertain) ? "uncertain" : "failed";
    // Only our fixed messages are safe to persist/display; never SDK errors.
    const message = error instanceof EventMailError ? error.message : "تعذّر إرسال البريد. راجع إعدادات مزود البريد.";
    await ref.update({
      [`${prefix}Status`]: status, [`${prefix}Error`]: message,
      [`${prefix}AttemptedAt`]: FieldValue.serverTimestamp(), [leaseField]: 0,
    });
    return { emailStatus: status, emailError: message };
  }
}

export async function sendEventConfirmation(id: string, _entry?: unknown) {
  return sendNotification(id, "confirmation");
}
export async function sendEventAdminNotification(id: string, vip = false) {
  return sendNotification(id, vip ? "admin-vip" : "admin-booking");
}

// Booking/payment success never depends on the mail provider. Persist failures
// independently for an explicit admin retry; never roll back a verified capture.
export async function deliverEventNotifications(id: string, vip = false) {
  try {
    await sendEventAdminNotification(id, vip);
    if (!vip) await sendEventConfirmation(id);
  } catch {
    // Database failures still need a safe retry path without repeating payment.
    try {
      await eventFirebase().db.collection("eventRegistrations").doc(id).update({
        [`${prefixFor(vip ? "admin-vip" : "admin-booking")}Status`]: "failed",
        [`${prefixFor(vip ? "admin-vip" : "admin-booking")}Error`]: "تعذّر تجهيز إشعار البريد. أعد إرساله من لوحة الإدارة.",
      });
    } catch { /* A later verified capture replay can resume notifications. */ }
  }
}
