import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export type ItemKind = 'course' | 'workshop' | 'recorded' | 'individual-online' | 'session' | 'vip';

export type Item = {
  id: string;
  kind: ItemKind;
  icon: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  originalPriceJod: number;
  discountPriceJod: number | null;
  vipPriceJod?: number | null;
  vipEnabled?: boolean;
  telegramLink: string;
  telegramStandardLink?: string;
  telegramVipLink?: string;
  order: number;
};

const COL = 'items';

export async function fetchItems(): Promise<Item[]> {
  try {
    const q = query(collection(db, COL), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Item, 'id'>) }));
  } catch (e) {
    console.warn('fetchItems failed', e);
    return [];
  }
}

export async function saveItem(item: Item): Promise<void> {
  const { id, ...rest } = item;
  await setDoc(
    doc(db, COL, id),
    { ...rest, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function deleteItem(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export function effectivePrice(it: { originalPriceJod: number; discountPriceJod: number | null }): number {
  return it.discountPriceJod && it.discountPriceJod > 0 ? it.discountPriceJod : it.originalPriceJod;
}

export function discountPercent(it: { originalPriceJod: number; discountPriceJod: number | null }): number | null {
  if (!it.discountPriceJod || it.discountPriceJod <= 0 || it.discountPriceJod >= it.originalPriceJod) return null;
  return Math.round(((it.originalPriceJod - it.discountPriceJod) / it.originalPriceJod) * 100);
}

export function newItemTemplate(kind: ItemKind, order: number): Item {
  return {
    id: `${kind}-${Date.now()}`,
    kind,
    icon: kind === 'individual-online' ? '◉' : kind === 'session' ? '✧' : kind === 'vip' ? '👑' : '🎓',
    titleAr: '',
    titleEn: '',
    descAr: '',
    descEn: '',
    originalPriceJod: 0,
    discountPriceJod: null,
    vipPriceJod: null,
    vipEnabled: false,
    telegramLink: '',
    telegramStandardLink: '',
    telegramVipLink: '',
    order,
  };
}

export async function fetchItemById(id: string): Promise<Item | null> {
  try {
    const snap = await getDoc(doc(db, COL, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as Omit<Item, 'id'>) };
  } catch (e) {
    console.warn('fetchItemById failed', e);
    return null;
  }
}
