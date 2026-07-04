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

export type AdSliderConfig = { enabled: boolean };
const SETTINGS_DOC = doc(db, 'settings', 'adSlider');

export async function fetchAdSliderConfig(): Promise<AdSliderConfig> {
  try {
    const snap = await getDoc(SETTINGS_DOC);
    if (!snap.exists()) return { enabled: true };
    const data = snap.data() as Partial<AdSliderConfig>;
    return { enabled: data.enabled !== false };
  } catch {
    return { enabled: true };
  }
}

export async function saveAdSliderConfig(cfg: AdSliderConfig): Promise<void> {
  await setDoc(SETTINGS_DOC, { ...cfg, updatedAt: serverTimestamp() }, { merge: true });
}

export type AdStatus = 'available' | 'coming-soon';

export type AdSlide = {
  id: string;
  titleAr: string;
  titleEn: string;
  taglineAr: string;
  taglineEn: string;
  /** Either a remote URL or a base64 data: URL */
  imageUrl: string;
  status: AdStatus;
  /** Firestore item id this slide links to. Null/empty = no link. */
  linkedItemId: string | null;
  order: number;
};

const COL = 'adSlides';

export async function fetchAdSlides(): Promise<AdSlide[]> {
  try {
    const q = query(collection(db, COL), orderBy('order', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdSlide, 'id'>) }));
  } catch (e) {
    console.warn('fetchAdSlides failed', e);
    return [];
  }
}

export async function saveAdSlide(slide: AdSlide): Promise<void> {
  const { id, ...rest } = slide;
  await setDoc(
    doc(db, COL, id),
    { ...rest, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

export async function deleteAdSlide(id: string): Promise<void> {
  await deleteDoc(doc(db, COL, id));
}

export function newAdSlideTemplate(order: number): AdSlide {
  return {
    id: `ad-${Date.now()}`,
    titleAr: '',
    titleEn: '',
    taglineAr: '',
    taglineEn: '',
    imageUrl: '',
    status: 'coming-soon',
    linkedItemId: null,
    order,
  };
}

/** Default seed slides — used to populate the collection the first time. */
export const DEFAULT_AD_SLIDES: AdSlide[] = [
  {
    id: 'ad-money-flow',
    titleAr: 'مكالمة تدفق المال',
    titleEn: 'Money Flow Call',
    taglineAr: 'افتح قنوات الوفرة',
    taglineEn: 'Open Your Abundance Channels',
    imageUrl: 'https://images.unsplash.com/photo-1633158829585-23ba8f7c8caf?w=1200&q=80&auto=format&fit=crop',
    status: 'coming-soon',
    linkedItemId: null,
    order: 0,
  },
  {
    id: 'ad-earth-seductress',
    titleAr: 'كورس فاتنة الأرض',
    titleEn: 'Earth Seductress Course',
    taglineAr: 'أنوثتك ساحرة الأرض',
    taglineEn: 'Awaken Your Divine Feminine',
    imageUrl: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&q=80&auto=format&fit=crop',
    status: 'coming-soon',
    linkedItemId: null,
    order: 1,
  },
  {
    id: 'ad-healing-meditation',
    titleAr: 'كورس التأمل العلاجي',
    titleEn: 'Healing Meditation Course',
    taglineAr: 'تأمل عميق للشفاء الداخلي',
    taglineEn: 'Deep Inner Healing',
    imageUrl: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=1200&q=80&auto=format&fit=crop',
    status: 'coming-soon',
    linkedItemId: null,
    order: 2,
  },
  {
    id: 'ad-marriage',
    titleAr: 'كورس الزواج',
    titleEn: 'Marriage Course',
    taglineAr: 'انسجام الحياة الزوجية',
    taglineEn: 'Marriage Harmony',
    imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80&auto=format&fit=crop',
    status: 'coming-soon',
    linkedItemId: null,
    order: 3,
  },
];

/**
 * Resize/compress an image File into a base64 data URL.
 * Caps the longest edge at maxEdge px, encodes as JPEG quality 0.82.
 * Result is small enough to comfortably fit inside a Firestore doc.
 */
export async function fileToCompressedDataUrl(file: File, maxEdge = 1400): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('image load failed'));
    im.src = dataUrl;
  });
  const ratio = Math.min(1, maxEdge / Math.max(img.width, img.height));
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas ctx unavailable');
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.82);
}
