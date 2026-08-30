import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export type ContentCategory = {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  icon?: string;
  order: number;
  active: boolean;
  linkedItemIds?: string[];
};

const COL = 'contentCategories';

export async function fetchContentCategories(): Promise<ContentCategory[]> {
  try {
    const snap = await getDocs(query(collection(db, COL), orderBy('order', 'asc')));
    return snap.docs.map((entry) => ({
      id: entry.id,
      ...(entry.data() as Omit<ContentCategory, 'id'>),
    }));
  } catch {
    const snap = await getDocs(collection(db, COL));
    return snap.docs
      .map((entry) => ({ id: entry.id, ...(entry.data() as Omit<ContentCategory, 'id'>) }))
      .sort((a, b) => a.order - b.order);
  }
}

export async function saveContentCategory(category: ContentCategory): Promise<void> {
  const { id, linkedItemIds: _linkedItemIds, ...rest } = category;
  const categoryRef = doc(db, COL, id);
  await runTransaction(db, async (transaction) => {
    const current = await transaction.get(categoryRef);
    transaction.set(
      categoryRef,
      {
        ...rest,
        ...(!current.exists() ? { linkedItemIds: [] } : {}),
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  });
}

export async function deleteContentCategory(id: string): Promise<void> {
  const linkedItems = await getDocs(
    query(collection(db, 'items'), where('categoryId', '==', id), limit(1)),
  );
  if (!linkedItems.empty) {
    throw new Error('CATEGORY_HAS_ITEMS');
  }
  const categoryRef = doc(db, COL, id);
  await runTransaction(db, async (transaction) => {
    const category = await transaction.get(categoryRef);
    if (!category.exists()) return;
    const linkedItemIds = category.data().linkedItemIds as string[] | undefined;
    if (linkedItemIds?.length) {
      throw new Error('CATEGORY_HAS_ITEMS');
    }
    transaction.delete(categoryRef);
  });
}

export function newContentCategoryTemplate(order: number): ContentCategory {
  return {
    id: `category-${Date.now()}`,
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    icon: '✦',
    order,
    active: true,
    linkedItemIds: [],
  };
}