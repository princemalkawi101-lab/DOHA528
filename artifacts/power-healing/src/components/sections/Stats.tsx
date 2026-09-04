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
  const [values, setValues] = useState<number[]>(() => STATS.map(() => 0));

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

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

    const duration = 1400;
    const startedAt = performance.now();
    let frameId = 0;

    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setValues(STATS.map((stat) => Math.round(stat.value * easedProgress)));
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [hasStarted]);

  const formatValue = (stat: Stat, value: number) => {
    const formatted = new Intl.NumberFormat(lang === 'ar' ? 'ar-EG' : 'en-US').format(value);
    return `${stat.prefix ?? ''}${formatted}${stat.suffix ?? ''}`;
  };

  return (
    <section
      ref={sectionRef}
      id="stats"
      className="bg-gradient-to-br from-[hsl(var(--p800))] to-[hsl(var(--p700))] flex justify-center items-center flex-wrap py-10 px-8"
    >
      {STATS.map((stat, index) => (
        <div key={stat.labelKey} className="contents">
          <div className="flex flex-col items-center py-2 px-12 md:px-6">
            <span className="text-3xl font-black text-[hsl(var(--g300))] leading-none tabular-nums">
              {formatValue(stat, values[index])}
            </span>
            <span className="text-[rgba(255,255,255,0.75)] text-[0.9rem] mt-1">{t(stat.labelKey)}</span>
          </div>
          {index < STATS.length - 1 && (
            <div className="w-px h-[50px] bg-[rgba(212,160,23,0.25)] hidden md:block" />
          )}
        </div>
      ))}
    </section>
  );
}
