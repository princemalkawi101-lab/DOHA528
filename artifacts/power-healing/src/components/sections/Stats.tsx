import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/lib/store';

type Stat = {
  value: number;
  prefix?: string;
  suffix?: string;
  labelKey: string;
};

const STATS: Stat[] = [
  { value: 2000, prefix: '+', labelKey: 'stat.sessions' },
  { value: 10, suffix: '+', labelKey: 'stat.years' },
  { value: 18, labelKey: 'stat.countries' },
  { value: 50, prefix: '+', labelKey: 'stat.certs' },
];

export function Stats() {
  const { t, lang } = useApp();
  const sectionRef = useRef<HTMLElement>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    if (typeof IntersectionObserver === 'undefined') {
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setHasStarted(true);
        observer.disconnect();
      }
    }, { threshold: 0.2 });

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setProgress(1);
      return;
    }

    const duration = 1650;
    const startedAt = performance.now();
    let frameId = 0;

    const animate = (now: number) => {
      const nextProgress = Math.min((now - startedAt) / duration, 1);
      setProgress(nextProgress);
      if (nextProgress < 1) frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [hasStarted]);

  const formatValue = (stat: Stat, value: number) => {
    const formatted = new Intl.NumberFormat(
      lang === 'ar' ? 'ar-EG' : 'en-US',
      { useGrouping: lang !== 'ar' },
    ).format(value);
    return `${stat.prefix ?? ''}${formatted}${stat.suffix ?? ''}`;
  };

  const animatedValue = (stat: Stat, index: number) => {
    const delay = index * 0.045;
    const itemProgress = Math.max(0, Math.min(1, (progress - delay) / (1 - delay)));
    const easedProgress = 1 - Math.pow(1 - itemProgress, 3);
    return Math.round(stat.value * easedProgress);
  };

  return (
    <section
      ref={sectionRef}
      id="stats"
      className="bg-gradient-to-br from-[hsl(var(--p800))] to-[hsl(var(--p700))] py-10 px-5 sm:px-8"
    >
      <div className="mx-auto grid w-full max-w-[900px] grid-cols-2 gap-y-7 md:grid-cols-4 md:gap-y-0">
        {STATS.map((stat, index) => (
          <div key={stat.labelKey} className="relative flex min-w-0 flex-col items-center px-3 py-2 sm:px-6">
            <span
              className="inline-flex min-w-[7ch] justify-center text-center text-3xl font-black text-[hsl(var(--g300))] leading-none tabular-nums"
              aria-label={formatValue(stat, stat.value)}
            >
              {formatValue(stat, animatedValue(stat, index))}
            </span>
            <span className="mt-1 whitespace-nowrap text-[0.9rem] text-[rgba(255,255,255,0.75)]">
              {t(stat.labelKey)}
            </span>
            {index < STATS.length - 1 && (
              <div className="absolute top-1/2 left-0 hidden h-[50px] w-px -translate-y-1/2 bg-[rgba(212,160,23,0.25)] md:block" />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
