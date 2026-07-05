import { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { collection, getDocs, orderBy, query as fsQuery } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useApp, RATES } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { db, storage, auth } from '@/lib/firebase';
import {
  Item,
  ItemKind,
  fetchItems,
  saveItem,
  deleteItem,
  newItemTemplate,
  discountPercent,
} from '@/lib/items';
import { SEED_ITEMS } from '@/lib/seed-data';
import { BookingStatus, deleteBooking, updateBookingStatus } from '@/lib/bookings';
import {
  AdSlide,
  AdStatus,
  fetchAdSlides,
  saveAdSlide,
  deleteAdSlide,
  newAdSlideTemplate,
  fileToCompressedDataUrl,
  DEFAULT_AD_SLIDES,
  AdSliderConfig,
  fetchAdSliderConfig,
  saveAdSliderConfig,
} from '@/lib/adSlides';
import { fetchAllPurchases, deletePurchase, Purchase } from '@/lib/purchases';
import { Review, fetchReviews, saveReview, deleteReview, newReviewTemplate, seedHardcodedReviews, HARDCODED_TESTIMONIALS } from '@/lib/reviews';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const KIND_LABELS: Record<ItemKind, { ar: string; en: string }> = {
  course:              { ar: 'كورس مدفوع',                       en: 'Paid Course' },
  workshop:            { ar: 'ورشة مدفوعة',                      en: 'Paid Workshop' },
  recorded:            { ar: 'جلسة مسجلة مدفوعة',                 en: 'Paid Recorded Session' },
  'individual-online': { ar: 'جلسة خاصة فردية اون لاين',          en: 'Private 1-on-1 Online Session' },
  session:             { ar: 'جلسة عامة',                         en: 'General Session' },
  vip:                 { ar: 'خدمة VIP',                          en: 'VIP Service' },
};

const KIND_ORDER: ItemKind[] = ['course', 'workshop', 'recorded', 'individual-online', 'session', 'vip'];

