import { useState, useEffect } from 'react';
import { useApp } from '@/lib/store';
import { fetchReviews, HARDCODED_TESTIMONIALS, type Review } from '@/lib/reviews';

function TestimonialCard({ text, author, rating, index }: { text: string; author?: string; rating?: number; index: number }) {
  const stars = Math.min(5, Math.max(1, rating ?? 5));
  return (
    <article
      className="relative bg-[rgba(30,14,56,0.75)] rounded-2xl p-6 sm:p-7 border border-[rgba(212,160,23,0.18)] shadow-[0_4px_24px_rgba(0,0,0,0.25)] hover:shadow-[0_10px_36px_rgba(212,160,23,0.18)] hover:border-[rgba(212,160,23,0.45)] transition-all duration-300 flex flex-col"
      style={{ borderInlineStartWidth: '4px', borderInlineStartColor: 'hsl(var(--g500))' }}
    >
      <span
        aria-hidden="true"
        className="absolute -top-2 text-[hsl(var(--g400))] text-5xl font-serif leading-none opacity-60 select-none"
        style={{ insetInlineStart: '1.25rem' }}
      >
        "
      </span>
      <p className="text-[rgba(255,255,255,0.88)] text-[0.95rem] sm:text-base leading-[1.85] whitespace-pre-line flex-1">
        {text}
      </p>
      <div className="mt-5 pt-4 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between text-xs">
        <span className="text-[hsl(var(--g300))] font-bold tracking-wide">
          ✦ {author || `عميلة موثّقة #${String(index + 1).padStart(2, '0')}`}
        </span>
        <span className="text-[rgba(255,255,255,0.3)]">
          {'⭐'.repeat(stars)}
        </span>
      </div>
    </article>
  );
}

export function Testimonials() {
  const { t, lang } = useApp();
  const [firestoreReviews, setFirestoreReviews] = useState<Review[] | null>(null);

  useEffect(() => {
    fetchReviews()
      .then((list) => setFirestoreReviews(list))
      .catch(() => setFirestoreReviews([]));
  }, []);

  const activeFirestore = firestoreReviews?.filter((r) => r.active) ?? [];
  const useFirestore = firestoreReviews !== null && activeFirestore.length > 0;

  return (
    <section id="testimonials" className="section bg-gradient-to-b from-[hsl(var(--p900))] to-[hsl(var(--p800))] overflow-hidden">
      <div className="section-inner">
        <div className="section-header">
          <span className="section-label bg-[rgba(212,160,23,0.15)] text-[hsl(var(--g300))]">
            {t('test.label') || (lang === 'ar' ? 'آراء العميلات' : 'Testimonials')}
          </span>
          <h2 className="section-title text-white">
            {t('test.title') || (lang === 'ar' ? 'كلمات من القلب' : 'Words From the Heart')}
          </h2>
          <p className="section-desc text-[rgba(255,255,255,0.65)]">
            {lang === 'ar'
              ? 'تجارب حقيقية وقصص تحوّل من عميلاتنا الرائعات ✨'
              : 'Real journeys and stories of transformation from our wonderful clients ✨'}
          </p>
        </div>

        <div
          className="grid gap-5 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-8"
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
          {useFirestore
            ? activeFirestore.map((rev, i) => (
                <TestimonialCard
                  key={rev.id}
                  text={lang === 'ar' ? rev.textAr : (rev.textEn || rev.textAr)}
                  author={lang === 'ar' ? rev.authorLabelAr : (rev.authorLabelEn || rev.authorLabelAr)}
                  rating={rev.rating}
                  index={i}
                />
              ))
            : HARDCODED_TESTIMONIALS.map((text, i) => (
                <TestimonialCard key={i} text={text} index={i} />
              ))}
        </div>
      </div>
    </section>
  );
}
