import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  writeBatch,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export type BuiltInContentKind = 'course' | 'workshop' | 'recorded' | 'individual-online' | 'vip';

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
  imageUrl?: string;
  builtInKind?: BuiltInContentKind;
};

const COL = 'contentCategories';

export const BUILT_IN_CONTENT_CATEGORIES: ContentCategory[] = [
  { id: 'built-in-course', builtInKind: 'course', titleAr: 'الكورسات', titleEn: 'Courses', descriptionAr: '', descriptionEn: '', icon: '', order: 0, active: true, imageUrl: '' },
  { id: 'built-in-workshop', builtInKind: 'workshop', titleAr: 'الورشات', titleEn: 'Workshops', descriptionAr: '', descriptionEn: '', icon: '', order: 1, active: true, imageUrl: '' },
  { id: 'built-in-recorded', builtInKind: 'recorded', titleAr: 'الجلسات المسجلة', titleEn: 'Recorded Sessions', descriptionAr: '', descriptionEn: '', icon: '', order: 2, active: true, imageUrl: '' },
  { id: 'built-in-individual-online', builtInKind: 'individual-online', titleAr: 'جلسة فردية أونلاين', titleEn: 'Online 1-on-1', descriptionAr: '', descriptionEn: '', icon: '', order: 3, active: true, imageUrl: '' },
  { id: 'built-in-vip', builtInKind: 'vip', titleAr: 'خدمة VIP', titleEn: 'VIP Service', descriptionAr: '', descriptionEn: '', icon: '', order: 4, active: true, imageUrl: '' },
];

export function mergeBuiltInContentCategories(categories: ContentCategory[]): ContentCategory[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const builtIns = BUILT_IN_CONTENT_CATEGORIES.map((defaults) => ({
    ...defaults,
    ...(byId.get(defaults.id) || {}),
    builtInKind: defaults.builtInKind,
  }));
  const custom = categories.filter((category) => !BUILT_IN_CONTENT_CATEGORIES.some((defaults) => defaults.id === category.id));
  return [...builtIns, ...custom].sort((a, b) => a.order - b.order);
}

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

export async function saveContentCategoryOrder(categories: ContentCategory[]): Promise<void> {
  const batch = writeBatch(db);
  categories.forEach((category, order) => {
    batch.set(doc(db, COL, category.id), {
      titleAr: category.titleAr,
      titleEn: category.titleEn,
      descriptionAr: category.descriptionAr || '',
      descriptionEn: category.descriptionEn || '',
      icon: category.icon || '',
      imageUrl: category.imageUrl || '',
      active: category.active,
      ...(category.builtInKind ? { builtInKind: category.builtInKind } : {}),
      order,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
  await batch.commit();
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
    imageUrl: '',
  };
}