import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { MasahaLogo } from '@/components/icons';
import { fetchItems, Item } from '@/lib/items';
import {
  fetchAdSlides,
  deleteAdSlide,
  saveAdSlide,
  fetchAdSliderConfig,
  AdSlide,
  DEFAULT_AD_SLIDES,
} from '@/lib/adSlides';

const SLIDES = [
  { bg: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1600&q=80', badge: 'hero.badge0', title1: 'hero.title0', title2: 'hero.title20', sub: 'hero.sub0' },
  { bg: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=1600&q=80', badge: 'hero.badge1', title1: 'hero.title1', title2: 'hero.title21', sub: 'hero.sub1' },
  { bg: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=1600&q=80', badge: 'hero.badge2', title1: 'hero.title2', title2: 'hero.title22', sub: 'hero.sub2' },
];

// Hook for touch swipe (also handles mouse drag for desktop testing)
function useSwipe(onLeft: () => void, onRight: () => void, threshold = 40) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (startX.current === null || startY.current === null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    const dy = e.changedTouches[0].clientY - startY.current;
    startX.current = null;
    startY.current = null;
    if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) onLeft();
    else onRight();
  };
  return { onTouchStart, onTouchEnd };
}

export function Hero() {
  const { t, lang } = useApp();
  const { isAdmin } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [adIndex, setAdIndex] = useState(0);
  const [items, setItems] = useState<Item[]>([]);
  const [adSlides, setAdSlides] = useState<AdSlide[]>([]);
  // Tracks whether the current slides came from Firestore (true) or are the
  // hardcoded fallback shown when the collection is empty (false). When false,
  // delete must first persist the remaining slides so the change survives reload.
  const [adSlidesFromFirestore, setAdSlidesFromFirestore] = useState(true);
  const [adSliderEnabled, setAdSliderEnabled] = useState(true);
  const [deletingAdId, setDeletingAdId] = useState<string | null>(null);

  useEffect(() => {
    fetchItems().then(setItems).catch(() => setItems([]));
    fetchAdSlides().then((list) => {
      if (list.length) {
        setAdSlides(list);
        setAdSlidesFromFirestore(true);
      } else {
        // Fall back to defaults if Firestore collection is empty (first-run UX)
        setAdSlides(DEFAULT_AD_SLIDES);
        setAdSlidesFromFirestore(false);
      }
    }).catch(() => {
      setAdSlides(DEFAULT_AD_SLIDES);
      setAdSlidesFromFirestore(false);
    });
    fetchAdSliderConfig()
      .then((cfg) => setAdSliderEnabled(cfg.enabled))
      .catch(() => setAdSliderEnabled(true));
  }, []);

  const handleDeleteAd = (ad: AdSlide) => async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (adSlides.length <= 1) return;
    const ok = confirm(
      lang === 'ar'
        ? `حذف الإعلان "${ad.titleAr || ad.titleEn}"؟ لا يمكن التراجع.`
        : `Delete ad "${ad.titleEn || ad.titleAr}"? This cannot be undone.`,
    );
    if (!ok) return;
    setDeletingAdId(ad.id);
    try {
      const remaining = adSlides.filter((s) => s.id !== ad.id);
      // If we're currently showing the hardcoded defaults (Firestore empty),
      // the deleted slide doesn't exist in Firestore — deleting it is a no-op
      // and the fallback would resurrect on reload. Materialize the remaining
      // slides into Firestore first so the deletion actually sticks.
      if (!adSlidesFromFirestore) {
        for (const s of remaining) {
          await saveAdSlide(s);
        }
        setAdSlidesFromFirestore(true);
      }
      await deleteAdSlide(ad.id);
      setAdSlides(remaining);
      setAdIndex(0);
    } catch (err) {
      console.error('delete ad failed', err);
      alert(lang === 'ar' ? 'تعذّر الحذف، حاول مرة أخرى.' : 'Delete failed, please try again.');
    } finally {
      setDeletingAdId(null);
    }
  };

  // Reset index if list shrinks
  useEffect(() => {
    if (adIndex >= adSlides.length && adSlides.length > 0) setAdIndex(0);
  }, [adSlides.length, adIndex]);

  const findItemForAd = (ad: AdSlide): Item | null => {
    if (!ad.linkedItemId) return null;
    return items.find((it) => it.id === ad.linkedItemId) || null;
  };

  const handleAdClick = (ad: AdSlide) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (ad.status !== 'available') return;
    const found = findItemForAd(ad);
    if (!found) return; // no link → do nothing
    const tabKey =
      found.kind === 'course' || found.kind === 'workshop' || found.kind === 'recorded' || found.kind === 'individual-online'
        ? found.kind
        : 'all';
    window.dispatchEvent(new CustomEvent('products:set-tab', { detail: tabKey }));
    setTimeout(() => {
      const el = document.getElementById(`item-${found.id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('ring-4', 'ring-[hsl(var(--g500))]');
        setTimeout(() => el.classList.remove('ring-4', 'ring-[hsl(var(--g500))]'), 2200);
      } else {
        const sec = document.getElementById('products');
        if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      goToSlide((currentSlide + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [currentSlide]);

  useEffect(() => {
    if (adSlides.length <= 1) return;
    const timer = setInterval(() => {
      setAdIndex((i) => (i + 1) % adSlides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [adSlides.length]);

  const goToSlide = (idx: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(idx);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const nextSlide = () => goToSlide((currentSlide + 1) % SLIDES.length);
  const prevSlide = () => goToSlide((currentSlide + SLIDES.length - 1) % SLIDES.length);

  const nextAd = () => { if (adSlides.length) setAdIndex((i) => (i + 1) % adSlides.length); };
  const prevAd = () => { if (adSlides.length) setAdIndex((i) => (i + adSlides.length - 1) % adSlides.length); };

  // For RTL: swipe-left should go to next; swipe-right should go to prev (matches LTR intuition).
  // Same logic for both since we're treating "swipe left" as forward universally.
  const heroSwipe = useSwipe(nextSlide, prevSlide);
  const adSwipe = useSwipe(nextAd, prevAd);

  const handleBookClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('products');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section
      id="hero"
      className="relative h-[100dvh] min-h-[600px] overflow-hidden flex items-center"
      onTouchStart={heroSwipe.onTouchStart}
      onTouchEnd={heroSwipe.onTouchEnd}
    >
      {SLIDES.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 bg-cover bg-center transition-all duration-800 ease-out origin-center ${currentSlide === idx ? 'opacity-100 scale-100 z-0' : 'opacity-0 scale-105 -z-10'}`}
          style={{ backgroundImage: `url('${slide.bg}')` }}
        />
      ))}

      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(26,10,46,0.82)] via-[rgba(45,21,84,0.6)] to-[rgba(26,10,46,0.75)] z-10" />

      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div className="opacity-[0.06] blur-[1px]">
          <img src="/img/masaha-n-logo.png" alt="" aria-hidden="true" className="w-[520px] h-[520px] object-contain" />
        </div>
      </div>

      {/* Independent Ad Slider + Logo (NOT affected by hero transition) */}
      {/* Hidden entirely for customers when master toggle is OFF; admin still sees it (faded) so they can manage. */}
      <div
        className={`absolute top-[80px] left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-[640px] flex flex-col items-center pointer-events-auto ${
          !adSliderEnabled && !isAdmin ? 'hidden' : ''
        }`}
      >
        {!adSliderEnabled && isAdmin && (
          <div className="mb-2 text-[0.7rem] font-bold py-1 px-3 rounded-full bg-[rgba(255,80,80,0.18)] border border-[rgba(255,80,80,0.5)] text-[#ffb0b0]">
            {lang === 'ar' ? '⚠ مخفي عن الزبائن (معاينة الأدمن فقط)' : '⚠ Hidden from customers (admin preview only)'}
          </div>
        )}
        <div
          onTouchStart={(e) => { e.stopPropagation(); adSwipe.onTouchStart(e); }}
          onTouchEnd={(e) => { e.stopPropagation(); adSwipe.onTouchEnd(e); }}
          className={`relative w-full h-[180px] sm:h-[220px] rounded-2xl overflow-hidden border border-[rgba(212,160,23,0.35)] shadow-[0_10px_40px_rgba(0,0,0,0.35)] select-none ${
            !adSliderEnabled && isAdmin ? 'opacity-60' : ''
          }`}
          style={{ backgroundColor: 'rgba(26,10,46,0.55)', touchAction: 'pan-y' }}
        >
          {adSlides.map((ad, i) => {
            const active = i === adIndex;
            const isAvailable = ad.status === 'available' && !!findItemForAd(ad);
            const inner = (
              <>
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: ad.imageUrl ? `url('${ad.imageUrl}')` : undefined, opacity: 0.55 }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(26,10,46,0.55) 0%, rgba(45,21,84,0.4) 50%, rgba(26,10,46,0.65) 100%)',
                  }}
                />
                <div className="relative h-full w-full flex flex-col items-center justify-center text-center px-4">
                  <span
                    className="inline-block text-[0.7rem] sm:text-[0.78rem] font-bold py-1 px-3 rounded-full mb-2"
                    style={{
                      backgroundColor: 'rgba(212,160,23,0.25)',
                      color: '#ffd87a',
                      border: '1px solid rgba(212,160,23,0.5)',
                    }}
                  >
                    {isAvailable ? (lang === 'ar' ? '✦ متاح الآن' : '✦ Available Now') : (lang === 'ar' ? '◷ قريباً' : '◷ Coming Soon')}
                  </span>
                  <h3
                    className="text-white text-[1.4rem] sm:text-[1.8rem] font-black m-0 mb-1 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]"
                    style={{ letterSpacing: '0.02em' }}
                  >
                    {lang === 'ar' ? ad.titleAr : ad.titleEn}
                  </h3>
                  <p className="text-[rgba(255,255,255,0.88)] text-[0.85rem] sm:text-[0.95rem] m-0">
                    {lang === 'ar' ? ad.taglineAr : ad.taglineEn}
                  </p>
                </div>
              </>
            );
            const baseCls = `absolute inset-0 transition-opacity duration-700 ${active ? 'opacity-100' : 'opacity-0 pointer-events-none'}`;
            const canDelete = isAdmin && adSlides.length > 1;
            return (
              <div key={i} className={baseCls}>
                <button
                  type="button"
                  onClick={isAvailable ? handleAdClick(ad) : undefined}
                  aria-disabled={!isAvailable}
                  className={`block w-full h-full text-start border-0 p-0 m-0 ${isAvailable ? 'cursor-pointer' : 'cursor-default'}`}
                  style={{ background: 'transparent' }}
                >
                  {inner}
                </button>
                {canDelete && (
                  <button
                    type="button"
                    onClick={handleDeleteAd(ad)}
                    disabled={deletingAdId === ad.id}
                    aria-label={lang === 'ar' ? 'حذف الإعلان' : 'Delete ad'}
                    title={lang === 'ar' ? 'حذف هذا الإعلان (أدمن فقط)' : 'Delete this ad (admin only)'}
                    className="absolute top-2 right-2 z-20 w-7 h-7 rounded-full bg-[rgba(0,0,0,0.6)] hover:bg-[#d23] border border-[rgba(255,255,255,0.35)] text-white flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                )}
              </div>
            );
          })}
          {/* dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {adSlides.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); setAdIndex(i); }}
                aria-label={`ad ${i + 1}`}
                className="w-1.5 h-1.5 rounded-full border-0 cursor-pointer p-0 transition-all"
                style={{
                  backgroundColor: i === adIndex ? '#ffd87a' : 'rgba(255,255,255,0.45)',
                  transform: i === adIndex ? 'scale(1.4)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Logo below the ad slider — proportionate, no frame */}
        <div className="mt-3 opacity-95 drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <MasahaLogo width={148} height={148} />
        </div>
      </div>

      {/* Hero text panel — transitions with slide change, but ad slider above is independent */}
      <div className={`relative z-20 w-full max-w-[1200px] mx-auto pt-[340px] sm:pt-[360px] px-6 sm:px-8 transition-all duration-600 ease-out ${isTransitioning ? 'opacity-0 translate-y-5' : 'opacity-100 translate-y-0'}`}>
        <div
          className="inline-block text-[0.85rem] py-1.5 px-4 rounded-full mb-6"
          style={{
            backgroundColor: 'rgba(212,160,23,0.2)',
            border: '1px solid hsl(var(--g500))',
            color: 'hsl(var(--g300))',
          }}
        >
          {t(SLIDES[currentSlide].badge)}
        </div>

        <h1 className="text-[clamp(2.2rem,5vw,3.8rem)] font-black text-white leading-[1.25] m-0 mb-6">
          <span>{t(SLIDES[currentSlide].title1)}</span><br/>
          <span style={{ color: 'hsl(var(--g300))' }}>{t(SLIDES[currentSlide].title2)}</span>
        </h1>

        <p className="text-[clamp(1rem,2vw,1.2rem)] text-[rgba(255,255,255,0.82)] max-w-[600px] mb-10 leading-[1.8]">
          {t(SLIDES[currentSlide].sub)}
        </p>

        <div className="flex flex-wrap gap-4">
          <a
            href="#products"
            onClick={handleBookClick}
            style={{ backgroundColor: 'hsl(var(--g500))', color: 'hsl(var(--p900))' }}
            className="inline-block font-bold text-base py-3.5 px-8 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(212,160,23,0.35)] border-0 cursor-pointer"
          >
            {t('hero.cta1')}
          </a>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2.5 z-30">
        {SLIDES.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goToSlide(idx)}
            className={`w-2.5 h-2.5 rounded-full border-2 border-[rgba(255,255,255,0.6)] cursor-pointer transition-all p-0 ${currentSlide === idx ? 'bg-[hsl(var(--g400))] border-[hsl(var(--g400))] scale-125' : 'bg-transparent'}`}
          />
        ))}
      </div>

      <div className="absolute bottom-[2.2rem] left-8 flex gap-2 z-30">
        <button onClick={nextSlide} className="w-10 h-10 rounded-full border border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.08)] text-white text-[1.4rem] flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.2)]">›</button>
        <button onClick={prevSlide} className="w-10 h-10 rounded-full border border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.08)] text-white text-[1.4rem] flex items-center justify-center cursor-pointer transition-colors hover:bg-[rgba(255,255,255,0.2)]">‹</button>
      </div>
    </section>
  );
}
