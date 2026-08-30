import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import {
  DEFAULT_ABOUT_CONTENT,
  DEFAULT_CERTIFICATES,
  subscribeSiteSettings,
  type AboutContent,
  type Certificate,
} from '@/lib/siteSettings';

export function About() {
  const { t, lang } = useApp();
  const [aboutImageUrl, setAboutImageUrl] = useState<string>('/img/doha-profile.jpg');
  const [about, setAbout] = useState<AboutContent>(DEFAULT_ABOUT_CONTENT);
  const [certificates, setCertificates] = useState<Certificate[]>(DEFAULT_CERTIFICATES);

  useEffect(() => {
    return subscribeSiteSettings((s) => {
      if (s.aboutImageUrl) setAboutImageUrl(s.aboutImageUrl);
      setAbout({ ...DEFAULT_ABOUT_CONTENT, ...(s.about || {}) });
      setCertificates(s.certificates === undefined ? DEFAULT_CERTIFICATES : s.certificates);
    });
  }, []);

  const localized = (ar: string, en: string) => (lang === 'ar' ? ar : (en || ar));
  const visibleCertificates = certificates
    .filter((certificate) => certificate.active)
    .sort((a, b) => a.order - b.order);

  const handleBookClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById('products');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id="about" className="section bg-[hsl(var(--card))]">
      <div className="section-inner grid grid-cols-1 md:grid-cols-[1fr_1.6fr] gap-16 md:gap-12 items-center">
        {/* Profile Image with subtle energy/spirituality treatment */}
        <div className="relative max-w-[80%] md:max-w-none mx-auto md:mx-0">
          {/* outer soft golden glow */}
          <div
            aria-hidden
            className="absolute -inset-3 rounded-[24px] pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 50% 50%, rgba(212,160,23,0.25), rgba(212,160,23,0.08) 55%, transparent 75%)',
              filter: 'blur(14px)',
            }}
          />
          <div className="relative">
            <img
              className="w-full rounded-[20px] shadow-[0_20px_60px_rgba(90,45,145,0.35)] object-cover aspect-[3/4]"
              src={aboutImageUrl}
              alt="Doha Malkawi"
              loading="lazy"
            />
            {/* subtle warm color treatment overlay */}
            <div
              aria-hidden
              className="absolute inset-0 rounded-[20px] pointer-events-none mix-blend-soft-light"
              style={{
                background:
                  'linear-gradient(140deg, rgba(255,210,140,0.25) 0%, rgba(255,255,255,0) 45%, rgba(90,45,145,0.18) 100%)',
              }}
            />
            {/* top corner gentle light flare */}
            <div
              aria-hidden
              className="absolute top-0 left-0 w-1/2 h-1/3 pointer-events-none rounded-tl-[20px]"
              style={{
                background:
                  'radial-gradient(ellipse at top left, rgba(255,235,180,0.35), transparent 70%)',
              }}
            />
          </div>
          <div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-bold text-[0.85rem] py-2.5 px-6 rounded-full whitespace-nowrap shadow-[0_4px_20px_rgba(212,160,23,0.4)]"
            style={{ backgroundColor: 'hsl(var(--g500))', color: 'hsl(var(--p900))' }}
          >
            {localized(about.badgeAr, about.badgeEn)}
          </div>
        </div>

        <div>
          <span className="section-label">{localized(about.labelAr, about.labelEn)}</span>
          <h2 className="section-title">{localized(about.titleAr, about.titleEn)}</h2>
          <p className="text-[hsl(var(--muted-foreground))] text-[1.02rem] mb-5 leading-[2.05] tracking-[0.005em]">
            {localized(about.paragraph1Ar, about.paragraph1En)}
          </p>
          <p className="text-[hsl(var(--muted-foreground))] text-[1.02rem] mb-5 leading-[2.05] tracking-[0.005em]">
            {localized(about.paragraph2Ar, about.paragraph2En)}
          </p>
          <p className="text-[hsl(var(--p800))] text-[1.05rem] mb-6 leading-[2] font-semibold italic">
            {localized(about.paragraph3Ar, about.paragraph3En)}
          </p>

          <div className={`bg-[hsl(var(--muted))] py-5 px-6 rounded-xl my-6 ${lang === 'ar' ? 'border-r-4' : 'border-l-4'} border-[hsl(var(--g500))]`}>
            <p className="text-[0.98rem] font-bold text-[hsl(var(--p800))] mb-3">
              {localized(about.certificatesTitleAr, about.certificatesTitleEn)}
            </p>
            <ul className="list-none flex flex-col gap-2">
              {visibleCertificates.map((certificate, index) => (
                <li
                  key={certificate.id}
                  className={`text-[0.94rem] ${
                    index === visibleCertificates.length - 1
                      ? 'text-[hsl(var(--p800))] font-bold mt-1'
                      : 'text-[hsl(var(--muted-foreground))]'
                  }`}
                >
                  {index === visibleCertificates.length - 1 ? '✨' : '✦'}{' '}
                  {localized(certificate.titleAr, certificate.titleEn)}
                </li>
              ))}
            </ul>
          </div>

          <a
            href="#products"
            onClick={handleBookClick}
            style={{ backgroundColor: 'hsl(var(--g500))', color: 'hsl(var(--p900))' }}
            className="inline-block font-bold text-base py-3.5 px-8 rounded-full transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(212,160,23,0.35)] border-0 cursor-pointer"
          >
            {localized(about.ctaAr, about.ctaEn)}
          </a>
        </div>
      </div>
    </section>
  );
}
