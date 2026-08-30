import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { useApp } from '@/lib/store';
import { fetchReviews, HARDCODED_TESTIMONIALS, type Review } from '@/lib/reviews';

function TestimonialCard({ text, author, rating, index }: { text: string; author?: string; rating?: number; index: number }) {
  const stars = Math.min(5, Math.max(1, rating ?? 5));
  return (
    <article
      className="relative h-full bg-[rgba(30,14,56,0.75)] rounded-2xl p-6 sm:p-7 border border-[rgba(212,160,23,0.18)] shadow-[0_4px_24px_rgba(0,0,0,0.25)] hover:shadow-[0_10px_36px_rgba(212,160,23,0.18)] hover:border-[rgba(212,160,23,0.45)] transition-all duration-300 flex flex-col"
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
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    fetchReviews()
      .then((list) => setFirestoreReviews(list))
      .catch(() => setFirestoreReviews([]));
  }, []);

  const activeFirestore = firestoreReviews?.filter((r) => r.active) ?? [];
  const useFirestore = firestoreReviews !== null && activeFirestore.length > 0;
  const testimonials = useFirestore
    ? activeFirestore.map((rev) => ({
        id: rev.id,
        text: lang === 'ar' ? rev.textAr : (rev.textEn || rev.textAr),
        author: lang === 'ar' ? rev.authorLabelAr : (rev.authorLabelEn || rev.authorLabelAr),
        rating: rev.rating,
      }))
    : HARDCODED_TESTIMONIALS.map((text, index) => ({
        id: `fallback-${index}`,
        text,
        author: undefined,
        rating: undefined,
      }));
  const isRtl = lang === 'ar';
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    direction: isRtl ? 'rtl' : 'ltr',
    loop: testimonials.length > 1,
  });

  const updateSelectedIndex = useCallback(() => {
    if (emblaApi) setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit({
      align: 'start',
      direction: isRtl ? 'rtl' : 'ltr',
      loop: testimonials.length > 1,
    });
    updateSelectedIndex();
    emblaApi.on('select', updateSelectedIndex);
    emblaApi.on('reInit', updateSelectedIndex);
    return () => {
      emblaApi.off('select', updateSelectedIndex);
      emblaApi.off('reInit', updateSelectedIndex);
    };
  }, [emblaApi, isRtl, testimonials.length, updateSelectedIndex]);

  const previousLabel = isRtl ? 'الشهادة السابقة' : 'Previous testimonial';
  const nextLabel = isRtl ? 'الشهادة التالية' : 'Next testimonial';
  const goToLabel = isRtl ? 'الانتقال إلى الشهادة' : 'Go to testimonial';

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

        <div className="mt-8" dir={isRtl ? 'rtl' : 'ltr'}>
          <div ref={emblaRef} className="overflow-hidden cursor-grab active:cursor-grabbing" aria-roledescription="carousel">
            <div className="flex gap-5 sm:gap-6 touch-pan-y">
              {testimonials.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className="min-w-0 flex-[0_0_88%] sm:flex-[0_0_58%] lg:flex-[0_0_31.5%]"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} ${isRtl ? 'من' : 'of'} ${testimonials.length}`}
                >
                  <TestimonialCard
                    text={testimonial.text}
                    author={testimonial.author}
                    rating={testimonial.rating}
                    index={index}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => emblaApi?.scrollPrev()}
              disabled={!emblaApi || testimonials.length < 2}
              aria-label={previousLabel}
              className="grid h-10 w-10 place-items-center rounded-full border border-[rgba(212,160,23,0.35)] text-[hsl(var(--g300))] transition-colors hover:bg-[rgba(212,160,23,0.16)] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <span aria-hidden="true">{isRtl ? '→' : '←'}</span>
            </button>
            <div className="flex items-center gap-2" role="tablist" aria-label={isRtl ? 'شرائح آراء العميلات' : 'Testimonial slides'}>
              {testimonials.map((testimonial, index) => (
                <button
                  key={testimonial.id}
                  type="button"
                  role="tab"
                  aria-selected={selectedIndex === index}
                  aria-label={`${goToLabel} ${index + 1}`}
                  onClick={() => emblaApi?.scrollTo(index)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    selectedIndex === index
                      ? 'w-7 bg-[hsl(var(--g400))]'
                      : 'w-2.5 bg-[rgba(255,255,255,0.28)] hover:bg-[rgba(255,255,255,0.5)]'
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => emblaApi?.scrollNext()}
              disabled={!emblaApi || testimonials.length < 2}
              aria-label={nextLabel}
              className="grid h-10 w-10 place-items-center rounded-full border border-[rgba(212,160,23,0.35)] text-[hsl(var(--g300))] transition-colors hover:bg-[rgba(212,160,23,0.16)] disabled:cursor-not-allowed disabled:opacity-35"
            >
              <span aria-hidden="true">{isRtl ? '←' : '→'}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
