import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { Item, fetchItems, effectivePrice, discountPercent } from '@/lib/items';

export function VIP() {
  const { t, formatPrice, addToCart, lang } = useApp();
  const [items, setItems] = useState<Item[] | null>(null);

  useEffect(() => {
    fetchItems().then(setItems).catch(() => setItems([]));
  }, []);

  const dbItems = (items || []).filter((i) => i.kind === 'vip');

  if (items === null || dbItems.length === 0) return null;

  return (
    <section id="vip" className="section bg-white scroll-mt-24">
      <div className="section-inner">
        <div className="section-header">
          <span className="section-label">{t('vip.label')}</span>
          <h2 className="section-title">{t('vip.title')}</h2>
          <p className="section-desc">{t('vip.desc')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {dbItems.map((it) => {
            const eff = effectivePrice(it);
            const pct = discountPercent(it);
            const title = lang === 'ar' ? it.titleAr : it.titleEn;
            const desc = lang === 'ar' ? it.descAr : it.descEn;
            return (
              <div key={it.id} className="bg-gradient-to-br from-[#fdf8e1] to-[#f9f5ff] border border-[rgba(212,160,23,0.3)] rounded-[20px] p-9 transition-all hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(90,45,145,0.15)] relative overflow-hidden flex flex-col">
                {pct !== null && (
                  <div className="absolute top-4 end-4 bg-[hsl(var(--g500))] text-[hsl(var(--p900))] text-[0.7rem] font-black py-1 px-2.5 rounded-full">
                    {lang === 'ar' ? `خصم ${pct}%` : `${pct}% OFF`}
                  </div>
                )}
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
                    itemKind: it.kind,
                    titleAr: it.titleAr,
                    titleEn: it.titleEn,
                    originalJod: it.originalPriceJod,
                    telegramLink: it.telegramLink,
                    requiresBooking: true,
                  })}
                  className="self-start inline-flex items-center gap-1.5 bg-gradient-to-br from-[hsl(var(--g600))] to-[hsl(var(--g400))] text-[hsl(var(--p900))] font-semibold text-[0.85rem] py-2 px-5 rounded-lg border-none cursor-pointer hover:opacity-85 transition-opacity"
                >
                  {t('cart.addBtn')}
                </button>
              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
}
