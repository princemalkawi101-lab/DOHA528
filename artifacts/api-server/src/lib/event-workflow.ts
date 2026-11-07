import { randomUUID } from "node:crypto";
import { FieldValue, Timestamp, type DocumentData, type QueryDocumentSnapshot, type Transaction } from "firebase-admin/firestore";
import { z } from "zod";
import { eventFirebase } from "./event-firebase.js";
import { sendEventConfirmation, sendEventAdminNotification, deliverEventNotifications } from "./event-email.js";
import { DEFAULT_WHATSAPP, PRIVATE_EVENT_MAIL_PATH, readPrivateWhatsAppSettings, whatsAppSettingsSchema } from "./event-private-email-settings.js";
import { VIP_TELEGRAM_URL, ONLINE_TELEGRAM_URL, hasConfirmedOnlineAccess } from "./event-access.js";
import { capturePayPalOrder, createPayPalOrder, getPayPalOrder, isPayPalApiError, verifyPayPalWebhook, type PayPalWebhookHeaders, type PayPalErrorDetail } from "./paypal.js";

export const EVENT_ID = "success-workshop-amman-2026";
const attendee = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(254),
});
const receipt = z.string().min(100).max(600000).regex(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/);
const orderIdSchema = z.string().regex(/^[A-Z0-9-]{5,80}$/i);
const idSchema = z.string().min(1).max(200).regex(/^[A-Za-z0-9_-]+$/);
export type EventUser = { uid: string; email?: string; admin?: boolean };
export class EventError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function isEventAdmin(user: EventUser) {
  return user.admin === true || user.email === "admin@dohahealing.com";
}
const isVip = (entry: DocumentData) => entry.membershipStatus === "VIP Member";
function publicRegistration(id: string, data: DocumentData) {
  return {
    id, name: data.name, phone: data.phone, email: data.email || "",
    attendance: data.attendance, status: data.status,
    membershipStatus: data.membershipStatus || "Standard",
    confirmationEmailStatus: data.confirmationEmailStatus || "not_sent",
    ...(isVip(data) ? { telegramUrl: VIP_TELEGRAM_URL } : {}),
    ...(hasConfirmedOnlineAccess(data) ? { onlineTelegramUrl: ONLINE_TELEGRAM_URL } : {}),
  };
}
async function requireEnabled() {
  const event = (await eventFirebase().db.doc("siteSettings/config").get()).data()?.event;
  if (event?.enabled === false) throw new EventError(409, "التسجيل في الورشة مغلق حاليًا.");
}
async function ownedRegistration(user: EventUser, id: string) {
  const ref = eventFirebase().db.collection("eventRegistrations").doc(idSchema.parse(id));
  const snapshot = await ref.get();
  const data = snapshot.data();
  if (!data || data.userId !== user.uid || data.eventId !== EVENT_ID) throw new EventError(404, "Registration not found.");
  return { ref, data };
}

type CompletedPayment = Awaited<ReturnType<typeof getPayPalOrder>>;

