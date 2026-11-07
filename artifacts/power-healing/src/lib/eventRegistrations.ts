import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  onSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { serverApi } from './serverApi';
import { guestAuthorization } from './eventGuest';

export type EventRegistrationStatus = 'pending' | 'approved' | 'rejected';

export interface EventRegistration {
  id: string;
  userId: string;
  eventId: 'success-workshop-amman-2026';
  attendance: 'in-person' | 'online';
  paymentMethod: 'cliq' | 'paypal';
  name: string;
  phone: string;
  email?: string;
  receiptDataUrl?: string;
  amountJod?: 25;
  status: EventRegistrationStatus;
  paypalOrderId?: string;
  amountUsd?: number;
  membershipStatus?: 'Standard' | 'VIP Member';
  vipAmountUsd?: number;
  vipPaypalOrderId?: string;
  confirmationEmailStatus?: 'not_sent' | 'sent' | 'failed' | 'sending' | 'uncertain';
  confirmationEmailError?: string;
  adminNotificationEmailStatus?: 'not_sent' | 'sent' | 'failed' | 'sending' | 'uncertain';
  adminNotificationEmailError?: string;
  adminVipEmailStatus?: 'not_sent' | 'sent' | 'failed' | 'sending' | 'uncertain';
  adminVipEmailError?: string;
  arrivedAt?: { toDate?: () => Date } | string | null;
  arrivalRevision?: number;
  duplicateCheckIns?: number;
  createdAt?: { toDate?: () => Date };
}

const registrations = collection(db, 'eventRegistrations');

export async function createCliqRegistration(input: {
  name: string;
  phone: string;
  email: string;
  receiptDataUrl: string;
}): Promise<{ registration: MyEventRegistration }> {
  return guestEventRequest({ action: 'register-cliq', ...input });
}

export interface MyEventRegistration {
  id: string;
  name: string;
  phone: string;
  email: string;
  attendance: 'in-person' | 'online';
  status: EventRegistrationStatus;
  membershipStatus: 'Standard' | 'VIP Member';
  telegramUrl?: string;
  onlineTelegramUrl?: string;
}

export async function eventRequest<T>(
  body: Record<string, unknown>,
  options: { signal?: AbortSignal; timeoutMs?: number; guest?: boolean } = {},
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let cancel: () => void = () => {};
  const interrupted = new Promise<never>((_, reject) => {
    cancel = () => {
      controller.abort();
      reject(new DOMException('Request cancelled', 'AbortError'));
    };
    options.signal?.addEventListener('abort', cancel, { once: true });
    if (options.signal?.aborted) { cancel(); return; }
    // Include Firebase token retrieval and response-body parsing in the deadline.
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error('تعذّر الاتصال بخدمة التسجيل في الوقت المحدد. تحقق من اتصالك وأعد المحاولة، ولا تدفع مرة أخرى إذا دفعت سابقًا.'));
    }, options.timeoutMs ?? (body.action === 'mine' ? 12000 : 45000));
  });
  try {
    return await Promise.race([interrupted, (async () => {
      if (controller.signal.aborted) throw new DOMException('Request cancelled', 'AbortError');
      const response = await serverApi('/api/event', {
        method: 'POST', body: JSON.stringify(body), signal: controller.signal,
      }, { sameOrigin: true, ...(options.guest ? { authorization: guestAuthorization() } : {}) });
      if (!response.headers.get('content-type')?.includes('application/json')) {
        throw new Error('خدمة التسجيل غير متاحة حاليًا. يرجى إعادة المحاولة بعد قليل.');
      }
      const result: unknown = await response.json();
      if (!response.ok) {
        const message = result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
          ? result.error : 'تعذّر تحميل خدمة التسجيل. يرجى إعادة المحاولة.';
        throw new Error(message);
      }
      return result as T;
    })()]);
  } catch (error) {
    if (error instanceof TypeError) throw new Error('تعذّر الاتصال بخدمة التسجيل. تحقق من اتصالك وأعد المحاولة.');
    if (error instanceof SyntaxError) throw new Error('تعذّر التحقق من استجابة خدمة التسجيل. يرجى إعادة المحاولة.');
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', cancel);
  }
}

export function guestEventRequest<T>(
  body: Record<string, unknown>,
  options: { signal?: AbortSignal; timeoutMs?: number } = {},
): Promise<T> {
  return eventRequest<T>(body, { ...options, guest: true });
}

export async function fetchEventRegistrations(): Promise<EventRegistration[]> {
  const snapshot = await getDocs(query(registrations, orderBy('createdAt', 'desc')));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as EventRegistration));
}

export async function updateEventRegistrationStatus(
  id: string,
  status: EventRegistrationStatus,
): Promise<{ status: EventRegistrationStatus; emailStatus?: 'sent' | 'failed' | 'sending' | 'uncertain'; emailError?: string }> {
  return eventRequest({ action: 'review', registrationId: id, status });
}

export interface EventArrivalResult {
  outcome: 'arrived' | 'already-arrived' | 'undone';
  arrivedAt: string | null;
  arrivalRevision: number;
  duplicateCheckIns: number;
}

export async function updateEventArrival(entry: EventRegistration, arrived: boolean): Promise<EventArrivalResult> {
  return eventRequest({
    action: 'arrival', registrationId: entry.id, arrived,
    expectedRevision: entry.arrivalRevision ?? 0,
  });
}

export function subscribeEventRegistrations(
  onChange: (entries: EventRegistration[]) => void,
  onError: (error: Error) => void,
) {
  return onSnapshot(query(registrations, orderBy('createdAt', 'desc')), (snapshot) => {
    onChange(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as EventRegistration)));
  }, onError);
}

export async function deleteEventRegistration(id: string): Promise<void> {
  await deleteDoc(doc(db, 'eventRegistrations', id));
}

export async function compressReceiptToDataUrl(file: File): Promise<string> {
  if (file.type && !file.type.startsWith('image/')) throw new Error('يرجى اختيار صورة إيصال بصيغة JPG أو PNG أو WebP.');
  if (file.size > 12 * 1024 * 1024) throw new Error('حجم الصورة كبير. يرجى اختيار صورة أصغر من 12 ميغابايت.');
  // Android providers can omit MIME metadata; validate by decoding the image.
  // HTMLImageElement also works in browsers without createImageBitmap.
  const url = URL.createObjectURL(file);
  try {
    const bitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      const timer = setTimeout(() => {
        image.onload = image.onerror = null;
        reject(new Error('استغرق فتح الصورة وقتًا طويلًا. يرجى اختيار صورة أخرى.'));
      }, 12000);
      image.onload = () => { clearTimeout(timer); resolve(image); };
      image.onerror = () => { clearTimeout(timer); reject(new Error('تعذّر فتح الصورة. يرجى اختيار صورة بصيغة JPG أو PNG أو WebP.')); };
      image.src = url;
    });
    const maxSide = 1200;
    const ratio = Math.min(maxSide / bitmap.width, maxSide / bitmap.height, 1);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
    canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('تعذّر تجهيز الصورة في هذا المتصفح. يرجى استخدام متصفح آخر.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    let quality = 0.82;
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    while (dataUrl.length > 520_000 && quality > 0.42) {
      quality -= 0.1;
      dataUrl = canvas.toDataURL('image/jpeg', quality);
    }
    if (dataUrl.length > 600_000) throw new Error('الصورة ما زالت كبيرة بعد الضغط. يرجى اختيار صورة أصغر.');
    return dataUrl;
  } finally { URL.revokeObjectURL(url); }
}
