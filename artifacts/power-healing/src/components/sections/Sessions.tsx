import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { Item, fetchItems, effectivePrice, discountPercent } from '@/lib/items';

export function Sessions() {
  const { t, lang, formatPrice, addToCart } = useApp();
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    fetchItems().then(setItems).catch(() => setItems([]));
  }, []);

  const dbItems = (items || []).filter((i) => i.kind === 'session' || i.kind === 'individual-online');
  const showFallback = items !== null && dbItems.length === 0;

  const fallback = [
    { key: 's1', icon: '✧', price: 35 },
    { key: 's2', icon: '◈', price: 30 },
    { key: 's3', icon: '◉', price: 20 },
    { key: 's4', icon: '✦', price: 25 },
  ];

  return (
    <section id="paid-sessions" className="section bg-[hsl(var(--card))]">
      <div className="section-inner">
        <div className="section-header">
          <span className="section-label">{t('sessions.label')}</span>
          <h2 className="section-title">{t('sessions.title')}</h2>
          <p className="section-desc">{t('sessions.desc')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {dbItems.map((it) => {
            const eff = effectivePrice(it);
            const pct = discountPercent(it);
            const title = lang === 'ar' ? it.titleAr : it.titleEn;
            const desc = lang === 'ar' ? it.descAr : it.descEn;
            const isIndividual = it.kind === 'individual-online';
            return (
              <div key={it.id} className="bg-white border border-[rgba(90,45,145,0.08)] rounded-[20px] p-9 transition-all hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(90,45,145,0.15)] relative overflow-hidden flex flex-col">
                <div className="absolute top-4 end-4 flex flex-col gap-2 items-end">
                  {pct !== null && (
                    <div className="bg-[hsl(var(--g500))] text-[hsl(var(--p900))] text-[0.7rem] font-black py-1 px-2.5 rounded-full">
                      {lang === 'ar' ? `خصم ${pct}%` : `${pct}% OFF`}
                    </div>
                  )}
                  {isIndividual && (
                    <div className="bg-[rgba(90,45,145,0.12)] text-[hsl(var(--p700))] text-[0.65rem] font-bold py-1 px-2 rounded-full border border-[rgba(90,45,145,0.2)]">
                      {lang === 'ar' ? 'اون لاين • Zoom' : 'Online • Zoom'}
                    </div>
                  )}
                </div>
                <div className="text-[2rem] text-[hsl(var(--g500))] mb-4">{it.icon}</div>
                <h3 className="text-[1.15rem] font-bold text-[hsl(var(--p900))] mb-3">{title}</h3>
                <p className="text-[hsl(var(--muted-foreground))] text-[0.95rem] leading-[1.8] mb-4 flex-1 whitespace-pre-line">{desc}</p>
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
                    requiresBooking: isIndividual,
                  })}
                  className="self-start inline-flex items-center gap-1.5 bg-gradient-to-br from-[hsl(var(--p600))] to-[hsl(var(--p500))] text-white font-semibold text-[0.85rem] py-2 px-5 rounded-lg border-none cursor-pointer hover:opacity-85 transition-opacity"
                >
                  {t('cart.addBtn')}
                </button>
              </div>
            );
          })}

          {showFallback && fallback.map((session) => (
            <div key={session.key} className="bg-white border border-[rgba(90,45,145,0.08)] rounded-[20px] p-9 transition-all hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(90,45,145,0.15)] relative overflow-hidden flex flex-col">
              <div className="text-[2rem] text-[hsl(var(--g500))] mb-4">{session.icon}</div>
              <h3 className="text-[1.15rem] font-bold text-[hsl(var(--p900))] mb-3">{t(`sessions.${session.key}.title`)}</h3>
              <p className="text-[hsl(var(--muted-foreground))] text-[0.95rem] leading-[1.8] mb-4 flex-1">{t(`sessions.${session.key}.desc`)}</p>
              <p className="text-[1.05rem] font-bold text-[hsl(var(--p600))] mb-4">{formatPrice(session.price)}</p>
              <button
                onClick={() => addToCart(`sessions.${session.key}.title`, session.icon, session.price)}
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