// The browser and webhook must commit exactly the same payment invariants.
async function reconcilePayment(orderId: string, payment: CompletedPayment) {
  const { db } = eventFirebase();
  const ref = db.collection("eventPaymentOrders").doc(orderId);
  return db.runTransaction(async (tx: Transaction) => {
    const order = (await tx.get(ref)).data();
    if (!order) throw new EventError(404, "Payment order not found.");
    if (!["online", "vip"].includes(order.tier)
      || order.amount !== (order.tier === "vip" ? 49 : 30) || order.currency !== "USD"
      || payment.orderId !== orderId || payment.captureStatus !== "COMPLETED"
      || payment.paymentStatus !== "COMPLETED" || !payment.captureId
      || payment.currency !== "USD" || payment.amount !== order.amount.toFixed(2)) {
      throw new EventError(409, "لم يتم التحقق من مبلغ وحالة الدفع. يرجى التواصل معنا وعدم الدفع مرة أخرى.");
    }
    const registrationRef = db.collection("eventRegistrations").doc(idSchema.parse(order.registrationId));
    const existing = await tx.get(registrationRef);
    const data = existing.data();
    if (order.status === "captured") {
      if (order.captureId !== payment.captureId || !data || data.userId !== order.userId || data.eventId !== EVENT_ID) {
        throw new EventError(409, "Payment recovery requires support.");
      }
      return registrationRef;
    }
    if (order.tier === "vip") {
      if (!data || data.userId !== order.userId || data.eventId !== EVENT_ID
        || (isVip(data) && data.vipPaypalOrderId !== orderId)) {
        throw new EventError(409, "Registration conflict. Contact support to recover your payment.");
      }
      // Membership never changes the independently-reviewed CliQ status.
      tx.update(registrationRef, {
        membershipStatus: "VIP Member", vipAmountUsd: 49, vipPaypalOrderId: orderId,
        vipCaptureId: payment.captureId, vipPaidAt: FieldValue.serverTimestamp(),
      });
    } else {
      // Never overwrite a CliQ booking, another owner, or existing VIP access.
      if (data && (data.status !== "rejected" || isVip(data)
        || data.userId !== order.userId || data.eventId !== EVENT_ID)) {
        throw new EventError(409, "يوجد تسجيل آخر. يرجى التواصل معنا لتسوية الدفع.");
      }
      tx.set(registrationRef, {
        ...attendee.parse(order.attendee), userId: order.userId, eventId: EVENT_ID, attendance: "online",
        paymentMethod: "paypal", amountUsd: 30, paypalOrderId: orderId,
        paypalCaptureId: payment.captureId, status: "approved", membershipStatus: "Standard",
        confirmationEmailStatus: "not_sent", createdAt: FieldValue.serverTimestamp(),
      });
    }
    tx.update(ref, { status: "captured", captureId: payment.captureId, capturedAt: FieldValue.serverTimestamp() });
    return registrationRef;
  });
}

export async function eventPayPalWebhook(headers: PayPalWebhookHeaders, raw: unknown) {
  // Authenticate before any database lookup or trusting event identifiers.
  if (!await verifyPayPalWebhook(headers, raw)) throw new EventError(401, "Invalid PayPal webhook signature.");
  const envelope = z.object({ id: z.string().min(1).max(200), event_type: z.string() }).passthrough().parse(raw);
  if (envelope.event_type !== "PAYMENT.CAPTURE.COMPLETED") return { received: true, ignored: true };
  const event = z.object({
    resource: z.object({
      id: orderIdSchema, status: z.literal("COMPLETED"),
      amount: z.object({ value: z.string(), currency_code: z.string() }),
      supplementary_data: z.object({ related_ids: z.object({ order_id: orderIdSchema }) }),
    }),
  }).parse(raw);
  const orderId = event.resource.supplementary_data.related_ids.order_id;
  // This REST app may also receive non-event store payments.
  const order = await eventFirebase().db.collection("eventPaymentOrders").doc(orderId).get();
  if (!order.exists) return { received: true, ignored: true };
  const payment = await getPayPalOrder(orderId);
  if (payment.captureId !== event.resource.id || payment.amount !== event.resource.amount.value
    || payment.currency !== event.resource.amount.currency_code) {
    throw new EventError(409, "Webhook does not match the provider capture.");
  }
  const registrationRef = await reconcilePayment(orderId, payment);
  await deliverEventNotifications(registrationRef.id, order.data()?.tier === "vip");
  return { received: true };
}

