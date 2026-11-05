import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from './firebase';

export type EventRegistrationStatus = 'pending' | 'approved' | 'rejected';

export interface EventRegistration {
  id: string;
  userId: string;
  eventId: 'success-workshop-amman-2026';
  attendance: 'in-person' | 'online';
  paymentMethod: 'cliq' | 'paypal';
  name: string;
  phone: string;
  receiptDataUrl: string;
  amountJod: 25;
  status: EventRegistrationStatus;
  paypalOrderId?: string;
  amountUsd?: 30;
  createdAt?: { toDate?: () => Date };
}

const registrations = collection(db, 'eventRegistrations');

export async function createCliqRegistration(input: {
  name: string;
  phone: string;
  receiptDataUrl: string;
}): Promise<string> {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('AUTHENTICATION_REQUIRED');
  const ref = await addDoc(registrations, {
    userId,
    eventId: 'success-workshop-amman-2026',
    attendance: 'in-person',
    paymentMethod: 'cliq',
    name: input.name.trim(),
    phone: input.phone.trim(),
    receiptDataUrl: input.receiptDataUrl,
    amountJod: 25,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function createOnlineEventRegistration(input: {
  name: string;
  phone: string;
  paypalOrderId: string;
}): Promise<string> {
  const userId = auth.currentUser?.uid;
  if (!userId) throw new Error('AUTHENTICATION_REQUIRED');
  const ref = await addDoc(registrations, {
    userId,
    eventId: 'success-workshop-amman-2026',
    attendance: 'online',
    paymentMethod: 'paypal',
    name: input.name.trim(),
    phone: input.phone.trim(),
    paypalOrderId: input.paypalOrderId,
    amountUsd: 30,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function fetchEventRegistrations(): Promise<EventRegistration[]> {
  const snapshot = await getDocs(query(registrations, orderBy('createdAt', 'desc')));
  return snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() } as EventRegistration));
}

export async function updateEventRegistrationStatus(
  id: string,
  status: EventRegistrationStatus,
): Promise<void> {
  await updateDoc(doc(db, 'eventRegistrations', id), { status, reviewedAt: serverTimestamp() });
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
