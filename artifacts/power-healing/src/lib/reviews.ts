import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  query,
} from 'firebase/firestore';
import { db } from './firebase';

export type Review = {
  id: string;
  textAr: string;
  textEn: string;
  authorLabelAr?: string;
  authorLabelEn?: string;
  rating?: number;
  active: boolean;
  createdAt?: unknown;
};

const COL = 'reviews';

export async function fetchReviews(): Promise<Review[]> {
  try {
    const q = query(collection(db, COL), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
  } catch {
    try {
      const snap = await getDocs(collection(db, COL));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
    } catch {
      return [];
    }
  }
}

export async function saveReview(review: Review): Promise<void> {
  const { id, ...rest } = review;
  await setDoc(
    doc(db, COL, id),
    { ...rest, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function deleteReview(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export function newReviewTemplate(): Review {
  return {
    id: `rev-${Date.now()}`,
    textAr: '',
    textEn: '',
    authorLabelAr: '',
    authorLabelEn: '',
    rating: 5,
    active: true,
  };
}
