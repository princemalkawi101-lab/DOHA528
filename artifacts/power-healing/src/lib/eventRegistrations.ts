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
import { readJson, serverApi } from './serverApi';

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
  receiptDataUrl: string;
  amountJod: 25;
  status: EventRegistrationStatus;
  paypalOrderId?: string;
  amountUsd?: 30;
  membershipStatus?: 'Standard' | 'VIP Member';
  vipAmountUsd?: 49;
  vipPaypalOrderId?: string;
  confirmationEmailStatus?: 'not_sent' | 'sent' | 'failed';
  confirmationEmailError?: string;
  createdAt?: { toDate?: () => Date };
}

const registrations = collection(db, 'eventRegistrations');

export async function createCliqRegistration(input: {
  name: string;
  phone: string;
  email: string;
  receiptDataUrl: string;
}): Promise<{ registration: MyEventRegistration }> {
  return eventRequest({ action: 'register-cliq', ...input });
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
}

export async function eventRequest<T>(body: Record<string, unknown>): Promise<T> {
  return readJson<T>(await serverApi('/api/event', { method: 'POST', body: JSON.stringify(body) }));
}

export async function fetchEventRegistrations(): Promise<EventRegistration[]> {
  const snapshot = await getDocs(query(registrations, orderBy('createdAt', 'desc')));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as EventRegistration));
}

export async function updateEventRegistrationStatus(
  id: string,
  status: EventRegistrationStatus,
): Promise<{ status: EventRegistrationStatus; emailStatus?: 'sent' | 'failed'; emailError?: string }> {
  return eventRequest({ action: 'review', registrationId: id, status });
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
  if (!file.type.startsWith('image/')) throw new Error('INVALID_IMAGE');
  if (file.size > 12 * 1024 * 1024) throw new Error('IMAGE_TOO_LARGE');

  const bitmap = await createImageBitmap(file);
  const maxSide = 1200;
  const ratio = Math.min(maxSide / bitmap.width, maxSide / bitmap.height, 1);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(bitmap.width * ratio));
  canvas.height = Math.max(1, Math.round(bitmap.height * ratio));
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  let quality = 0.82;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  while (dataUrl.length > 520_000 && quality > 0.42) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  if (dataUrl.length > 600_000) throw new Error('IMAGE_TOO_LARGE');
  return dataUrl;
}
