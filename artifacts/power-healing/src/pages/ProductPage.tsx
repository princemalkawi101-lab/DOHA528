import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useApp } from '@/lib/store';
import { Item, fetchItemById, effectivePrice, discountPercent } from '@/lib/items';

export default function ProductPage() {
  const { lang, formatPrice, addToCart } = useApp();
  const [, navigate] = useLocation();
  const [item, setItem] = useState<Item | null>(null);
  const [status, setStatus] = useState<'loading' | 'found' | 'not-found'>('loading');
  const [tier, setTier] = useState<'regular' | 'vip'>('regular');
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) { setStatus('not-found'); return; }
    fetchItemById(id).then((it) => {
      if (it) { setItem(it); setStatus('found'); }
      else setStatus('not-found');
    });
  }, []);

  if (status === 'loading') {
    return (
      <div className="min-h-[calc(100dvh-68px)] mt-[68px] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-[hsl(var(--g500))] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (status === 'not-found' || !item) {
    return (
      <div className="min-h-[calc(100dvh-68px)] mt-[68px] flex items-center justify-center px-4 py-10 bg-gradient-to-br from-[#1a0a2e] via-[#2a1444] to-[#1a0a2e]">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-4">🔍</div>
          <h1 className="text-white text-2xl font-black mb-3">
            {lang === 'ar' ? 'المنتج غير موجود' : 'Product Not Found'}
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] text-sm mb-6">
            {lang === 'ar'
              ? 'لم يتم العثور على المنتج المطلوب. قد يكون الرابط غير صحيح.'
              : 'The requested product was not found. The link may be invalid.'}
          </p>
          <Link href="/#products" className="inline-block bg-[hsl(var(--g500))] text-[hsl(var(--p900))] font-bold py-2.5 px-6 rounded-lg">
            {lang === 'ar' ? 'تصفّح جميع المنتجات' : 'Browse All Products'}
          </Link>
        </div>
      </div>
    );
  }

  const eff = effectivePrice(item);
  const pct = discountPercent(item);
  const title = lang === 'ar' ? item.titleAr : item.titleEn;
  const desc = lang === 'ar' ? item.descAr : item.descEn;
  const isIndividual = item.kind === 'individual-online';
  const hasVip = !!(item.vipEnabled && item.vipPriceJod && item.vipPriceJod > 0);
  const isVip = tier === 'vip' && hasVip;
  const activePrice = isVip ? (item.vipPriceJod as number) : eff;

  const kindLabel: Record<string, { ar: string; en: string }> = {
    course:              { ar: 'كورس مدفوع',           en: 'Paid Course' },
    workshop:            { ar: 'ورشة مدفوعة',           en: 'Paid Workshop' },
    recorded:            { ar: 'جلسة مسجلة',            en: 'Recorded Session' },
    'individual-online': { ar: 'جلسة فردية أونلاين',    en: '1-on-1 Online Session' },
    session:             { ar: 'جلسة عامة',              en: 'General Session' },
    vip:                 { ar: '👑 خدمة VIP',            en: '👑 VIP Service' },
  };
  const kl = kindLabel[item.kind] ?? { ar: item.kind, en: item.kind };

  const doAdd = () => {
    addToCart(item.id + (isVip ? '-vip' : ''), item.icon, activePrice, {
      itemId: item.id,
      itemKind: item.kind,
      titleAr: item.titleAr + (isVip ? ' (VIP)' : ''),
      titleEn: item.titleEn + (isVip ? ' (VIP)' : ''),
      originalJod: item.originalPriceJod,
      telegramLink: item.telegramLink,
      requiresBooking: isIndividual || item.kind === 'vip',
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const directUrl = `${window.location.origin}/product?id=${item.id}`;

  return (
    <div className="min-h-[calc(100dvh-68px)] mt-[68px] px-4 py-12 bg-gradient-to-br from-[#1a0a2e] via-[#2a1444] to-[#1a0a2e]">
      <div className="max-w-2xl mx-auto">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[rgba(255,255,255,0.45)] text-sm mb-8 flex-wrap">
          <Link href="/" className="hover:text-[hsl(var(--g300))] transition-colors">
            {lang === 'ar' ? 'الرئيسية' : 'Home'}
          </Link>
          <span>/</span>
          <Link href="/#products" className="hover:text-[hsl(var(--g300))] transition-colors">
            {lang === 'ar' ? 'المنتجات' : 'Products'}
          </Link>
          <span>/</span>
          <span className="text-[rgba(255,255,255,0.7)] truncate max-w-[200px]">{title}</span>
        </div>

        {/* Card */}
        <div className="bg-[rgba(30,14,56,0.8)] border border-[rgba(212,160,23,0.2)] rounded-2xl p-8 shadow-xl">

          {/* Kind badge + discount */}
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="inline-block bg-[rgba(90,45,145,0.35)] text-[rgba(255,255,255,0.85)] text-[0.7rem] font-bold py-1 px-2.5 rounded-full border border-[rgba(90,45,145,0.5)]">
              {lang === 'ar' ? kl.ar : kl.en}
            </span>
            {isIndividual && (
              <span className="inline-block bg-[rgba(212,160,23,0.15)] text-[hsl(var(--g400))] text-[0.7rem] font-bold py-1 px-2.5 rounded-full border border-[rgba(212,160,23,0.3)]">
                Zoom
              </span>
            )}
            {pct !== null && (
              <span className="inline-block bg-[hsl(var(--g500))] text-[hsl(var(--p900))] text-[0.7rem] font-black py-1 px-2.5 rounded-full">
                {lang === 'ar' ? `خصم ${pct}%` : `${pct}% OFF`}
              </span>
            )}
          </div>

          {/* Icon + title */}
          <div className="text-5xl mb-4">{item.icon}</div>
          <h1 className="text-white text-2xl font-black mb-4 leading-snug">{title}</h1>
          <p className="text-[rgba(255,255,255,0.72)] text-[0.95rem] leading-[1.85] mb-8 whitespace-pre-line">{desc}</p>

          {/* ── Price tier selector ── */}
          {hasVip ? (
            <div className="mb-6">
              <p className="text-[rgba(255,255,255,0.55)] text-xs font-semibold mb-2">
                {lang === 'ar' ? 'اختر السعر:' : 'Choose price:'}
              </p>
              <div className="flex gap-3">
                {/* Regular */}
                <button
                  type="button"
                  onClick={() => setTier('regular')}
                  className={`flex-1 flex flex-col items-center py-3 px-3 rounded-xl border-2 transition-all cursor-pointer ${
                    tier === 'regular'
                      ? 'border-[hsl(var(--p500))] bg-[rgba(90,45,145,0.2)]'
                      : 'border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] hover:border-[rgba(255,255,255,0.25)]'
                  }`}
                >
                  <span className="text-[0.68rem] font-bold text-[rgba(255,255,255,0.55)] mb-1">
                    {lang === 'ar' ? 'السعر العادي' : 'Regular Price'}
                  </span>
                  <span className={`text-[1.1rem] font-black ${tier === 'regular' ? 'text-[hsl(var(--g300))]' : 'text-white'}`}>
                    {formatPrice(eff)}
                  </span>
                  {pct !== null && (
                    <span className="text-[0.68rem] text-[rgba(255,255,255,0.35)] line-through mt-0.5">{formatPrice(item.originalPriceJod)}</span>
                  )}
                </button>

                {/* VIP */}
                <button
                  type="button"
                  onClick={() => setTier('vip')}
                  className={`flex-1 flex flex-col items-center py-3 px-3 rounded-xl border-2 transition-all cursor-pointer ${
                    tier === 'vip'
                      ? 'border-[hsl(var(--g500))] bg-[rgba(212,160,23,0.12)]'
                      : 'border-[rgba(212,160,23,0.25)] bg-[rgba(212,160,23,0.04)] hover:border-[rgba(212,160,23,0.45)]'
                  }`}
                >
                  <span className="text-[0.68rem] font-bold text-[hsl(var(--g500))] mb-1">👑 VIP</span>
                  <span className={`text-[1.1rem] font-black ${tier === 'vip' ? 'text-[hsl(var(--g300))]' : 'text-white'}`}>
                    {formatPrice(item.vipPriceJod as number)}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[rgba(0,0,0,0.2)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
              <span className="text-[rgba(255,255,255,0.6)] text-sm font-semibold">{lang === 'ar' ? 'السعر' : 'Price'}</span>
              <div className="flex items-baseline gap-2">
                <span className="text-[hsl(var(--g400))] text-xl font-black">{formatPrice(eff)}</span>
                {pct !== null && (
                  <span className="text-[rgba(255,255,255,0.4)] text-sm line-through">{formatPrice(item.originalPriceJod)}</span>
                )}
              </div>
            </div>
          )}

          {/* Single pair of CTA buttons — price driven by tier selection */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={doAdd}
              style={{
                backgroundColor: isVip ? 'hsl(var(--g600))' : 'hsl(var(--p600))',
                color: isVip ? 'hsl(var(--p900))' : '#ffffff',
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-xl border-0 cursor-pointer hover:opacity-90 transition-opacity"
            >
              {added
                ? (lang === 'ar' ? '✓ تمت الإضافة' : '✓ Added')
                : `${isVip ? '👑 ' : '🛒 '}${lang === 'ar' ? 'أضف إلى السلة' : 'Add to Cart'}`}
            </button>
            <button
              onClick={() => { doAdd(); navigate('/checkout'); }}
              style={{ backgroundColor: 'hsl(var(--g500))', color: 'hsl(var(--p900))' }}
              className="flex-1 inline-flex items-center justify-center gap-2 font-black py-3 px-4 rounded-xl border-0 cursor-pointer hover:opacity-90 transition-opacity"
            >
              {lang === 'ar' ? '⚡ شراء الآن' : '⚡ Buy Now'}
            </button>
          </div>

          {/* Shareable direct link */}
          <div className="mt-6 pt-5 border-t border-[rgba(255,255,255,0.07)]">
            <p className="text-[rgba(255,255,255,0.4)] text-xs font-semibold mb-1.5">
              {lang === 'ar' ? '🔗 رابط مباشر لهذا المنتج' : '🔗 Direct link to this product'}
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={directUrl}
                dir="ltr"
                className="flex-1 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-lg px-3 py-1.5 text-[rgba(255,255,255,0.6)] text-xs font-mono outline-none"
              />
              <button
                onClick={() => navigator.clipboard?.writeText(directUrl)}
                className="shrink-0 bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.7)] text-xs font-semibold py-1.5 px-3 rounded-lg hover:bg-[rgba(255,255,255,0.14)]"
              >
                {lang === 'ar' ? 'نسخ' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