export default function Admin() {
  const { t, lang } = useApp();
  const { user, isAdmin, loading, logout } = useAuth();
  const [, setLocation] = useLocation();

  const [items, setItems] = useState<Item[]>([]);
  const [bookings, setBookings] = useState<Array<Record<string, any>>>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [savedKey, setSavedKey] = useState<string | null>(null);
  const [activeKindTab, setActiveKindTab] = useState<ItemKind>('course');
  const [adSlides, setAdSlides] = useState<AdSlide[]>([]);
  const [loadingAds, setLoadingAds] = useState(true);
  const [adSavedId, setAdSavedId] = useState<string | null>(null);
  const [adUploading, setAdUploading] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingPurchases, setLoadingPurchases] = useState(true);
  const [subscriberView, setSubscriberView] = useState<'course' | 'workshop' | null>(null);
  const [adSliderCfg, setAdSliderCfg] = useState<AdSliderConfig>({ enabled: true });
  const [adSliderCfgSaving, setAdSliderCfgSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // ── These MUST stay above early returns to obey Rules of Hooks ──
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const [adminTab, setAdminTab] = useState<'products' | 'bookings' | 'settings' | 'ads' | 'reviews'>('products');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewSavedId, setReviewSavedId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) setLocation('/login');
  }, [loading, user, setLocation]);

  useEffect(() => {
    if (adminTab !== 'reviews') return;
    if (loadingReviews || reviews.length > 0) return;
    setLoadingReviews(true);
    fetchReviews().then((list) => { setReviews(list); setLoadingReviews(false); });
  }, [adminTab, loadingReviews, reviews.length]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchItems().then((list) => {
      setItems(list);
      setLoadingItems(false);
    });
    (async () => {
      try {
        const snap = await getDocs(fsQuery(collection(db, 'bookings'), orderBy('createdAt', 'desc')));
        setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch {}
    })();
    fetchAdSlides().then((list) => {
      setAdSlides(list);
      setLoadingAds(false);
    });
    fetchAllPurchases()
      .then(setPurchases)
      .catch(() => setPurchases([]))
      .finally(() => setLoadingPurchases(false));
    fetchAdSliderConfig().then(setAdSliderCfg).catch(() => {});
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-68px)] mt-[68px] flex items-center justify-center text-[rgba(255,255,255,0.6)]">…</div>
    );
  }

  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="min-h-[calc(100dvh-68px)] mt-[68px] flex items-center justify-center px-4 py-10">
        <div className="max-w-md bg-[rgba(30,14,56,0.75)] border border-[rgba(255,80,80,0.3)] rounded-2xl p-8 text-center">
          <h1 className="text-white text-xl font-black mb-3">{t('admin.noAccessTitle')}</h1>
          <p className="text-[rgba(255,255,255,0.7)] text-sm mb-4">{t('admin.noAccessMsg')}</p>
          <p className="text-[rgba(255,255,255,0.4)] text-xs mb-5" dir="ltr">{user.email}</p>
          <Link href="/" className="inline-block bg-[hsl(var(--g500))] text-[hsl(var(--p900))] font-bold py-2 px-5 rounded-lg">{t('auth.backHome')}</Link>
        </div>
      </div>
    );
  }

  const updateItem = (id: string, patch: Partial<Item>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const handleSaveItem = async (it: Item) => {
    await saveItem(it);
    setSavedKey(it.id);
    setTimeout(() => setSavedKey(null), 1800);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'تأكيد الحذف؟' : 'Confirm delete?')) return;
    await deleteItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAdd = (kind: ItemKind) => {
    const fresh = newItemTemplate(kind, items.length);
    setItems((prev) => [...prev, fresh]);
    setActiveKindTab(kind);
  };

  // ───── Ad slide handlers ─────
  const updateAd = (id: string, patch: Partial<AdSlide>) => {
    setAdSlides((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const handleSaveAd = async (s: AdSlide) => {
    try {
      await saveAdSlide(s);
      setAdSavedId(s.id);
      setTimeout(() => setAdSavedId(null), 1800);
    } catch (e) {
      console.error('saveAdSlide failed', e);
      alert(lang === 'ar' ? 'تعذّر الحفظ. الصورة قد تكون كبيرة جداً.' : 'Save failed. The image may be too large.');
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'حذف هذه البطاقة الإعلانية؟' : 'Delete this ad slide?')) return;
    try {
      await deleteAdSlide(id);
      setAdSlides((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert(lang === 'ar' ? 'تعذّر الحذف.' : 'Delete failed.');
    }
  };

  const handleAddAd = () => {
    const fresh = newAdSlideTemplate(adSlides.length);
    setAdSlides((prev) => [...prev, fresh]);
  };

  const handleSeedAds = async () => {
    if (!confirm(
      lang === 'ar'
        ? 'سيتم إضافة 4 بطاقات إعلانية افتراضية. متابعة؟'
        : 'This will add 4 default ad slides. Continue?'
    )) return;
    try {
      for (const s of DEFAULT_AD_SLIDES) {
        await saveAdSlide(s);
      }
      const fresh = await fetchAdSlides();
      setAdSlides(fresh);
    } catch (e) {
      console.error(e);
      alert(lang === 'ar' ? 'تعذّر التهيئة.' : 'Seeding failed.');
    }
  };

  const handleAdImageUpload = async (id: string, file: File) => {
    setAdUploading(id);
    try {
      const dataUrl = await fileToCompressedDataUrl(file, 1400);
      updateAd(id, { imageUrl: dataUrl });
    } catch (e) {
      console.error('image compression failed', e);
      alert(lang === 'ar' ? 'تعذّر تحميل الصورة.' : 'Image upload failed.');
    } finally {
      setAdUploading(null);
    }
  };

  const handleDeletePurchase = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل تريد حذف هذا السجل نهائياً؟ لا يمكن التراجع.' : 'Permanently delete this record? This cannot be undone.')) return;
    try {
      await deletePurchase(id);
      setPurchases((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert(lang === 'ar' ? 'تعذّر الحذف، حاول مرة أخرى.' : 'Delete failed, please try again.');
    }
  };

  const handleBookingDelete = async (id: string) => {
    if (!confirm(lang === 'ar' ? 'هل تريد حذف هذا الحجز نهائياً؟ لا يمكن التراجع.' : 'Permanently delete this booking? This cannot be undone.')) return;
    try {
      await deleteBooking(id);
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (e) {
      alert(lang === 'ar' ? 'تعذّر الحذف، حاول مرة أخرى.' : 'Delete failed, please try again.');
    }
  };

  const handleBookingStatus = async (id: string, status: BookingStatus) => {
    const confirmMsg =
      status === 'cancelled'
        ? lang === 'ar' ? 'هل تريد إلغاء هذا الحجز؟' : 'Cancel this booking?'
        : lang === 'ar' ? 'تأكيد إتمام الجلسة؟' : 'Mark as completed?';
    if (!confirm(confirmMsg)) return;
    try {
      await updateBookingStatus(id, status);
      setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status } : b)));
    } catch (e) {
      alert(lang === 'ar' ? 'تعذّر التحديث، حاول مرة أخرى.' : 'Update failed, please try again.');
    }
  };

  const handleAdSliderToggle = async () => {
    const next = { enabled: !adSliderCfg.enabled };
    setAdSliderCfg(next);
    setAdSliderCfgSaving(true);
    try { await saveAdSliderConfig(next); } catch {}
    setAdSliderCfgSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;
    setAvatarUploading(true);
    try {
      const canvas = document.createElement('canvas');
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
      const MAX = 256;
      const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.85));
      const currentUser = auth.currentUser;
      const path = `profile-pictures/${currentUser.uid}.jpg`;
      const fileRef = storageRef(storage, path);
      // Race uploadBytes against a 30 s timeout so the button is never permanently stuck
      await Promise.race([
        uploadBytes(fileRef, blob, { contentType: 'image/jpeg' }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Upload timed out – check Firebase Storage rules and bucket name')), 30_000),
        ),
      ]);
      const photoURL = await getDownloadURL(fileRef);
      await updateProfile(currentUser, { photoURL });
      window.dispatchEvent(new Event('profile-updated'));
    } catch (err) {
      console.error('Avatar upload error:', err);
      const msg = err instanceof Error ? err.message : '';
      const isTimeout = msg.includes('timed out');
      alert(
        lang === 'ar'
          ? isTimeout
            ? 'انتهت مهلة الرفع. تأكد من إعدادات Firebase Storage وقواعد الوصول.'
            : 'تعذّر رفع الصورة، حاول مرة أخرى.'
          : isTimeout
            ? 'Upload timed out. Check Firebase Storage rules and bucket settings.'
            : 'Photo upload failed, please try again.',
      );
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleImportSeed = async () => {
    const msg = lang === 'ar'
      ? `سيتم استيراد ${SEED_ITEMS.length} عنصر من ملف الدورات والكورسات. أي عنصر له نفس المعرّف سيتم استبداله. متابعة؟`
      : `About to import ${SEED_ITEMS.length} items from the courses file. Items with the same ID will be overwritten. Continue?`;
    if (!confirm(msg)) return;
    setImporting(true);
    let done = 0;
    let failed = 0;
    for (const it of SEED_ITEMS) {
      try {
        await saveItem(it);
        done++;
        setImportStatus(lang === 'ar' ? `جاري الاستيراد: ${done}/${SEED_ITEMS.length}` : `Importing: ${done}/${SEED_ITEMS.length}`);
      } catch (e) {
        failed++;
        console.error('seed import failed for', it.id, e);
      }
    }
    const fresh = await fetchItems();
    setItems(fresh);
    setImporting(false);
    setImportStatus(
      lang === 'ar'
        ? `✅ تم استيراد ${done} عنصر${failed ? ` (فشل ${failed})` : ''}`
        : `✅ Imported ${done} items${failed ? ` (${failed} failed)` : ''}`
    );
    setTimeout(() => setImportStatus(''), 5000);
  };

  return (
    <div className="min-h-[calc(100dvh-68px)] mt-[68px] px-4 py-10 bg-gradient-to-br from-[#1a0a2e] via-[#2a1444] to-[#1a0a2e]">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-4">
            {/* Profile picture */}
            <div className="relative shrink-0 group">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-[rgba(212,160,23,0.6)] bg-[rgba(255,255,255,0.08)] flex items-center justify-center">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-2xl font-black select-none">
                    {(user.displayName || user.email || 'A')[0].toUpperCase()}
                  </span>
                )}
              </div>
              {/* Upload overlay */}
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                title={lang === 'ar' ? 'تغيير الصورة' : 'Change photo'}
                className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-wait"
              >
                {avatarUploading ? (
                  <span className="text-white text-xs animate-pulse">…</span>
                ) : (
                  <span className="text-white text-lg">📷</span>
                )}
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
            <div>
              <h1 className="text-white text-3xl font-black">{t('admin.title')}</h1>
              <p className="text-[rgba(255,255,255,0.6)] text-sm mt-1">
                {t('admin.welcome')} {user.displayName || user.email}
              </p>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="text-[hsl(var(--g400))] text-xs mt-1 hover:underline disabled:opacity-50"
              >
                {avatarUploading
                  ? (lang === 'ar' ? 'جاري الرفع…' : 'Uploading…')
                  : (lang === 'ar' ? 'تغيير الصورة الشخصية' : 'Change profile photo')}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/" className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-[rgba(255,255,255,0.12)]">{t('admin.viewSite')}</Link>
            <button onClick={() => logout()} className="bg-[rgba(255,80,80,0.15)] border border-[rgba(255,80,80,0.3)] text-[#ffb0b0] text-sm font-semibold py-2 px-4 rounded-lg hover:bg-[rgba(255,80,80,0.25)]">{t('auth.logout')}</button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label={lang === 'ar' ? 'إجمالي العناصر' : 'Total Items'} value={items.length.toString()} />
          <StatCard label={lang === 'ar' ? 'الحجوزات' : 'Bookings'} value={bookings.length.toString()} />
          <StatCard label={lang === 'ar' ? 'التقييمات' : 'Reviews'} value={reviews.length.toString()} />
          <StatCard label={t('admin.stat.role')} value={t('admin.roleAdmin')} />
        </div>

        {/* ── Admin Tab Navigation ── */}
        <div className="flex flex-wrap gap-2 mb-6 pb-4 border-b border-[rgba(255,255,255,0.1)]">
          {([
            { key: 'products', ar: '📚 المحتوى', en: '📚 Products' },
            { key: 'bookings', ar: '📅 الحجوزات', en: '📅 Bookings' },
            { key: 'settings', ar: '⚙️ الإعدادات', en: '⚙️ Settings' },
            { key: 'ads', ar: '🎯 الإعلانات', en: '🎯 Banner Ads' },
            { key: 'reviews', ar: '⭐ التقييمات', en: '⭐ Reviews' },
          ] as { key: typeof adminTab; ar: string; en: string }[]).map((tb) => (
            <button
              key={tb.key}
              onClick={() => setAdminTab(tb.key)}
              className={`text-sm font-bold py-2.5 px-5 rounded-xl border transition-all cursor-pointer ${
                adminTab === tb.key
                  ? 'bg-gradient-to-br from-[hsl(var(--g500))] to-[hsl(var(--g400))] text-[hsl(var(--p900))] border-transparent shadow-[0_4px_16px_rgba(212,160,23,0.3)]'
                  : 'bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.75)] border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.08)]'
              }`}
            >
              {lang === 'ar' ? tb.ar : tb.en}
            </button>
          ))}
        </div>

        {/* ── Bookings Tab ── */}
        {adminTab === 'bookings' && <>
        <SubscriberSection
          lang={lang}
          purchases={purchases}
          loading={loadingPurchases}
          subscriberView={subscriberView}
          setSubscriberView={setSubscriberView}
          onDeletePurchase={handleDeletePurchase}
        />
        <AnalyticsSection lang={lang} purchases={purchases} loading={loadingPurchases} />
        </>}

        {/* ── Ads Tab ── */}
        {adminTab === 'ads' && <>
        {/* ───── Ad Slider Manager ───── */}
        <section className="bg-[rgba(30,14,56,0.75)] border border-[rgba(212,160,23,0.25)] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="text-white text-lg font-black flex items-center gap-3 flex-wrap">
              <span>{lang === 'ar' ? '🎯 إدارة شريط الإعلانات (الصفحة الرئيسية)' : '🎯 Ad Slider Manager (Home Hero)'}</span>
              <span className="text-[rgba(255,255,255,0.45)] text-xs font-medium">({adSlides.length})</span>
              {/* Master ON/OFF Toggle — controls visibility on the public site */}
              <button
                type="button"
                onClick={handleAdSliderToggle}
                disabled={adSliderCfgSaving}
                title={lang === 'ar' ? 'تشغيل/إيقاف ظهور صندوق الإعلانات للزبائن' : 'Show/hide the ads box on the public site'}
                className={`relative inline-flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-bold border transition-all disabled:opacity-50 ${
                  adSliderCfg.enabled
                    ? 'bg-[rgba(212,160,23,0.18)] border-[rgba(212,160,23,0.5)] text-[hsl(var(--g300))]'
                    : 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.55)]'
                }`}
              >
                <span className={`w-8 h-4 rounded-full relative transition-colors ${adSliderCfg.enabled ? 'bg-[hsl(var(--g500))]' : 'bg-[rgba(255,255,255,0.18)]'}`}>
                  <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-200 ${adSliderCfg.enabled ? (lang === 'ar' ? 'right-0.5' : 'left-[18px]') : (lang === 'ar' ? 'right-[18px]' : 'left-0.5')}`} />
                </span>
                {adSliderCfg.enabled
                  ? (lang === 'ar' ? 'ظاهر' : 'Visible')
                  : (lang === 'ar' ? 'مخفي' : 'Hidden')}
              </button>
            </h2>
            <div className="flex gap-2 flex-wrap">
              {adSlides.length === 0 && !loadingAds && (
                <button onClick={handleSeedAds} className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.18)] text-white font-semibold py-2 px-4 rounded-lg text-sm hover:bg-[rgba(255,255,255,0.14)]">
                  {lang === 'ar' ? '↺ تهيئة بـ 4 بطاقات افتراضية' : '↺ Seed 4 default slides'}
                </button>
              )}
              <button onClick={handleAddAd} className="bg-[hsl(var(--g500))] text-[hsl(var(--p900))] font-black py-2 px-4 rounded-lg text-sm hover:opacity-90">
                + {lang === 'ar' ? 'بطاقة إعلانية جديدة' : 'New Ad Slide'}
              </button>
            </div>
          </div>

          <p className="text-[rgba(255,255,255,0.55)] text-xs mb-4 leading-relaxed">
            {lang === 'ar'
              ? 'كل بطاقة تظهر بشكل دوّار في أعلى الصفحة الرئيسية. اربطيها بأحد العناصر في القائمة لتعمل كزر، أو اتركيها بحالة "قريباً" بدون رابط.'
              : 'Each slide shows in rotation at the top of the home page. Link it to a database item to make it clickable, or leave it as "Coming Soon" with no link.'}
          </p>

          {loadingAds ? (
            <p className="text-[rgba(255,255,255,0.5)] text-sm">{lang === 'ar' ? 'جاري التحميل…' : 'Loading…'}</p>
          ) : adSlides.length === 0 ? (
            <p className="text-[rgba(255,255,255,0.4)] text-sm italic">{lang === 'ar' ? 'لا توجد بطاقات إعلانية بعد.' : 'No ad slides yet.'}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {adSlides.map((s) => (
                <div key={s.id} className="bg-[rgba(0,0,0,0.25)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
                    {/* Image preview + upload */}
                    <div>
                      <div className="w-full aspect-[5/3] rounded-lg overflow-hidden bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.1)] mb-2 relative">
                        {s.imageUrl ? (
                          <img src={s.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[rgba(255,255,255,0.4)] text-xs">
                            {lang === 'ar' ? 'لا توجد صورة' : 'No image'}
                          </div>
                        )}
                      </div>
                      <label className="block">
                        <span className="block text-[rgba(255,255,255,0.6)] text-[0.72rem] font-semibold mb-1">
                          {lang === 'ar' ? 'تحميل صورة' : 'Upload image'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleAdImageUpload(s.id, f);
                            e.target.value = '';
                          }}
                          className="block w-full text-[rgba(255,255,255,0.7)] text-[0.72rem] file:bg-[hsl(var(--g500))] file:text-[hsl(var(--p900))] file:font-bold file:border-0 file:px-2 file:py-1 file:rounded file:cursor-pointer file:me-2"
                        />
                        {adUploading === s.id && (
                          <span className="text-[hsl(var(--g300))] text-[0.7rem] mt-1 block">
                            {lang === 'ar' ? 'جاري المعالجة…' : 'Processing…'}
                          </span>
                        )}
                      </label>
                      <Field label={lang === 'ar' ? 'أو رابط صورة' : 'Or image URL'}>
                        <input value={s.imageUrl.startsWith('data:') ? '' : s.imageUrl} onChange={(e) => updateAd(s.id, { imageUrl: e.target.value })} dir="ltr" placeholder="https://…" className="adm-input" />
                      </Field>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Field label={lang === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)'}>
                        <input value={s.titleAr} onChange={(e) => updateAd(s.id, { titleAr: e.target.value })} dir="rtl" className="adm-input" />
                      </Field>
                      <Field label={lang === 'ar' ? 'العنوان (إنجليزي)' : 'Title (English)'}>
                        <input value={s.titleEn} onChange={(e) => updateAd(s.id, { titleEn: e.target.value })} dir="ltr" className="adm-input" />
                      </Field>
                      <Field label={lang === 'ar' ? 'الوصف القصير (عربي)' : 'Tagline (Arabic)'}>
                        <input value={s.taglineAr} onChange={(e) => updateAd(s.id, { taglineAr: e.target.value })} dir="rtl" className="adm-input" />
                      </Field>
                      <Field label={lang === 'ar' ? 'الوصف القصير (إنجليزي)' : 'Tagline (English)'}>
                        <input value={s.taglineEn} onChange={(e) => updateAd(s.id, { taglineEn: e.target.value })} dir="ltr" className="adm-input" />
                      </Field>
                      <Field label={lang === 'ar' ? 'الحالة' : 'Status'}>
                        <select
                          value={s.status}
                          onChange={(e) => updateAd(s.id, { status: e.target.value as AdStatus })}
                          className="adm-input"
                          dir={lang === 'ar' ? 'rtl' : 'ltr'}
                        >
                          <option value="available" className="bg-[#1a0a2e]">{lang === 'ar' ? '✦ متاح الآن' : '✦ Available'}</option>
                          <option value="coming-soon" className="bg-[#1a0a2e]">{lang === 'ar' ? '◷ قريباً' : '◷ Coming Soon'}</option>
                        </select>
                      </Field>
                      <Field label={lang === 'ar' ? 'الترتيب' : 'Order'}>
                        <input type="number" value={s.order} onChange={(e) => updateAd(s.id, { order: Number(e.target.value) || 0 })} className="adm-input" />
                      </Field>
                      <div className="md:col-span-2">
                        <Field label={lang === 'ar' ? 'مرتبط بعنصر من قاعدة البيانات' : 'Linked Item (from database)'}>
                          <select
                            value={s.linkedItemId || ''}
                            onChange={(e) => updateAd(s.id, { linkedItemId: e.target.value || null })}
                            className="adm-input"
                            dir={lang === 'ar' ? 'rtl' : 'ltr'}
                          >
                            <option value="" className="bg-[#1a0a2e]">{lang === 'ar' ? '— لا يوجد رابط (قريباً) —' : '— No link (coming soon) —'}</option>
                            {KIND_ORDER.map((kind) => {
                              const list = items.filter((i) => i.kind === kind);
                              if (list.length === 0) return null;
                              return (
                                <optgroup key={kind} label={KIND_LABELS[kind][lang]} className="bg-[#1a0a2e]">
                                  {list.map((it) => (
                                    <option key={it.id} value={it.id} className="bg-[#1a0a2e]">
                                      {lang === 'ar' ? (it.titleAr || it.id) : (it.titleEn || it.id)}
                                    </option>
                                  ))}
                                </optgroup>
                              );
                            })}
                          </select>
                        </Field>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                    <button onClick={() => handleSaveAd(s)} className="bg-gradient-to-br from-[hsl(var(--g500))] to-[hsl(var(--g400))] text-[hsl(var(--p900))] font-black py-2 px-4 rounded-lg text-sm hover:opacity-90">
                      {lang === 'ar' ? 'حفظ' : 'Save'}
                    </button>
                    <button onClick={() => handleDeleteAd(s.id)} className="bg-[rgba(255,80,80,0.15)] border border-[rgba(255,80,80,0.3)] text-[#ffb0b0] font-semibold py-2 px-4 rounded-lg text-sm hover:bg-[rgba(255,80,80,0.25)]">
                      {lang === 'ar' ? 'حذف' : 'Delete'}
                    </button>
                    {adSavedId === s.id && <span className="text-[hsl(var(--g300))] text-sm font-semibold">{t('admin.saved')}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        </>}

        {/* ── Products Tab ── */}
        {adminTab === 'products' && <>
        {/* ───── Items manager — categorized tabs ───── */}
        <section className="bg-[rgba(30,14,56,0.75)] border border-[rgba(212,160,23,0.25)] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <h2 className="text-white text-lg font-black">
              {lang === 'ar' ? '📚 إدارة المحتوى' : '📚 Content Management'}
              <span className="ms-2 text-[rgba(255,255,255,0.45)] text-xs font-medium">({items.length})</span>
            </h2>
            <button onClick={() => handleAdd(activeKindTab)} className="bg-[hsl(var(--g500))] text-[hsl(var(--p900))] font-black py-2 px-4 rounded-lg text-sm hover:opacity-90">
              + {lang === 'ar' ? `إضافة في ${KIND_LABELS[activeKindTab][lang]}` : `Add to ${KIND_LABELS[activeKindTab][lang]}`}
            </button>
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2 mb-5 pb-3 border-b border-[rgba(255,255,255,0.08)]">
            {KIND_ORDER.map((kind) => {
              const count = items.filter((i) => i.kind === kind).length;
              const active = activeKindTab === kind;
              return (
                <button
                  key={kind}
                  onClick={() => setActiveKindTab(kind)}
                  className={`text-sm font-semibold py-2 px-3 rounded-lg border transition-colors ${
                    active
                      ? 'bg-[hsl(var(--g500))] text-[hsl(var(--p900))] border-[hsl(var(--g500))]'
                      : 'bg-[rgba(255,255,255,0.04)] text-[rgba(255,255,255,0.75)] border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.08)]'
                  }`}
                >
                  {KIND_LABELS[kind][lang]}
                  <span className={`ms-1.5 text-[0.7rem] font-black ${active ? 'opacity-70' : 'opacity-50'}`}>({count})</span>
                </button>
              );
            })}
          </div>

          {(() => {
            const list = items.filter((i) => i.kind === activeKindTab);
            if (loadingItems) {
              return <p className="text-[rgba(255,255,255,0.5)] text-sm">{lang === 'ar' ? 'جاري التحميل…' : 'Loading…'}</p>;
            }
            if (list.length === 0) {
              return <p className="text-[rgba(255,255,255,0.4)] text-sm italic">{lang === 'ar' ? 'لا توجد عناصر في هذه الفئة بعد.' : 'No items in this category yet.'}</p>;
            }
            return (
              <div className="flex flex-col gap-4">
                {list.map((it) => {
                  const pct = discountPercent(it);
                  return (
                    <div key={it.id} className="bg-[rgba(0,0,0,0.25)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <Field label={lang === 'ar' ? 'العنوان (عربي)' : 'Title (Arabic)'}>
                          <input value={it.titleAr} onChange={(e) => updateItem(it.id, { titleAr: e.target.value })} dir="rtl" className="adm-input" />
                        </Field>
                        <Field label={lang === 'ar' ? 'العنوان (إنجليزي)' : 'Title (English)'}>
                          <input value={it.titleEn} onChange={(e) => updateItem(it.id, { titleEn: e.target.value })} dir="ltr" className="adm-input" />
                        </Field>
                        <Field label={lang === 'ar' ? 'الوصف (عربي)' : 'Description (Arabic)'}>
                          <textarea value={it.descAr} onChange={(e) => updateItem(it.id, { descAr: e.target.value })} dir="rtl" rows={2} className="adm-input" />
                        </Field>
                        <Field label={lang === 'ar' ? 'الوصف (إنجليزي)' : 'Description (English)'}>
                          <textarea value={it.descEn} onChange={(e) => updateItem(it.id, { descEn: e.target.value })} dir="ltr" rows={2} className="adm-input" />
                        </Field>
                        <Field label={lang === 'ar' ? 'أيقونة (إيموجي)' : 'Icon (emoji)'}>
                          <input value={it.icon} onChange={(e) => updateItem(it.id, { icon: e.target.value })} dir="ltr" className="adm-input" />
                        </Field>
                        <Field label={lang === 'ar' ? 'الترتيب' : 'Order'}>
                          <input type="number" value={it.order} onChange={(e) => updateItem(it.id, { order: Number(e.target.value) || 0 })} className="adm-input" />
                        </Field>
                        <Field label={lang === 'ar' ? 'السعر الأصلي ($)' : 'Original Price (USD)'}>
                          <PriceInputUSD
                            jodValue={it.originalPriceJod}
                            onChangeJod={(jod) => updateItem(it.id, { originalPriceJod: jod ?? 0 })}
                            allowEmpty={false}
                          />
                        </Field>
                        <Field label={lang === 'ar' ? 'سعر الخصم ($) — اختياري' : 'Discount Price (USD) — optional'}>
                          <PriceInputUSD
                            jodValue={it.discountPriceJod}
                            onChangeJod={(jod) => updateItem(it.id, { discountPriceJod: jod })}
                            allowEmpty={true}
                            placeholder={lang === 'ar' ? 'لا يوجد خصم' : 'No discount'}
                          />
                        </Field>
                        <Field label={lang === 'ar' ? '🔒 رابط تلجرام — الاشتراك العادي' : '🔒 Telegram Link — Standard'}>
                          <input
                            value={it.telegramStandardLink ?? it.telegramLink ?? ''}
                            onChange={(e) => updateItem(it.id, { telegramStandardLink: e.target.value, telegramLink: e.target.value })}
                            dir="ltr"
                            placeholder="https://t.me/channel_standard"
                            className="adm-input"
                          />
                        </Field>

                        <Field label={lang === 'ar' ? '👑 رابط تلجرام — اشتراك VIP (يظهر بعد الدفع)' : '👑 Telegram Link — VIP (shown after payment)'}>
                          <input
                            value={it.telegramVipLink ?? ''}
                            onChange={(e) => updateItem(it.id, { telegramVipLink: e.target.value })}
                            dir="ltr"
                            placeholder="https://t.me/channel_vip"
                            className="adm-input"
                          />
                        </Field>

                        {/* ── VIP Pricing ── */}
                        <Field label={lang === 'ar' ? '👑 سعر VIP ($) — اختياري' : '👑 VIP Price (USD) — optional'}>
                          <PriceInputUSD
                            jodValue={it.vipPriceJod ?? null}
                            onChangeJod={(jod) => updateItem(it.id, { vipPriceJod: jod })}
                            allowEmpty={true}
                            placeholder={lang === 'ar' ? 'لا يوجد سعر VIP' : 'No VIP price'}
                          />
                        </Field>

                        <Field label={lang === 'ar' ? '👑 تفعيل خيار VIP للعملاء' : '👑 Enable VIP Option for Customers'}>
                          <label className="flex items-center gap-3 cursor-pointer mt-1">
                            <span className="relative inline-flex items-center shrink-0">
                              <input
                                type="checkbox"
                                checked={it.vipEnabled ?? false}
                                onChange={(e) => updateItem(it.id, { vipEnabled: e.target.checked })}
                                className="sr-only"
                              />
                              <span className={`w-10 h-5 rounded-full transition-colors ${it.vipEnabled ? 'bg-[hsl(var(--g500))]' : 'bg-[rgba(255,255,255,0.18)]'}`}>
                                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${it.vipEnabled ? 'left-[22px]' : 'left-0.5'}`} />
                              </span>
                            </span>
                            <span className="text-[rgba(255,255,255,0.7)] text-sm">
                              {it.vipEnabled
                                ? (lang === 'ar' ? 'مفعّل — سعر VIP ظاهر للعملاء' : 'Enabled — VIP price shown to customers')
                                : (lang === 'ar' ? 'معطّل — سعر VIP مخفي' : 'Disabled — VIP price hidden')}
                            </span>
                          </label>
                        </Field>
                      </div>

                      {/* ── Direct product link ── */}
                      <div className="mt-4 mb-2">
                        <p className="text-[rgba(255,255,255,0.45)] text-[0.7rem] font-semibold mb-1.5">
                          {lang === 'ar' ? '🔗 الرابط المباشر لهذه المادة' : '🔗 Direct link to this product'}
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            readOnly
                            dir="ltr"
                            value={`https://dohasoulcare.com/product?id=${it.id}`}
                            className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-1.5 text-[rgba(255,255,255,0.55)] text-xs font-mono outline-none select-all cursor-text"
                            onFocus={(e) => e.target.select()}
                          />
                          <button
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(`https://dohasoulcare.com/product?id=${it.id}`)}
                            className="shrink-0 bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.14)] text-[rgba(255,255,255,0.65)] text-xs font-bold py-1.5 px-3 rounded-lg hover:bg-[rgba(255,255,255,0.14)] transition-colors cursor-pointer"
                          >
                            {lang === 'ar' ? 'نسخ' : 'Copy'}
                          </button>
                        </div>
                      </div>

                      {pct !== null && (
                        <div className="mb-3 text-[hsl(var(--g300))] text-xs font-bold">
                          {lang === 'ar' ? `خصم ${pct}%` : `${pct}% off`}
                        </div>
                      )}

                      <div className="flex items-center gap-2 flex-wrap">
                        <button onClick={() => handleSaveItem(it)} className="bg-gradient-to-br from-[hsl(var(--g500))] to-[hsl(var(--g400))] text-[hsl(var(--p900))] font-black py-2 px-4 rounded-lg text-sm hover:opacity-90">
                          {lang === 'ar' ? 'حفظ' : 'Save'}
                        </button>
                        <button onClick={() => handleDelete(it.id)} className="bg-[rgba(255,80,80,0.15)] border border-[rgba(255,80,80,0.3)] text-[#ffb0b0] font-semibold py-2 px-4 rounded-lg text-sm hover:bg-[rgba(255,80,80,0.25)]">
                          {lang === 'ar' ? 'حذف' : 'Delete'}
                        </button>
                        {savedKey === it.id && <span className="text-[hsl(var(--g300))] text-sm font-semibold">{t('admin.saved')}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </section>
        </>}

        {/* ── Bookings Tab (continued) ── */}
        {adminTab === 'bookings' && <>
        <section className="bg-[rgba(30,14,56,0.75)] border border-[rgba(212,160,23,0.25)] rounded-2xl p-6 mb-6">
          <h2 className="text-white text-lg font-black mb-4">
            {lang === 'ar' ? '📅 حجوزات الجلسات الفردية' : '📅 Individual Session Bookings'}
            <span className="ms-2 text-[rgba(255,255,255,0.45)] text-xs font-medium">({bookings.length})</span>
          </h2>
          {bookings.length === 0 ? (
            <p className="text-[rgba(255,255,255,0.4)] text-sm italic">
              {lang === 'ar' ? 'لا توجد حجوزات بعد.' : 'No bookings yet.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-white">
                <thead className="text-[rgba(255,255,255,0.5)] text-xs uppercase">
                  <tr>
                    <th className="py-2 px-2 text-start">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                    <th className="py-2 px-2 text-start">{lang === 'ar' ? 'الاسم' : 'Name'}</th>
                    <th className="py-2 px-2 text-start">{lang === 'ar' ? 'الإيميل' : 'Email'}</th>
                    <th className="py-2 px-2 text-start">{lang === 'ar' ? 'الجلسة' : 'Session'}</th>
                    <th className="py-2 px-2 text-start">{lang === 'ar' ? 'التاريخ والوقت' : 'Date & Time'}</th>
                    <th className="py-2 px-2 text-start">{lang === 'ar' ? 'واتساب' : 'WhatsApp'}</th>
                    <th className="py-2 px-2 text-start">{lang === 'ar' ? 'الوصف' : 'Description'}</th>
                    <th className="py-2 px-2 text-start">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => {
                    const status: BookingStatus = (b.status as BookingStatus) || 'pending';
                    const statusStyle: Record<BookingStatus, { bg: string; color: string; ar: string; en: string }> = {
                      pending:   { bg: 'rgba(212,160,23,0.18)', color: '#ffd87a', ar: 'قيد الانتظار', en: 'Pending' },
                      completed: { bg: 'rgba(56,200,120,0.18)', color: '#7cf2a3', ar: 'تم الإتمام',   en: 'Completed' },
                      cancelled: { bg: 'rgba(255,80,80,0.15)',  color: '#ffb0b0', ar: 'ملغي',         en: 'Cancelled' },
                    };
                    const s = statusStyle[status];
                    const wa = `${b.whatsappCountryCode || ''}${(b.whatsappNumber || '').replace(/\D/g, '')}`;
                    return (
                      <tr key={b.id} className="border-t border-[rgba(255,255,255,0.08)] align-top">
                        <td className="py-3 px-2">
                          <span
                            style={{ backgroundColor: s.bg, color: s.color }}
                            className="inline-block text-[0.7rem] font-black py-1 px-2.5 rounded-full whitespace-nowrap"
                          >
                            {lang === 'ar' ? s.ar : s.en}
                          </span>
                        </td>
                        <td className="py-3 px-2 font-semibold">{b.name}</td>
                        <td className="py-3 px-2 text-[rgba(255,255,255,0.7)]" dir="ltr">{b.buyerEmail || '—'}</td>
                        <td className="py-3 px-2">{lang === 'ar' ? b.itemTitleAr : b.itemTitleEn}</td>
                        <td className="py-3 px-2" dir="ltr">{b.sessionDate} {b.sessionTime}</td>
                        <td className="py-3 px-2" dir="ltr">
                          {wa ? (
                            <a
                              href={`https://wa.me/${wa}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[hsl(var(--g300))] hover:underline"
                            >
                              {b.whatsappCountryCode} {b.whatsappNumber}
                            </a>
                          ) : '—'}
                        </td>
                        <td className="py-3 px-2 max-w-xs whitespace-pre-wrap text-[rgba(255,255,255,0.75)]">{b.description}</td>
                        <td className="py-3 px-2">
                          <div className="flex flex-col gap-1.5 min-w-[140px]">
                            <button
                              onClick={() => handleBookingDelete(b.id)}
                              title={lang === 'ar' ? 'حذف الحجز نهائياً' : 'Delete booking permanently'}
                              aria-label={lang === 'ar' ? 'حذف الحجز' : 'Delete booking'}
                              style={{ backgroundColor: 'rgba(255,80,80,0.10)', color: '#ff9494', borderColor: 'rgba(255,80,80,0.45)' }}
                              className="self-end inline-flex items-center justify-center gap-1 text-[0.72rem] font-bold py-1.5 px-2 rounded-md border whitespace-nowrap hover:opacity-90 cursor-pointer"
                            >
                              <span aria-hidden>🗑</span>
                              <span>{lang === 'ar' ? 'حذف' : 'Delete'}</span>
                            </button>
                            {status !== 'completed' && (
                              <button
                                onClick={() => handleBookingStatus(b.id, 'completed')}
                                style={{ backgroundColor: 'rgba(56,200,120,0.18)', color: '#7cf2a3', borderColor: 'rgba(56,200,120,0.35)' }}
                                className="text-[0.72rem] font-bold py-1.5 px-2 rounded-md border whitespace-nowrap hover:opacity-90 cursor-pointer"
                              >
                                {lang === 'ar' ? '✓ إتمام الجلسة' : '✓ Mark Completed'}
                              </button>
                            )}
                            {status !== 'cancelled' && (
                              <button
                                onClick={() => handleBookingStatus(b.id, 'cancelled')}
                                style={{ backgroundColor: 'rgba(255,80,80,0.15)', color: '#ffb0b0', borderColor: 'rgba(255,80,80,0.35)' }}
                                className="text-[0.72rem] font-bold py-1.5 px-2 rounded-md border whitespace-nowrap hover:opacity-90 cursor-pointer"
                              >
                                {lang === 'ar' ? '✕ إلغاء الحجز' : '✕ Cancel'}
                              </button>
                            )}
                            {(status === 'completed' || status === 'cancelled') && (
                              <button
                                onClick={() => handleBookingStatus(b.id, 'pending')}
                                style={{ backgroundColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)', borderColor: 'rgba(255,255,255,0.18)' }}
                                className="text-[0.72rem] font-semibold py-1.5 px-2 rounded-md border whitespace-nowrap hover:opacity-90 cursor-pointer"
                              >
                                {lang === 'ar' ? '↺ إعادة لقيد الانتظار' : '↺ Reopen'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
        </>}

        {/* ── Settings Tab ── */}
        {adminTab === 'settings' && <>
        <section className="bg-[rgba(30,14,56,0.75)] border border-[rgba(212,160,23,0.25)] rounded-2xl p-6 mb-6">
          <h2 className="text-white text-lg font-black mb-5">
            {lang === 'ar' ? '👤 إعدادات الملف الشخصي' : '👤 Profile Settings'}
          </h2>
          <div className="flex items-center gap-5 flex-wrap">
            <div className="relative w-16 h-16 shrink-0">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-[rgba(212,160,23,0.5)]" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--p600))] to-[hsl(var(--p400))] flex items-center justify-center text-white text-2xl font-black">
                  {(user.displayName || user.email || '?')[0].toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute bottom-0 end-0 w-7 h-7 rounded-full bg-[hsl(var(--g500))] flex items-center justify-center border-2 border-[#1a0a2e] hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                {avatarUploading ? <span className="text-white text-[0.5rem] animate-pulse">…</span> : <span className="text-white text-sm">📷</span>}
              </button>
            </div>
            <div>
              <p className="text-white font-bold">{user.displayName || user.email}</p>
              <p className="text-[rgba(255,255,255,0.5)] text-sm mt-0.5">{user.email}</p>
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="text-[hsl(var(--g400))] text-xs mt-1.5 hover:underline disabled:opacity-50 cursor-pointer"
              >
                {avatarUploading ? (lang === 'ar' ? 'جاري الرفع…' : 'Uploading…') : (lang === 'ar' ? 'تغيير الصورة الشخصية' : 'Change profile photo')}
              </button>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-[rgba(212,160,23,0.18)] to-[rgba(90,45,145,0.18)] border-2 border-[rgba(212,160,23,0.45)] rounded-2xl p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[200px]">
              <h2 className="text-white text-lg font-black mb-1">
                {lang === 'ar' ? '📥 استيراد العناصر من الملف' : '📥 Import Items From File'}
              </h2>
              <p className="text-[rgba(255,255,255,0.75)] text-sm">
                {lang === 'ar'
                  ? `تعبئة قاعدة البيانات بـ ${SEED_ITEMS.length} عنصر (8 كورسات + 11 ورشة + 6 جلسات مسجلة + 15 جلسة فردية) من ملف الدورات والكورسات. الأسعار محوّلة من الدولار إلى الدينار الأردني.`
                  : `Populate the database with ${SEED_ITEMS.length} items (8 courses + 11 workshops + 6 recorded + 15 individual sessions) from the courses file. Prices converted from USD to JOD.`}
              </p>
              {importStatus && (
                <p className="text-[hsl(var(--g500))] text-sm font-bold mt-2">{importStatus}</p>
              )}
            </div>
            <button
              onClick={handleImportSeed}
              disabled={importing}
              className="bg-gradient-to-br from-[hsl(var(--g600))] to-[hsl(var(--g400))] text-[hsl(var(--p900))] font-black text-sm py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              {importing
                ? lang === 'ar' ? 'جاري الاستيراد...' : 'Importing...'
                : lang === 'ar' ? `استيراد ${SEED_ITEMS.length} عنصر` : `Import ${SEED_ITEMS.length} Items`}
            </button>
          </div>
        </section>
        </>}

        {/* ── Reviews Tab ── */}
        {adminTab === 'reviews' && <>
        <section className="bg-[rgba(30,14,56,0.75)] border border-[rgba(212,160,23,0.25)] rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <h2 className="text-white text-lg font-black">
              {lang === 'ar' ? '⭐ إدارة التقييمات والشهادات' : '⭐ Reviews & Testimonials'}
              <span className="ms-2 text-[rgba(255,255,255,0.45)] text-xs font-medium">({reviews.length})</span>
            </h2>
            <button
              onClick={() => {
                const r = newReviewTemplate();
                setReviews((prev) => [r, ...prev]);
              }}
              className="bg-[hsl(var(--g500))] text-[hsl(var(--p900))] font-black py-2 px-4 rounded-lg text-sm hover:opacity-90 cursor-pointer"
            >
              + {lang === 'ar' ? 'تقييم جديد' : 'Add Review'}
            </button>
          </div>
          {loadingReviews ? (
            <p className="text-[rgba(255,255,255,0.5)] text-sm">{lang === 'ar' ? 'جاري التحميل…' : 'Loading…'}</p>
          ) : reviews.length === 0 ? (
            <div className="flex flex-col items-start gap-4">
              <p className="text-[rgba(255,255,255,0.4)] text-sm italic">{lang === 'ar' ? 'لا توجد تقييمات بعد.' : 'No reviews yet.'}</p>
              <button
                onClick={async () => {
                  if (!confirm(lang === 'ar'
                    ? `استيراد ${HARDCODED_TESTIMONIALS.length} تقييم من الصفحة الرئيسية إلى قاعدة البيانات؟`
                    : `Import ${HARDCODED_TESTIMONIALS.length} existing reviews from the homepage into the database?`)) return;
                  setLoadingReviews(true);
                  try {
                    await seedHardcodedReviews();
                    const list = await fetchReviews();
                    setReviews(list);
                  } finally {
                    setLoadingReviews(false);
                  }
                }}
                className="bg-[rgba(212,160,23,0.15)] border border-[rgba(212,160,23,0.4)] text-[hsl(var(--g300))] font-semibold py-2 px-4 rounded-lg text-sm hover:bg-[rgba(212,160,23,0.25)] cursor-pointer"
              >
                📥 {lang === 'ar' ? `استيراد ${HARDCODED_TESTIMONIALS.length} تقييم من الصفحة الرئيسية` : `Import ${HARDCODED_TESTIMONIALS.length} reviews from homepage`}
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reviews.map((rev) => (
                <div key={rev.id} className="bg-[rgba(0,0,0,0.25)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <Field label={lang === 'ar' ? 'نص التقييم (عربي)' : 'Review Text (Arabic)'}>
                      <textarea
                        value={rev.textAr}
                        onChange={(e) => setReviews((prev) => prev.map((r) => r.id === rev.id ? { ...r, textAr: e.target.value } : r))}
                        dir="rtl" rows={3} className="adm-input"
                      />
                    </Field>
                    <Field label={lang === 'ar' ? 'نص التقييم (إنجليزي)' : 'Review Text (English)'}>
                      <textarea
                        value={rev.textEn}
                        onChange={(e) => setReviews((prev) => prev.map((r) => r.id === rev.id ? { ...r, textEn: e.target.value } : r))}
                        dir="ltr" rows={3} className="adm-input"
                      />
                    </Field>
                    <Field label={lang === 'ar' ? 'اسم العميل (عربي)' : 'Author (Arabic)'}>
                      <input
                        value={rev.authorLabelAr || ''}
                        onChange={(e) => setReviews((prev) => prev.map((r) => r.id === rev.id ? { ...r, authorLabelAr: e.target.value } : r))}
                        dir="rtl" className="adm-input"
                        placeholder={lang === 'ar' ? 'مثال: أم عبدالله، السعودية' : 'e.g. Sarah, UAE'}
                      />
                    </Field>
                    <Field label={lang === 'ar' ? 'اسم العميل (إنجليزي)' : 'Author (English)'}>
                      <input
                        value={rev.authorLabelEn || ''}
                        onChange={(e) => setReviews((prev) => prev.map((r) => r.id === rev.id ? { ...r, authorLabelEn: e.target.value } : r))}
                        dir="ltr" className="adm-input"
                        placeholder="e.g. Sarah, UAE"
                      />
                    </Field>
                    <Field label={lang === 'ar' ? 'التقييم (1–5 نجوم)' : 'Rating (1–5 stars)'}>
                      <input
                        type="number" min={1} max={5}
                        value={rev.rating ?? 5}
                        onChange={(e) => setReviews((prev) => prev.map((r) => r.id === rev.id ? { ...r, rating: Math.min(5, Math.max(1, Number(e.target.value))) } : r))}
                        className="adm-input"
                      />
                    </Field>
                    <Field label={lang === 'ar' ? 'الحالة' : 'Status'}>
                      <label className="flex items-center gap-3 cursor-pointer mt-1">
                        <span className="relative inline-flex items-center shrink-0">
                          <input
                            type="checkbox"
                            checked={rev.active}
                            onChange={(e) => setReviews((prev) => prev.map((r) => r.id === rev.id ? { ...r, active: e.target.checked } : r))}
                            className="sr-only"
                          />
                          <span className={`w-10 h-5 rounded-full transition-colors ${rev.active ? 'bg-[hsl(var(--g500))]' : 'bg-[rgba(255,255,255,0.18)]'}`}>
                            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${rev.active ? 'left-[22px]' : 'left-0.5'}`} />
                          </span>
                        </span>
                        <span className="text-[rgba(255,255,255,0.7)] text-sm">
                          {rev.active ? (lang === 'ar' ? 'ظاهر للزوار' : 'Visible to visitors') : (lang === 'ar' ? 'مخفي' : 'Hidden')}
                        </span>
                      </label>
                    </Field>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={async () => {
                        await saveReview(rev);
                        setReviewSavedId(rev.id);
                        setTimeout(() => setReviewSavedId(null), 2000);
                      }}
                      className="bg-gradient-to-br from-[hsl(var(--g500))] to-[hsl(var(--g400))] text-[hsl(var(--p900))] font-black py-2 px-4 rounded-lg text-sm hover:opacity-90 cursor-pointer"
                    >
                      {lang === 'ar' ? 'حفظ' : 'Save'}
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(lang === 'ar' ? 'حذف هذا التقييم نهائياً؟' : 'Delete this review permanently?')) return;
                        await deleteReview(rev.id);
                        setReviews((prev) => prev.filter((r) => r.id !== rev.id));
                      }}
                      className="bg-[rgba(255,80,80,0.15)] border border-[rgba(255,80,80,0.3)] text-[#ffb0b0] font-semibold py-2 px-4 rounded-lg text-sm hover:bg-[rgba(255,80,80,0.25)] cursor-pointer"
                    >
                      {lang === 'ar' ? 'حذف' : 'Delete'}
                    </button>
                    {reviewSavedId === rev.id && (
                      <span className="text-[hsl(var(--g300))] text-sm font-semibold">{t('admin.saved')}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        </>}

      </div>

      <style>{`
        .adm-input { width: 100%; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 8px 10px; color: white; font-size: 0.88rem; outline: none; }
        .adm-input:focus { border-color: hsl(var(--g500)); }
      `}</style>
    </div>
  );
}

function SubscriberSection({
  lang,
  purchases,
  loading,
  subscriberView,
  setSubscriberView,
  onDeletePurchase,
}: {
  lang: string;
  purchases: Purchase[];
  loading: boolean;
  subscriberView: 'course' | 'workshop' | null;
  setSubscriberView: (v: 'course' | 'workshop' | null) => void;
  onDeletePurchase: (id: string) => void;
}) {
  const courseCount = purchases.filter((p) => p.itemKind === 'course').length;
  const workshopCount = purchases.filter((p) => p.itemKind === 'workshop').length;
  const totalCount = purchases.length;

  const tableData = subscriberView ? purchases.filter((p) => p.itemKind === subscriberView) : purchases;

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '—';
    }
  };

  const KIND_LABEL: Record<string, { ar: string; en: string }> = {
    course: { ar: 'كورس', en: 'Course' },
    workshop: { ar: 'ورشة', en: 'Workshop' },
    recorded: { ar: 'مسجلة', en: 'Recorded' },
    'individual-online': { ar: 'فردية أونلاين', en: '1-on-1 Online' },
  };

  return (
    <section className="bg-[rgba(30,14,56,0.75)] border border-[rgba(212,160,23,0.25)] rounded-2xl p-6 mb-6">
      <h2 className="text-white text-lg font-black mb-5">
        {lang === 'ar' ? '👥 إدارة المشتركين' : '👥 Subscriber Management'}
      </h2>

      {loading ? (
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="flex-1 h-24 rounded-xl bg-[rgba(255,255,255,0.05)] animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Total */}
            <button
              onClick={() => setSubscriberView(null)}
              className={`rounded-xl p-5 border text-start transition-all hover:-translate-y-0.5 ${
                subscriberView === null
                  ? 'bg-gradient-to-br from-[rgba(212,160,23,0.25)] to-[rgba(90,45,145,0.2)] border-[rgba(212,160,23,0.55)] shadow-[0_4px_20px_rgba(212,160,23,0.15)]'
                  : 'bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.1)] hover:border-[rgba(212,160,23,0.3)]'
              }`}
            >
              <div className="text-[rgba(255,255,255,0.5)] text-xs uppercase tracking-wider mb-2">
                {lang === 'ar' ? 'إجمالي الطلبات' : 'Total Orders'}
              </div>
              <div className="text-white text-3xl font-black">{totalCount}</div>
              <div className="text-[rgba(255,255,255,0.4)] text-xs mt-1">
                {lang === 'ar' ? 'انقر لعرض الكل' : 'Click to view all'}
              </div>
            </button>

            {/* Courses */}
            <button
              onClick={() => setSubscriberView(subscriberView === 'course' ? null : 'course')}
              className={`rounded-xl p-5 border text-start transition-all hover:-translate-y-0.5 ${
                subscriberView === 'course'
                  ? 'bg-gradient-to-br from-[rgba(90,45,145,0.35)] to-[rgba(90,45,145,0.15)] border-[hsl(var(--p500))] shadow-[0_4px_20px_rgba(90,45,145,0.2)]'
                  : 'bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.1)] hover:border-[hsl(var(--p500))]'
              }`}
            >
              <div className="text-[rgba(255,255,255,0.5)] text-xs uppercase tracking-wider mb-2">
                {lang === 'ar' ? 'المسجلن بالكورسات' : 'Course Subscribers'}
              </div>
              <div className="text-[hsl(var(--p300))] text-3xl font-black">{courseCount}</div>
              <div className="text-[rgba(255,255,255,0.4)] text-xs mt-1">
                {lang === 'ar' ? 'انقر لعرض التفاصيل' : 'Click to view details'}
              </div>
            </button>

            {/* Workshops */}
            <button
              onClick={() => setSubscriberView(subscriberView === 'workshop' ? null : 'workshop')}
              className={`rounded-xl p-5 border text-start transition-all hover:-translate-y-0.5 ${
                subscriberView === 'workshop'
                  ? 'bg-gradient-to-br from-[rgba(212,160,23,0.25)] to-[rgba(212,160,23,0.08)] border-[hsl(var(--g500))] shadow-[0_4px_20px_rgba(212,160,23,0.15)]'
                  : 'bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.1)] hover:border-[rgba(212,160,23,0.4)]'
              }`}
            >
              <div className="text-[rgba(255,255,255,0.5)] text-xs uppercase tracking-wider mb-2">
                {lang === 'ar' ? 'المسجلن بالدورات' : 'Workshop Subscribers'}
              </div>
              <div className="text-[hsl(var(--g300))] text-3xl font-black">{workshopCount}</div>
              <div className="text-[rgba(255,255,255,0.4)] text-xs mt-1">
                {lang === 'ar' ? 'انقر لعرض التفاصيل' : 'Click to view details'}
              </div>
            </button>
          </div>

          {tableData.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-white text-sm font-bold">
                  {subscriberView === 'course'
                    ? (lang === 'ar' ? 'مشتركو الكورسات' : 'Course Subscribers')
                    : subscriberView === 'workshop'
                    ? (lang === 'ar' ? 'مشتركو الدورات' : 'Workshop Subscribers')
                    : (lang === 'ar' ? 'جميع الطلبات' : 'All Orders')}
                </h3>
                <span className="text-[rgba(255,255,255,0.4)] text-xs">({tableData.length})</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.08)]">
                <table className="w-full text-sm text-white" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                  <thead>
                    <tr className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)]">
                      <th className="py-3 px-4 text-start text-[rgba(255,255,255,0.5)] text-xs font-semibold uppercase">{lang === 'ar' ? 'الاسم' : 'Name'}</th>
                      <th className="py-3 px-4 text-start text-[rgba(255,255,255,0.5)] text-xs font-semibold uppercase">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                      <th className="py-3 px-4 text-start text-[rgba(255,255,255,0.5)] text-xs font-semibold uppercase">{lang === 'ar' ? 'اسم المنتج' : 'Item Name'}</th>
                      <th className="py-3 px-4 text-start text-[rgba(255,255,255,0.5)] text-xs font-semibold uppercase">{lang === 'ar' ? 'النوع' : 'Kind'}</th>
                      <th className="py-3 px-4 text-start text-[rgba(255,255,255,0.5)] text-xs font-semibold uppercase">{lang === 'ar' ? 'المبلغ (د.أ)' : 'Amount (JOD)'}</th>
                      <th className="py-3 px-4 text-start text-[rgba(255,255,255,0.5)] text-xs font-semibold uppercase">{lang === 'ar' ? 'تاريخ الاشتراك' : 'Date'}</th>
                      <th className="py-3 px-4 text-start text-[rgba(255,255,255,0.5)] text-xs font-semibold uppercase">{lang === 'ar' ? 'إجراءات' : 'Actions'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((p) => {
                      const kl = KIND_LABEL[p.itemKind];
                      return (
                        <tr key={p.id} className="border-b border-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.03)]">
                          <td className="py-3 px-4 font-semibold">{p.userName || '—'}</td>
                          <td className="py-3 px-4 text-[rgba(255,255,255,0.6)]" dir="ltr">{p.userEmail || '—'}</td>
                          <td className="py-3 px-4 max-w-[200px] truncate">{lang === 'ar' ? p.itemTitleAr : p.itemTitleEn}</td>
                          <td className="py-3 px-4">
                            <span
                              className="inline-block text-[0.68rem] font-bold py-0.5 px-2 rounded-full"
                              style={{
                                backgroundColor: p.itemKind === 'course' ? 'rgba(90,45,145,0.3)' : p.itemKind === 'workshop' ? 'rgba(212,160,23,0.2)' : 'rgba(255,255,255,0.08)',
                                color: p.itemKind === 'course' ? '#c9a0ff' : p.itemKind === 'workshop' ? '#ffd87a' : 'rgba(255,255,255,0.7)',
                              }}
                            >
                              {kl ? (lang === 'ar' ? kl.ar : kl.en) : p.itemKind}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-[hsl(var(--g300))]" dir="ltr">{p.paidJod.toFixed(2)}</td>
                          <td className="py-3 px-4 text-[rgba(255,255,255,0.5)]">{formatDate(p.createdAt)}</td>
                          <td className="py-3 px-4">
                            <button
                              onClick={() => onDeletePurchase(p.id)}
                              title={lang === 'ar' ? 'حذف السجل نهائياً' : 'Delete record permanently'}
                              className="inline-flex items-center gap-1 text-[0.72rem] font-bold py-1.5 px-2.5 rounded-md border whitespace-nowrap hover:opacity-90 cursor-pointer"
                              style={{ backgroundColor: 'rgba(255,80,80,0.10)', color: '#ff9494', borderColor: 'rgba(255,80,80,0.45)' }}
                            >
                              <span aria-hidden>🗑</span>
                              <span>{lang === 'ar' ? 'حذف' : 'Delete'}</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tableData.length === 0 && (
            <p className="text-[rgba(255,255,255,0.4)] text-sm italic text-center py-6">
              {lang === 'ar' ? 'لا توجد بيانات في هذه الفئة بعد.' : 'No data in this category yet.'}
            </p>
          )}
        </>
      )}
    </section>
  );
}

function AnalyticsSection({
  lang,
  purchases,
  loading,
}: {
  lang: string;
  purchases: Purchase[];
  loading: boolean;
}) {
  const chartData = useMemo(() => {
    const months: Record<string, { month: string; courses: number; workshops: number; other: number }> = {};
    purchases.forEach((p) => {
      let d: Date;
      try {
        d = p.createdAt?.toDate ? p.createdAt.toDate() : new Date();
      } catch {
        d = new Date();
      }
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-GB', { month: 'short', year: '2-digit' });
      if (!months[key]) months[key] = { month: label, courses: 0, workshops: 0, other: 0 };
      if (p.itemKind === 'course') months[key].courses++;
      else if (p.itemKind === 'workshop') months[key].workshops++;
      else months[key].other++;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }, [purchases, lang]);

  return (
    <section className="bg-[rgba(30,14,56,0.75)] border border-[rgba(212,160,23,0.25)] rounded-2xl p-6 mb-6">
      <h2 className="text-white text-lg font-black mb-5">
        {lang === 'ar' ? '📊 تحليلات الطلبات' : '📊 Order Analytics'}
      </h2>

      {loading ? (
        <div className="h-[240px] rounded-xl bg-[rgba(255,255,255,0.04)] animate-pulse" />
      ) : chartData.length === 0 ? (
        <div className="h-[200px] flex items-center justify-center text-[rgba(255,255,255,0.35)] text-sm">
          {lang === 'ar' ? 'لا توجد بيانات كافية لعرض الرسم البياني.' : 'Not enough data to display the chart.'}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-5 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--p500))' }} />
              <span className="text-[rgba(255,255,255,0.6)] text-xs">{lang === 'ar' ? 'كورسات' : 'Courses'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'hsl(var(--g500))' }} />
              <span className="text-[rgba(255,255,255,0.6)] text-xs">{lang === 'ar' ? 'ورشات' : 'Workshops'}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[rgba(255,255,255,0.25)]" />
              <span className="text-[rgba(255,255,255,0.6)] text-xs">{lang === 'ar' ? 'أخرى' : 'Other'}</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: '#1e0e38', border: '1px solid rgba(212,160,23,0.3)', borderRadius: 10, fontSize: 12, color: 'white' }}
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              />
              <Bar dataKey="courses" name={lang === 'ar' ? 'كورسات' : 'Courses'} fill="hsl(var(--p500))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="workshops" name={lang === 'ar' ? 'ورشات' : 'Workshops'} fill="hsl(var(--g500))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="other" name={lang === 'ar' ? 'أخرى' : 'Other'} fill="rgba(255,255,255,0.2)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </section>
  );
}

function PriceInputUSD({
  jodValue,
  onChangeJod,
  allowEmpty,
  placeholder,
}: {
  jodValue: number | null | undefined;
  onChangeJod: (jod: number | null) => void;
  allowEmpty: boolean;
  placeholder?: string;
}) {
  const usdRate = RATES.USD;
  const initial =
    jodValue === null || jodValue === undefined || (allowEmpty && jodValue === 0)
      ? ''
      : (jodValue * usdRate).toFixed(2);
  const [val, setVal] = useState<string>(initial);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (focused) return;
    const next =
      jodValue === null || jodValue === undefined || (allowEmpty && jodValue === 0)
        ? ''
        : (jodValue * usdRate).toFixed(2);
    setVal(next);
  }, [jodValue, focused, allowEmpty, usdRate]);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === '') {
      onChangeJod(allowEmpty ? null : 0);
      return;
    }
    const num = Number(trimmed);
    if (!Number.isFinite(num) || num < 0) {
      onChangeJod(allowEmpty ? null : 0);
      return;
    }
    onChangeJod(num / usdRate);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={val}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        setFocused(false);
        commit(e.target.value);
      }}
      onChange={(e) => {
        const v = e.target.value;
        if (v === '' || /^[0-9]*\.?[0-9]*$/.test(v)) {
          setVal(v);
          commit(v);
        }
      }}
      className="adm-input"
      dir="ltr"
    />
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[rgba(255,255,255,0.6)] text-[0.72rem] font-semibold mb-1">{label}</label>
      {children}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[rgba(30,14,56,0.75)] border border-[rgba(212,160,23,0.25)] rounded-2xl p-5">
      <div className="text-[rgba(255,255,255,0.5)] text-xs uppercase tracking-wider mb-1.5">{label}</div>
      <div className="text-white text-2xl font-black">{value}</div>
    </div>
  );
}
