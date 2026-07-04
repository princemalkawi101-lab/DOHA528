import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { Item, fetchItems, effectivePrice, discountPercent } from '@/lib/items';

const DESC_LIMIT = 180;

function CourseDescription({ desc, lang }: { desc: string; lang: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = desc.length > DESC_LIMIT;
  const displayed = isLong && !expanded ? desc.slice(0, DESC_LIMIT).trimEnd() + '…' : desc;
  return (
    <div className="text-[hsl(var(--muted-foreground))] text-[0.95rem] leading-[1.8] mb-4 flex-1 whitespace-pre-line">
      {displayed}
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="block mt-1 text-[hsl(var(--p600))] font-semibold text-[0.85rem] hover:underline cursor-pointer bg-transparent border-none p-0"
        >
          {expanded ? (lang === 'ar' ? 'أقل ▲' : 'Less ▲') : (lang === 'ar' ? 'المزيد ▼' : 'Read more ▼')}
        </button>
      )}
    </div>
  );
}

export function Courses() {
  const { t, lang, formatPrice, addToCart } = useApp();
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    fetchItems().then(setItems).catch(() => setItems([]));
  }, []);

  const dbItems = (items || []).filter((i) => i.kind === 'course' || i.kind === 'workshop' || i.kind === 'recorded');

  const fallback = [
    { key: 'c1', icon: '🎓', price: 45 },
    { key: 'c2', icon: '✨', price: 55 },
    { key: 'c3', icon: '🧘', price: 40 },
    { key: 'c4', icon: '🎵', price: 50 },
  ];

  const showFallback = items !== null && dbItems.length === 0;

  return (
    <section id="paid-courses" className="section bg-white">
      <div className="section-inner">
        <div className="section-header">
          <span className="section-label">{t('courses.label')}</span>
          <h2 className="section-title">{t('courses.title')}</h2>
          <p className="section-desc">{t('courses.desc')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {dbItems.map((it) => {
            const eff = effectivePrice(it);
            const pct = discountPercent(it);
            const title = lang === 'ar' ? it.titleAr : it.titleEn;
            const desc = lang === 'ar' ? it.descAr : it.descEn;
            return (
              <div key={it.id} className="bg-[hsl(var(--card))] border border-[rgba(90,45,145,0.1)] rounded-[20px] p-9 transition-all hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(90,45,145,0.15)] relative overflow-hidden flex flex-col">
                {pct !== null && (
                  <div className="absolute top-4 end-4 bg-[hsl(var(--g500))] text-[hsl(var(--p900))] text-[0.7rem] font-black py-1 px-2.5 rounded-full">
                    {lang === 'ar' ? `خصم ${pct}%` : `${pct}% OFF`}
                  </div>
                )}
                <div className="text-[2rem] text-[hsl(var(--g500))] mb-4">{it.icon}</div>
                <h3 className="text-[1.15rem] font-bold text-[hsl(var(--p900))] mb-3">{title}</h3>
                <CourseDescription desc={desc} lang={lang} />
                <div className="mb-4 flex items-baseline gap-2 flex-wrap">
                  <span className="text-[1.05rem] font-bold text-[hsl(var(--p600))]">{formatPrice(eff)}</span>
                  {pct !== null && (
                    <span className="text-[0.9rem] text-[hsl(var(--muted-foreground))] line-through">{formatPrice(it.originalPriceJod)}</span>
                  )}
                </div>
                <button
                  onClick={() => addToCart(it.id, it.icon, eff, {
                    itemId: it.id,
                    titleAr: it.titleAr,
                    titleEn: it.titleEn,
                    originalJod: it.originalPriceJod,
                    telegramLink: it.telegramLink,
                    requiresBooking: false,
                  })}
                  className="self-start inline-flex items-center gap-1.5 bg-gradient-to-br from-[hsl(var(--p600))] to-[hsl(var(--p500))] text-white font-semibold text-[0.85rem] py-2 px-5 rounded-lg border-none cursor-pointer hover:opacity-85 transition-opacity"
                >
                  {t('cart.addBtn')}
                </button>
              </div>
            );
          })}

          {showFallback && fallback.map((course) => (
            <div key={course.key} className="bg-[hsl(var(--card))] border border-[rgba(90,45,145,0.1)] rounded-[20px] p-9 transition-all hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(90,45,145,0.15)] relative overflow-hidden flex flex-col">
              <div className="text-[2rem] text-[hsl(var(--g500))] mb-4">{course.icon}</div>
              <h3 className="text-[1.15rem] font-bold text-[hsl(var(--p900))] mb-3">{t(`courses.${course.key}.title`)}</h3>
              <p className="text-[hsl(var(--muted-foreground))] text-[0.95rem] leading-[1.8] mb-4 flex-1">{t(`courses.${course.key}.desc`)}</p>
              <p className="text-[1.05rem] font-bold text-[hsl(var(--p600))] mb-4">{formatPrice(course.price)}</p>
              <button
                onClick={() => addToCart(`courses.${course.key}.title`, course.icon, course.price)}
                className="self-start inline-flex items-center gap-1.5 bg-gradient-to-br from-[hsl(var(--p600))] to-[hsl(var(--p500))] text-white font-semibold text-[0.85rem] py-2 px-5 rounded-lg border-none cursor-pointer hover:opacity-85 transition-opacity"
              >
                {t('cart.addBtn')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
