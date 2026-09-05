import { useEffect, useMemo, useState } from 'react';
import { SocialPlatformIcon } from '@/components/SocialPlatformIcon';
import { subscribeSiteSettings } from '@/lib/siteSettings';
import {
  normalizeSocialDestination,
  socialLinksOrDefaults,
  SocialLink,
  SocialPlatform,
} from '@/lib/socialLinks';
import { useApp } from '@/lib/store';

const ICON_STYLES: Partial<Record<SocialPlatform, string>> = {
  instagram: 'bg-gradient-to-tr from-[#feda75] via-[#fa7e1e] to-[#d62976]',
  telegram: 'bg-gradient-to-br from-[#37aee2] to-[#1e96c8]',
  whatsapp: 'bg-gradient-to-br from-[#25d366] to-[#128c7e]',
  facebook: 'bg-[#1877f2]',
  youtube: 'bg-[#ff0000]',
  tiktok: 'bg-[#111]',
  x: 'bg-[#111]',
  linkedin: 'bg-[#0a66c2]',
  snapchat: 'bg-[#fffc00] text-black',
};

export function BookCTA() {
  const { t, lang } = useApp();
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(() => socialLinksOrDefaults(undefined));

  useEffect(() => subscribeSiteSettings(
    (settings) => setSocialLinks(socialLinksOrDefaults(settings.socialLinks)),
    () => setSocialLinks(socialLinksOrDefaults(undefined)),
  ), []);

  const visibleSocialLinks = useMemo(() => socialLinks
    .filter((link) => link.active)
    .sort((a, b) => a.order - b.order)
    .map((link) => ({ ...link, href: normalizeSocialDestination(link.platform, link.destination) }))
    .filter((link): link is SocialLink & { href: string } => Boolean(link.href)), [socialLinks]);

  return (
    <section id="book" className="py-24 px-8 text-center bg-gradient-to-br from-[hsl(var(--p700))] via-[hsl(var(--p600))] to-[hsl(var(--p800))] relative overflow-hidden">
      <div className="absolute text-[rgba(212,160,23,0.12)] leading-none pointer-events-none -top-10 -right-10 text-[300px]">✧</div>
      <div className="absolute text-[rgba(212,160,23,0.12)] leading-none pointer-events-none -bottom-10 -left-10 text-[300px]">✦</div>
      
      <div className="relative z-10 max-w-3xl mx-auto">
        <h2 className="text-[clamp(1.8rem,3.5vw,2.5rem)] font-extrabold text-white mb-5">{t('cta.title')}</h2>
        <p className="text-[rgba(255,255,255,0.82)] text-[1.05rem] leading-[1.8] mb-10 max-w-[640px] mx-auto">
          {t('cta.desc')}
        </p>
        
        {/* ───── Social / Contact Links ───── */}
        <div className="mt-12 pt-8 border-t border-[rgba(255,255,255,0.12)] max-w-md mx-auto">
          <p className="text-[rgba(255,255,255,0.7)] text-sm font-semibold mb-5 tracking-wide">
            {lang === 'ar' ? 'تواصل معنا مباشرة' : 'Connect with us directly'}
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            {visibleSocialLinks.map((link) => {
              const label = lang === 'ar' ? (link.labelAr || link.labelEn) : (link.labelEn || link.labelAr);
              return (
                <a
                  key={link.id}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="group inline-flex items-center gap-2.5 bg-[rgba(0,0,0,0.25)] hover:bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.15)] hover:border-[hsl(var(--g400))] text-white font-semibold py-2.5 px-5 rounded-full transition-all hover:-translate-y-0.5 animate-shake"
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ICON_STYLES[link.platform] ?? 'bg-[hsl(var(--g500))]'}`}>
                    <SocialPlatformIcon platform={link.platform} className="w-[18px] h-[18px]" />
                  </span>
                  <span className="text-sm">{label}</span>
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