export async function eventAction(user: EventUser, raw: unknown): Promise<Record<string, unknown>> {
  const body = z.object({ action: z.string() }).passthrough().parse(raw);
  const { db } = eventFirebase();
  const registrations = db.collection("eventRegistrations");
  if (body.action === "get-private-email-settings" || body.action === "save-private-email-settings") {
    if (!isEventAdmin(user)) throw new EventError(403, "Administrator access required.");
    if (body.action === "get-private-email-settings") return { whatsapp: await readPrivateWhatsAppSettings() };
    const parsed = whatsAppSettingsSchema.safeParse(body.whatsapp);
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      const message = field === "url" ? "لم يُحفظ الرابط. الصق رابط دعوة مجموعة أو قناة واتساب كاملًا، ويجب أن يبدأ بـ https://chat.whatsapp.com/ أو https://whatsapp.com/channel/."
        : field === "buttonLabel" ? "اكتب نص زر الانضمام، بحد أقصى 80 حرفًا."
        : field === "invitation" ? "نص الدعوة أطول من المسموح. الحد الأقصى 1200 حرف."
        : "تعذّر حفظ إعدادات واتساب. أعد تحميل الإعدادات وتحقق من الحقول.";
      throw new EventError(400, message);
    }
    const input = parsed.data;
    const ref = db.doc(PRIVATE_EVENT_MAIL_PATH);
    const whatsapp = await db.runTransaction(async (tx: Transaction) => {
      const current = (await tx.get(ref)).data()?.whatsapp;
      if ((current?.revision ?? DEFAULT_WHATSAPP.revision) !== input.revision) {
        throw new EventError(409, "عدّل مسؤول آخر هذه الإعدادات. أعد تحميل الإعدادات قبل الحفظ.");
      }
      const saved = { ...input, revision: input.revision + 1 };
      tx.set(ref, { whatsapp: saved, updatedBy: user.uid, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
      return saved;
    });
    return { whatsapp };
  }
  if (body.action === "mine") {
    // A single-field query avoids requiring a production composite index.
    const rows = await registrations.where("userId", "==", user.uid).get();
    const mine = rows.docs.filter((r: QueryDocumentSnapshot<DocumentData>) => r.data().eventId === EVENT_ID)
      .sort((a: QueryDocumentSnapshot<DocumentData>, b: QueryDocumentSnapshot<DocumentData>) =>
        (b.data().createdAt?.toMillis?.() || 0) - (a.data().createdAt?.toMillis?.() || 0));
    const latest = mine[0];
    return { registration: latest ? publicRegistration(latest.id, latest.data()) : null };
  }
  if (body.action === "register-cliq") {
    await requireEnabled();
    const input = attendee.extend({ receiptDataUrl: receipt }).parse(body);
    const event = (await db.doc("siteSettings/config").get()).data()?.event;
    if (!event?.cliqAlias?.trim()) throw new EventError(409, "إعداد حساب CliQ غير مكتمل.");
    const ref = registrations.doc(`${EVENT_ID}_${user.uid}`);
    await db.runTransaction(async (tx: Transaction) => {
      const previous = await tx.get(ref);
      if (previous.exists && previous.data()?.status !== "rejected") return;
      if (previous.exists && isVip(previous.data()!)) throw new EventError(409, "يرجى التواصل معنا بخصوص التسجيل الحالي.");
      tx.set(ref, {
        ...input, userId: user.uid, eventId: EVENT_ID, attendance: "in-person",
        paymentMethod: "cliq", amountJod: 25, status: "pending", membershipStatus: "Standard",
        confirmationEmailStatus: "not_sent", createdAt: FieldValue.serverTimestamp(),
      });
    });
    await deliverEventNotifications(ref.id);
    return { registration: publicRegistration(ref.id, (await ref.get()).data()!) };
  }
  if (body.action === "create-order") {
    await requireEnabled();
    const tier = z.enum(["online", "vip"]).parse(body.tier);
    let details: DocumentData;
    let registrationId: string;
    if (tier === "vip") {
      registrationId = idSchema.parse(body.registrationId);
      const { data } = await ownedRegistration(user, registrationId);
      if (data.status === "rejected") throw new EventError(409, "يرجى التواصل معنا بخصوص طلبك قبل الترقية.");
      if (isVip(data)) throw new EventError(409, "أنت مشترك VIP بالفعل.");
      details = { name: data.name, phone: data.phone, email: data.email || user.email || "" };
      attendee.parse(details);
    } else {
      details = attendee.parse(body);
      registrationId = `${EVENT_ID}_${user.uid}`;
      const previous = await registrations.doc(registrationId).get();
      if (previous.exists && previous.data()?.status !== "rejected") throw new EventError(409, "لديك تسجيل قائم بالفعل. يرجى تحديث الصفحة.");
    }
    const amount = tier === "vip" ? 49 : 30;
    // Reserve one order per registration/tier before contacting PayPal.
    const session = db.collection("eventCheckoutSessions").doc(`${registrationId}_${tier}`);
    const reservation = randomUUID();
    const cached = await db.runTransaction(async (tx: Transaction) => {
      const snap = await tx.get(session);
      const data = snap.data();
      if (data?.orderId && data.expiresAt > Date.now()) return data.orderId as string;
      if (data?.busyUntil > Date.now()) throw new EventError(409, "جارٍ تجهيز الدفع. يرجى المحاولة بعد لحظات.");
      tx.set(session, { reservation, busyUntil: Date.now() + 60000, userId: user.uid });
      return null;
    });
    if (cached) return { id: cached };
    try {
      const result = await createPayPalOrder({
        currencyCode: "USD", cart: [{ titleEn: `Success Workshop — ${tier === "vip" ? "VIP Upgrade" : "Online"}`, jod: amount, amount, qty: 1 }],
      });
      await db.collection("eventPaymentOrders").doc(result.id).create({
        userId: user.uid, registrationId, tier, amount, currency: "USD",
        attendee: details, status: "created", createdAt: FieldValue.serverTimestamp(),
      });
      await session.set({ reservation, orderId: result.id, userId: user.uid, expiresAt: Date.now() + 2 * 60 * 60 * 1000, busyUntil: 0 });
      return { id: result.id };
    } catch (error: unknown) {
      await db.runTransaction(async (tx: Transaction) => {
        const current = (await tx.get(session)).data();
        if (current?.reservation === reservation) tx.delete(session);
      });
      throw error;
    }
  }
  if (body.action === "capture-order") {
    const orderId = orderIdSchema.parse(body.orderId);
    const ref = db.collection("eventPaymentOrders").doc(orderId);
    const order = (await ref.get()).data();
    if (!order || order.userId !== user.uid) throw new EventError(404, "Payment order not found.");
    const registrationRef = registrations.doc(order.registrationId);
    if (order.status === "captured") {
      const data = (await registrationRef.get()).data();
      if (!data) throw new EventError(409, "يرجى التواصل معنا لاستعادة تسجيلك.");
      await deliverEventNotifications(registrationRef.id, order.tier === "vip");
      return { captureStatus: "COMPLETED", registration: publicRegistration(registrationRef.id, data) };
    }
    let payment: Awaited<ReturnType<typeof capturePayPalOrder>>;
    try { payment = await capturePayPalOrder(orderId); }
    catch (error: unknown) {
      if (!isPayPalApiError(error)) throw error;
      if (!(error.providerName === "ORDER_ALREADY_CAPTURED"
        || error.details.some((d: PayPalErrorDetail) => d.issue === "ORDER_ALREADY_CAPTURED"))) throw error;
      payment = await getPayPalOrder(orderId);
    }
    await reconcilePayment(orderId, payment);
    await deliverEventNotifications(registrationRef.id, order.tier === "vip");
    return { captureStatus: "COMPLETED", registration: publicRegistration(registrationRef.id, (await registrationRef.get()).data()!) };
  }
  if (body.action === "arrival") {
    if (!isEventAdmin(user)) throw new EventError(403, "Administrator access required.");
    const input = z.object({
      registrationId: idSchema,
      arrived: z.boolean(),
      expectedRevision: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
    }).parse(body);
    const ref = registrations.doc(input.registrationId);
    return db.runTransaction(async (tx: Transaction) => {
      const data = (await tx.get(ref)).data();
      if (!data || data.eventId !== EVENT_ID) throw new EventError(404, "Registration not found.");
      const revision = data.arrivalRevision ?? 0;
      if (input.arrived && (data.status !== "approved" || data.attendance !== "in-person")) {
        throw new EventError(409, "Arrival requires an approved in-person base ticket. VIP membership alone does not grant entry.");
      }
      const alreadyArrived = input.arrived && !!data.arrivedAt;
      // A stale undo must never clear a newer arrival from another staff member.
      if (!alreadyArrived && revision !== input.expectedRevision) {
        throw new EventError(409, "Arrival status changed. Refresh the registration and try again.");
      }
      const now = Timestamp.now();
      const patch = alreadyArrived ? {
        duplicateCheckIns: (data.duplicateCheckIns ?? 0) + 1,
        lastDuplicateCheckInAt: now,
      } : {
        arrivedAt: input.arrived ? now : null,
        arrivedBy: input.arrived ? user.uid : null,
        arrivalRevision: revision + 1,
        arrivalUpdatedAt: now,
        arrivalUpdatedBy: user.uid,
      };
      tx.update(ref, patch);
      const current = { ...data, ...patch };
      return {
        outcome: alreadyArrived ? "already-arrived" : input.arrived ? "arrived" : "undone",
        arrivedAt: current.arrivedAt?.toDate().toISOString() ?? null,
        arrivalRevision: current.arrivalRevision ?? 0,
        duplicateCheckIns: current.duplicateCheckIns ?? 0,
      };
    });
  }
  if (body.action === "retry-admin-email") {
    if (!isEventAdmin(user)) throw new EventError(403, "Administrator access required.");
    const ref = registrations.doc(idSchema.parse(body.registrationId));
    const data = (await ref.get()).data();
    if (!data || data.eventId !== EVENT_ID) throw new EventError(404, "Registration not found.");
    const vip = body.kind === "vip";
    if (vip && data.membershipStatus !== "VIP Member") throw new EventError(409, "VIP payment is not confirmed.");
    if (!vip && data.paymentMethod === "paypal" && !data.paypalCaptureId) throw new EventError(409, "Payment is not confirmed.");
    return sendEventAdminNotification(ref.id, vip);
  }
  if (body.action === "review" || body.action === "retry-email") {
    if (!isEventAdmin(user)) throw new EventError(403, "Administrator access required.");
    const ref = registrations.doc(idSchema.parse(body.registrationId));
    const data = (await ref.get()).data();
    if (!data || data.eventId !== EVENT_ID) throw new EventError(404, "Registration not found.");
    const status = body.action === "review" ? z.enum(["approved", "rejected"]).parse(body.status) : data.status;
    if (status === "approved" && data.paymentMethod === "paypal" && !data.paypalCaptureId) {
      throw new EventError(409, "سجل PayPal قديم غير موثّق من الخادم؛ يرجى مطابقة العملية قبل نقله إلى التسجيل الجديد.");
    }
    if (body.action === "review") {
      await db.runTransaction(async (tx: Transaction) => {
        const current = (await tx.get(ref)).data();
        if (!current || current.eventId !== EVENT_ID) throw new EventError(404, "Registration not found.");
        if (status === "rejected" && current.arrivedAt) {
          throw new EventError(409, "Undo arrival before rejecting this ticket.");
        }
        tx.update(ref, { status, reviewedAt: FieldValue.serverTimestamp(), reviewedBy: user.uid });
      });
    }
    if (status !== "approved") {
      if (body.action === "retry-email") throw new EventError(409, "Approve the registration before sending a confirmation.");
      return { status };
    }
    const result = await sendEventConfirmation(ref.id, data);
    return { status, ...result };
  }
  if (body.action === "email-readiness") {
    if (!isEventAdmin(user)) throw new EventError(403, "Administrator access required.");
    const event = (await db.doc("siteSettings/config").get()).data()?.event ?? {};
    return { senderConfigured: !!(event.confirmationEmailFrom || process.env.RESEND_FROM_EMAIL) };
  }
  throw new EventError(400, "Unknown event action.");
}
