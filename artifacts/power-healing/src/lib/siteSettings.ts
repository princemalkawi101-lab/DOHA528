import { doc, getDoc, onSnapshot, runTransaction, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { TRANSLATIONS } from './translations';
import { SocialLink } from './socialLinks';

const SETTINGS_DOC = doc(db, 'siteSettings', 'config');

export interface SiteSettings {
  aboutImageUrl?: string;
  about?: AboutContent;
  certificates?: Certificate[];
  socialLinks?: SocialLink[];
  socialLinksRevision?: number;
}

export interface AboutContent {
  badgeAr: string;
  badgeEn: string;
  labelAr: string;
  labelEn: string;
  titleAr: string;
  titleEn: string;
  paragraph1Ar: string;
  paragraph1En: string;
  paragraph2Ar: string;
  paragraph2En: string;
  paragraph3Ar: string;
  paragraph3En: string;
  certificatesTitleAr: string;
  certificatesTitleEn: string;
  ctaAr: string;
  ctaEn: string;
}

export interface Certificate {
  id: string;
  titleAr: string;
  titleEn: string;
  order: number;
  active: boolean;
}

const tr = (key: string, lang: 'ar' | 'en') => TRANSLATIONS[key]?.[lang] ?? '';

export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  badgeAr: tr('about.badge', 'ar'),
  badgeEn: tr('about.badge', 'en'),
  labelAr: tr('about.label', 'ar'),
  labelEn: tr('about.label', 'en'),
  titleAr: tr('about.title', 'ar'),
  titleEn: tr('about.title', 'en'),
  paragraph1Ar: tr('about.p1', 'ar'),
  paragraph1En: tr('about.p1', 'en'),
  paragraph2Ar: tr('about.p2', 'ar'),
  paragraph2En: tr('about.p2', 'en'),
  paragraph3Ar: tr('about.p3', 'ar'),
  paragraph3En: tr('about.p3', 'en'),
  certificatesTitleAr: tr('about.certsTitle', 'ar'),
  certificatesTitleEn: tr('about.certsTitle', 'en'),
  ctaAr: tr('about.cta', 'ar'),
  ctaEn: tr('about.cta', 'en'),
};

export const DEFAULT_CERTIFICATES: Certificate[] = Array.from({ length: 7 }, (_, index) => ({
  id: `default-certificate-${index + 1}`,
  titleAr: tr(`about.cert${index + 1}`, 'ar'),
  titleEn: tr(`about.cert${index + 1}`, 'en'),
  order: index,
  active: true,
}));

export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const snap = await getDoc(SETTINGS_DOC);
    return snap.exists() ? (snap.data() as SiteSettings) : {};
  } catch {
    return {};
  }
}

export function subscribeSiteSettings(
  onChange: (settings: SiteSettings) => void,
  onError?: (error: Error) => void,
): () => void {
  return onSnapshot(
    SETTINGS_DOC,
    (snapshot) => onChange(snapshot.exists() ? (snapshot.data() as SiteSettings) : {}),
    (error) => onError?.(error),
  );
}

export async function saveSiteSettings(patch: Partial<SiteSettings>): Promise<void> {
  await setDoc(SETTINGS_DOC, patch, { merge: true });
}

export const SOCIAL_LINKS_CONFLICT = 'SOCIAL_LINKS_CONFLICT';

export async function saveSocialLinksWithRevision(
  socialLinks: SocialLink[],
  expectedRevision: number,
): Promise<number> {
  let nextRevision = expectedRevision + 1;

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(SETTINGS_DOC);
    const storedRevision = snapshot.exists() ? snapshot.data().socialLinksRevision : 0;
    const currentRevision = Number.isInteger(storedRevision) && storedRevision >= 0 ? storedRevision : 0;

    if (currentRevision !== expectedRevision) {
      throw new Error(SOCIAL_LINKS_CONFLICT);
    }

    nextRevision = currentRevision + 1;
    transaction.set(SETTINGS_DOC, { socialLinks, socialLinksRevision: nextRevision }, { merge: true });
  });

  return nextRevision;
}
