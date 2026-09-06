import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  runTransaction,
  setDoc,
} from 'firebase/firestore';

const projectId = 'demo-power-healing';
const testEnv = await initializeTestEnvironment({
  projectId,
  firestore: {
    rules: readFileSync('firestore.rules', 'utf8'),
  },
});

const socialLink = {
  id: 'instagram-main',
  platform: 'instagram',
  labelAr: 'إنستغرام',
  labelEn: 'Instagram',
  destination: 'https://instagram.com/example',
  order: 0,
  active: true,
};

try {
  const adminDb = testEnv
    .authenticatedContext('admin-user', { admin: true })
    .firestore();
  const regularDb = testEnv
    .authenticatedContext('regular-user', { email: 'person@example.com' })
    .firestore();
  const legacyAdminDb = testEnv
    .authenticatedContext('legacy-admin-user', {
      email: 'admin@dohahealing.com',
      email_verified: false,
    })
    .firestore();
  const publicDb = testEnv.unauthenticatedContext().firestore();
  const settingsRef = doc(adminDb, 'siteSettings', 'config');

  await assertSucceeds(setDoc(settingsRef, {
    socialLinks: Array.from({ length: 5 }, (_, index) => ({
      ...socialLink,
      id: `social-${index}`,
      order: index,
    })),
    socialLinksRevision: 1,
  }));

  await assertSucceeds(getDoc(doc(publicDb, 'siteSettings', 'config')));
  await assertSucceeds(setDoc(doc(legacyAdminDb, 'items', 'legacy-admin-check'), {
    titleAr: 'تحقق الأدمن',
    titleEn: 'Admin check',
    order: 0,
  }));

  await assertFails(setDoc(
    doc(regularDb, 'siteSettings', 'config'),
    { socialLinks: [socialLink], socialLinksRevision: 2 },
    { merge: true },
  ));

  await assertFails(setDoc(
    settingsRef,
    {
      socialLinks: [{ ...socialLink, platform: 'not-a-platform' }],
      socialLinksRevision: 2,
    },
    { merge: true },
  ));

  await assertFails(setDoc(
    settingsRef,
    {
      socialLinks: [socialLink],
      socialLinksRevision: 3,
    },
    { merge: true },
  ));

  await assertSucceeds(runTransaction(adminDb, async (transaction) => {
    const snapshot = await transaction.get(settingsRef);
    const currentRevision = snapshot.data()?.socialLinksRevision ?? 0;
    transaction.set(settingsRef, {
      socialLinks: [{ ...socialLink, labelEn: 'Instagram updated' }],
      socialLinksRevision: currentRevision + 1,
    }, { merge: true });
  }));

  const updated = await getDoc(settingsRef);
  if (updated.data()?.socialLinksRevision !== 2) {
    throw new Error('The social-links transaction did not increment the revision');
  }

  await assertSucceeds(setDoc(doc(adminDb, 'items', 'course-1'), {
    titleAr: 'دورة',
    titleEn: 'Course',
    order: 0,
  }));
  await assertSucceeds(getDoc(doc(publicDb, 'items', 'course-1')));
  await assertFails(setDoc(doc(regularDb, 'items', 'course-1'), {
    titleAr: 'تعديل غير مصرح',
  }, { merge: true }));

  await assertFails(setDoc(doc(publicDb, 'bookings', 'booking-1'), {
    itemId: 'course-1',
    itemTitleAr: 'دورة',
    itemTitleEn: 'Course',
    buyerUid: null,
    buyerEmail: null,
    name: 'Guest',
    description: '',
    whatsappCountryCode: '+962',
    whatsappNumber: '790000000',
    status: 'pending',
    createdAt: new Date(),
  }));
  await assertFails(getDoc(doc(publicDb, 'bookings', 'booking-1')));

  console.log('Firestore rules tests passed');
} finally {
  await testEnv.cleanup();
}