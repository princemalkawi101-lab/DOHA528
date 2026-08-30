import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { useApp } from '@/lib/store';
import { Item, fetchItems, effectivePrice, discountPercent } from '@/lib/items';
import { ContentCategory, fetchContentCategories } from '@/lib/contentCategories';

const DESC_LIMIT = 180;

function CourseDescription({ desc, lang }: { desc: string; lang: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = desc.length > DESC_LIMIT;
  const displayed = isLong && !expanded ? desc.slice(0, DESC_LIMIT).trimEnd() + '…' : desc;
  return (
    <div className="text-[hsl(var(--muted-foreground))] text-[0.88rem] leading-[1.7] mb-4 flex-1 whitespace-pre-line">
      {displayed}
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="block mt-1 text-[hsl(var(--p600))] font-semibold text-[0.82rem] hover:underline cursor-pointer bg-transparent border-none p-0"
        >
          {expanded ? (lang === 'ar' ? 'أقل ▲' : 'Less ▲') : (lang === 'ar' ? 'المزيد ▼' : 'Read more ▼')}
        </button>
      )}
    </div>
  );
}

type StandardTabKey = 'course' | 'workshop' | 'recorded' | 'individual-online' | 'vip';
type TabKey = StandardTabKey | `custom:${string}`;

const TABS: { key: StandardTabKey; labelAr: string; labelEn: string }[] = [
  { key: 'course', labelAr: 'الكورسات', labelEn: 'Courses' },
  { key: 'workshop', labelAr: 'الورشات', labelEn: 'Workshops' },
  { key: 'recorded', labelAr: 'الجلسات المسجلة', labelEn: 'Recorded' },
  { key: 'individual-online', labelAr: 'جلسات فردية أونلاين', labelEn: 'Online 1-on-1' },
  { key: 'vip', labelAr: '👑 خدمة VIP', labelEn: '👑 VIP Service' },
];

