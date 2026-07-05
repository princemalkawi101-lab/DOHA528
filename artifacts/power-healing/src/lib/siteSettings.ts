import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const SETTINGS_DOC = doc(db, 'siteSettings', 'config');

export interface SiteSettings {
  aboutImageUrl?: string;
}

export async function fetchSiteSettings(): Promise<SiteSettings> {
  try {
    const snap = await getDoc(SETTINGS_DOC);
    return snap.exists() ? (snap.data() as SiteSettings) : {};
  } catch {
    return {};
  }
}

export async function saveSiteSettings(patch: Partial<SiteSettings>): Promise<void> {
  await setDoc(SETTINGS_DOC, patch, { merge: true });
}
