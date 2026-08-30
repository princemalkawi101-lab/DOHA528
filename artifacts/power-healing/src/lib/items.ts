import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export type ItemKind = 'course' | 'workshop' | 'recorded' | 'individual-online' | 'session' | 'vip';
export type ContentEntryType = 'material' | 'lesson';

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
  imageUrl?: string;
  categoryId?: string | null;
  contentType?: ContentEntryType;
  active?: boolean;
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
  const itemRef = doc(db, COL, id);

  await runTransaction(db, async (transaction) => {
    const current = await transaction.get(itemRef);
    const previousCategoryId = current.exists()
      ? (current.data().categoryId as string | null | undefined)
      : null;
    const nextCategoryId = item.categoryId || null;
    const previousCategoryRef = previousCategoryId
      ? doc(db, 'contentCategories', previousCategoryId)
      : null;
    const nextCategoryRef = nextCategoryId
      ? doc(db, 'contentCategories', nextCategoryId)
      : null;

    const previousCategory = previousCategoryRef && previousCategoryId !== nextCategoryId
      ? await transaction.get(previousCategoryRef)
      : null;
    const nextCategory = nextCategoryRef && previousCategoryId !== nextCategoryId
      ? await transaction.get(nextCategoryRef)
      : null;

    if (nextCategoryRef && previousCategoryId !== nextCategoryId && !nextCategory?.exists()) {
      throw new Error('CATEGORY_NOT_FOUND');
    }

    transaction.set(itemRef, { ...rest, categoryId: nextCategoryId, updatedAt: serverTimestamp() }, { merge: true });

    if (previousCategoryRef && previousCategory?.exists()) {
      transaction.update(previousCategoryRef, { linkedItemIds: arrayRemove(id) });
    }
    if (nextCategoryRef && nextCategory?.exists()) {
      transaction.update(nextCategoryRef, { linkedItemIds: arrayUnion(id) });
    }
  });
}

export async function deleteItem(id: string): Promise<void> {
  const itemRef = doc(db, COL, id);
  await runTransaction(db, async (transaction) => {
    const current = await transaction.get(itemRef);
    const categoryId = current.exists()
      ? (current.data().categoryId as string | null | undefined)
      : null;
    const categoryRef = categoryId ? doc(db, 'contentCategories', categoryId) : null;
    const category = categoryRef ? await transaction.get(categoryRef) : null;

    transaction.delete(itemRef);
    if (categoryRef && category?.exists()) {
      transaction.update(categoryRef, { linkedItemIds: arrayRemove(id) });
    }
  });
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
    imageUrl: '',
    categoryId: null,
    contentType: 'material',
    active: true,
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