function readTabFromHash(): TabKey {
  if (typeof window === 'undefined') return 'course';
  const h = window.location.hash;
  if (h.startsWith('#products-category-')) {
    return `custom:${decodeURIComponent(h.slice('#products-category-'.length))}`;
  }
  const m = h.match(/^#products(?:-(course|workshop|recorded|individual-online|vip))?$/);
  if (m && m[1]) return m[1] as TabKey;
  return 'course';
}

const KIND_LABEL: Record<string, { ar: string; en: string }> = {
  course:              { ar: 'كورس',            en: 'Course' },
  workshop:            { ar: 'ورشة',             en: 'Workshop' },
  recorded:            { ar: 'مسجلة',            en: 'Recorded' },
  'individual-online': { ar: 'فردية أونلاين',    en: '1-on-1 Online' },
  vip:                 { ar: '👑 VIP',            en: '👑 VIP' },
};

function ProductCard({ it, category }: { it: Item; category?: ContentCategory }) {
  const { t, lang, formatPrice, addToCart } = useApp();
  const [, navigate] = useLocation();
  const hasVip = !!(it.vipEnabled && it.vipPriceJod && it.vipPriceJod > 0);
  const [tier, setTier] = useState<'regular' | 'vip'>('regular');

  const eff = effectivePrice(it);
  const pct = discountPercent(it);
  const title = lang === 'ar' ? it.titleAr : it.titleEn;
  const desc = lang === 'ar' ? it.descAr : it.descEn;
  const isIndividual = it.kind === 'individual-online';
  const kl = category
    ? { ar: category.titleAr || category.titleEn, en: category.titleEn || category.titleAr }
    : (KIND_LABEL[it.kind] ?? { ar: it.kind, en: it.kind });

  const activePrice = tier === 'vip' && hasVip ? (it.vipPriceJod as number) : eff;
  const isVip = tier === 'vip' && hasVip;

  const doAddToCart = () =>
    addToCart(it.id + (isVip ? '-vip' : ''), it.icon, activePrice, {
      itemId: it.id,
      itemKind: it.kind,
      titleAr: it.titleAr + (isVip ? ' (VIP)' : ''),
      titleEn: it.titleEn + (isVip ? ' (VIP)' : ''),
      originalJod: it.originalPriceJod,
      telegramLink: it.telegramStandardLink || it.telegramLink,
      telegramStandardLink: it.telegramStandardLink || it.telegramLink,
      telegramVipLink: it.telegramVipLink || '',
      requiresBooking: isIndividual || it.kind === 'vip',
    });

  return (
    <div
      id={`item-${it.id}`}
      className="group bg-white border border-[rgba(90,45,145,0.1)] rounded-[18px] p-6 transition-all hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(90,45,145,0.15)] shadow-[0_4px_12px_rgba(90,45,145,0.05)] relative overflow-hidden flex flex-col min-h-[340px] scroll-mt-28"
    >
      {pct !== null && (
        <div className="absolute top-3 end-3 bg-[hsl(var(--g500))] text-[hsl(var(--p900))] text-[0.68rem] font-black py-1 px-2.5 rounded-full shadow-sm">
          {lang === 'ar' ? `خصم ${pct}%` : `${pct}% OFF`}
        </div>
      )}

      {it.imageUrl && (
        <div className="-mx-6 -mt-6 mb-4 aspect-[16/7] overflow-hidden">
          <img src={it.imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className="inline-block bg-[rgba(90,45,145,0.08)] text-[hsl(var(--p700))] text-[0.65rem] font-bold py-0.5 px-2 rounded-full border border-[rgba(90,45,145,0.15)]">
          {lang === 'ar' ? kl.ar : kl.en}
        </span>
        {category && (
          <span className="inline-block bg-[rgba(212,160,23,0.12)] text-[hsl(var(--g600))] text-[0.65rem] font-bold py-0.5 px-2 rounded-full border border-[rgba(212,160,23,0.25)]">
            {it.contentType === 'lesson'
              ? (lang === 'ar' ? 'درس' : 'Lesson')
              : (lang === 'ar' ? 'مادة' : 'Material')}
          </span>
        )}
        {isIndividual && (
          <span className="inline-block bg-[rgba(212,160,23,0.15)] text-[hsl(var(--g600))] text-[0.65rem] font-bold py-0.5 px-2 rounded-full border border-[rgba(212,160,23,0.3)]">
            Zoom
          </span>
        )}
      </div>

      <div className="text-[1.8rem] text-[hsl(var(--g500))] mb-3">{it.icon}</div>
      <h3 className="text-[1.05rem] font-bold text-[hsl(var(--p900))] mb-2 leading-snug line-clamp-2">{title}</h3>
      <CourseDescription desc={desc} lang={lang} />

      {/* ── Price tier selector ── */}
      {hasVip ? (
        <div className="mb-4 flex flex-col gap-2">
          <p className="text-[hsl(var(--muted-foreground))] text-[0.72rem] font-semibold">
            {lang === 'ar' ? 'اختر السعر:' : 'Choose price:'}
          </p>
          <div className="flex gap-2">
            {/* Regular */}
            <button
              type="button"
              onClick={() => setTier('regular')}
              className={`flex-1 flex flex-col items-center py-2 px-2 rounded-xl border-2 transition-all cursor-pointer ${
                tier === 'regular'
                  ? 'border-[hsl(var(--p600))] bg-[rgba(90,45,145,0.06)]'
                  : 'border-[rgba(90,45,145,0.15)] bg-transparent hover:border-[rgba(90,45,145,0.3)]'
              }`}
            >
              <span className="text-[0.65rem] font-bold text-[hsl(var(--muted-foreground))] mb-0.5">
                {lang === 'ar' ? 'السعر العادي' : 'Regular'}
              </span>
              <span className={`text-[0.88rem] font-black ${tier === 'regular' ? 'text-[hsl(var(--p600))]' : 'text-[hsl(var(--p900))]'}`}>
                {formatPrice(eff)}
              </span>
              {pct !== null && (
                <span className="text-[0.65rem] text-[hsl(var(--muted-foreground))] line-through">{formatPrice(it.originalPriceJod)}</span>
              )}
            </button>

            {/* VIP */}
            <button
              type="button"
              onClick={() => setTier('vip')}
              className={`flex-1 flex flex-col items-center py-2 px-2 rounded-xl border-2 transition-all cursor-pointer ${
                tier === 'vip'
                  ? 'border-[hsl(var(--g500))] bg-[rgba(212,160,23,0.08)]'
                  : 'border-[rgba(212,160,23,0.3)] bg-transparent hover:border-[rgba(212,160,23,0.5)]'
              }`}
            >
              <span className="text-[0.65rem] font-bold text-[hsl(var(--g600))] mb-0.5">👑 VIP</span>
              <span className={`text-[0.88rem] font-black ${tier === 'vip' ? 'text-[hsl(var(--g500))]' : 'text-[hsl(var(--p900))]'}`}>
                {formatPrice(it.vipPriceJod as number)}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex items-baseline gap-2 flex-wrap">
          <span className="text-[1.05rem] font-black text-[hsl(var(--p600))]">{formatPrice(eff)}</span>
          {pct !== null && (
            <span className="text-[0.82rem] text-[hsl(var(--muted-foreground))] line-through">{formatPrice(it.originalPriceJod)}</span>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-col sm:flex-row gap-2">
        <button
          onClick={doAddToCart}
          style={{ backgroundColor: isVip ? 'hsl(var(--g600))' : 'hsl(var(--p600))', color: isVip ? 'hsl(var(--p900))' : '#ffffff' }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 font-bold text-[0.85rem] py-2.5 px-3 rounded-lg border-0 cursor-pointer transition-opacity hover:opacity-90"
        >
          {isVip ? '👑 ' : ''}{t('cart.addBtn')}
        </button>
        <button
          onClick={() => { doAddToCart(); navigate('/checkout'); }}
          style={{ backgroundColor: 'hsl(var(--g500))', color: 'hsl(var(--p900))' }}
          className="flex-1 inline-flex items-center justify-center gap-1.5 font-black text-[0.85rem] py-2.5 px-3 rounded-lg border-0 cursor-pointer transition-opacity hover:opacity-90"
        >
          {lang === 'ar' ? '⚡ شراء الآن' : '⚡ Buy Now'}
        </button>
      </div>
    </div>
  );
}

export function Products() {
  const { lang } = useApp();
  const [items, setItems] = useState<Item[] | null>(null);
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [tab, setTab] = useState<TabKey>('course');

  useEffect(() => {
    fetchItems().then(setItems).catch(() => setItems([]));
    fetchContentCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const syncFromHash = () => setTab(readTabFromHash());
    const syncFromEvent = (e: Event) => {
      const detail = (e as CustomEvent<TabKey>).detail;
      if (detail) setTab(detail);
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    window.addEventListener('products:set-tab', syncFromEvent as EventListener);
    return () => {
      window.removeEventListener('hashchange', syncFromHash);
      window.removeEventListener('products:set-tab', syncFromEvent as EventListener);
    };
  }, []);

  const filtered = useMemo(() => {
    const all = (items || []).filter((item) => item.active !== false);
    if (tab.startsWith('custom:')) {
      return all.filter((item) => item.categoryId === tab.slice('custom:'.length));
    }
    return all.filter((item) => !item.categoryId && item.kind === tab);
  }, [items, tab]);

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.active).sort((a, b) => a.order - b.order),
    [categories],
  );

  const tabs = useMemo(
    () => [
      ...TABS,
      ...visibleCategories.map((category) => ({
        key: `custom:${category.id}` as TabKey,
        labelAr: `${category.icon || '✦'} ${category.titleAr}`,
        labelEn: `${category.icon || '✦'} ${category.titleEn || category.titleAr}`,
      })),
    ],
    [visibleCategories],
  );

  const countForTab = (key: TabKey) => {
    const activeItems = (items || []).filter((item) => item.active !== false);
    if (key.startsWith('custom:')) {
      return activeItems.filter((item) => item.categoryId === key.slice('custom:'.length)).length;
    }
    return activeItems.filter((item) => !item.categoryId && item.kind === key).length;
  };

  const loading = items === null;

  return (
    <section id="products" className="section bg-white scroll-mt-24">
      <div className="section-inner">
        <div className="section-header">
          <span className="section-label">{lang === 'ar' ? 'المنتجات والخدمات' : 'Products & Services'}</span>
          <h2 className="section-title">{lang === 'ar' ? 'استكشف دوراتنا وجلساتنا' : 'Explore Our Courses & Sessions'}</h2>
          <p className="section-desc">
            {lang === 'ar'
              ? 'كل ما تحتاجه للشفاء والنمو الروحي — كورسات، ورشات، جلسات مسجلة وجلسات فردية.'
              : 'Everything you need for healing and spiritual growth — courses, workshops, recorded sessions, and 1-on-1 meetings.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10 sticky top-[68px] z-30 bg-white/85 backdrop-blur py-3 -mx-3 px-3 rounded-xl">
          {tabs.map((tb) => {
            const active = tab === tb.key;
            const label = lang === 'ar' ? tb.labelAr : tb.labelEn;
            return (
              <button
                key={tb.key}
                onClick={() => {
                  setTab(tb.key);
                  const newHash = tb.key.startsWith('custom:')
                    ? `#products-category-${encodeURIComponent(tb.key.slice('custom:'.length))}`
                    : `#products-${tb.key}`;
                  if (window.location.hash !== newHash) {
                    history.replaceState(null, '', newHash);
                  }
                }}
                style={
                  active
                    ? { backgroundColor: 'hsl(var(--p600))', color: '#ffffff', borderColor: 'transparent' }
                    : { backgroundColor: 'hsl(var(--card))', color: 'hsl(var(--p700))', borderColor: 'rgba(90,45,145,0.18)' }
                }
                className={`inline-flex items-center gap-2 text-[0.85rem] sm:text-[0.9rem] font-bold py-2 px-4 sm:px-5 rounded-full border transition-all cursor-pointer ${
                  active ? 'shadow-[0_8px_20px_rgba(90,45,145,0.25)]' : 'hover:opacity-90'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[0.7rem] font-black min-w-[22px] h-[22px] inline-flex items-center justify-center px-1.5 rounded-full ${
                    active ? 'bg-white/25 text-white' : 'bg-[rgba(90,45,145,0.1)] text-[hsl(var(--p700))]'
                  }`}
                >
                  {countForTab(tb.key)}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[hsl(var(--card))] border border-[rgba(90,45,145,0.08)] rounded-[18px] p-7 h-[320px] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-[hsl(var(--muted-foreground))]">
            {lang === 'ar' ? 'لا توجد عناصر في هذا القسم حالياً.' : 'No items in this category yet.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((it) => (
              <ProductCard
                key={it.id}
                it={it}
                category={it.categoryId ? categories.find((entry) => entry.id === it.categoryId) : undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
