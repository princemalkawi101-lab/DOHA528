import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { useApp } from '@/lib/store';
import { MasahaLogo } from '@/components/icons';
import { SocialPlatformIcon } from '@/components/SocialPlatformIcon';
import { subscribeSiteSettings } from '@/lib/siteSettings';
import { normalizeSocialDestination, sanitizeSocialLinks, SocialLink } from '@/lib/socialLinks';

export function Footer() {
  const { t, lang } = useApp();
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  useEffect(() => subscribeSiteSettings(
    (settings) => setSocialLinks(sanitizeSocialLinks(settings.socialLinks)),
    () => setSocialLinks([]),
  ), []);

  const visibleSocialLinks = useMemo(() => socialLinks
    .filter((link) => link.active)
    .sort((a, b) => a.order - b.order)
    .map((link) => ({ ...link, href: normalizeSocialDestination(link.platform, link.destination) }))
    .filter((link): link is SocialLink & { href: string } => Boolean(link.href)), [socialLinks]);

  return (
    <footer className="bg-[hsl(var(--p900))] border-t border-[rgba(212,160,23,0.15)]">
      <div className="max-w-[1100px] mx-auto px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <MasahaLogo width={88} height={88} opacity="0.8" />
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2" aria-label="Legal links">
            <Link
              href="/privacy-policy"
              className="text-[rgba(255,255,255,0.45)] text-[0.82rem] hover:text-[hsl(var(--g300))] transition-colors whitespace-nowrap"
            >
              {lang === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </Link>
            <Link
              href="/terms"
              className="text-[rgba(255,255,255,0.45)] text-[0.82rem] hover:text-[hsl(var(--g300))] transition-colors whitespace-nowrap"
            >
              {lang === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
            </Link>
          </nav>

          <div className="text-[rgba(255,255,255,0.35)] text-[0.82rem]">
            {t('footer.copy')}
          </div>
        </div>

        {visibleSocialLinks.length > 0 && (
          <div className="mt-7 pt-6 border-t border-[rgba(255,255,255,0.07)] text-center">
            <p className="text-[rgba(255,255,255,0.48)] text-xs font-semibold mb-4">
              {lang === 'ar' ? 'تابعونا وتواصلوا معنا' : 'Follow and connect with us'}
            </p>
            <nav className="flex flex-wrap items-center justify-center gap-3" aria-label={lang === 'ar' ? 'حسابات التواصل الاجتماعي' : 'Social media accounts'}>
              {visibleSocialLinks.map((link) => {
                const label = lang === 'ar' ? (link.labelAr || link.labelEn) : (link.labelEn || link.labelAr);
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(212,160,23,0.28)] bg-[rgba(255,255,255,0.045)] text-[hsl(var(--g300))] transition-all duration-300 hover:-translate-y-1 hover:border-[hsl(var(--g400))] hover:bg-[rgba(212,160,23,0.13)] hover:shadow-[0_8px_24px_rgba(212,160,23,0.13)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--g400))]"
                  >
                    <SocialPlatformIcon platform={link.platform} className="text-[1.15rem] transition-transform duration-300 group-hover:scale-110" />
                  </a>
                );
              })}
            </nav>
          </div>
        )}

        {/* ───── Developer Credit ───── */}
        <div className="mt-6 pt-5 border-t border-[rgba(255,255,255,0.06)] text-center">
          <p className="text-[0.75rem] tracking-wide font-light" style={{ color: 'rgba(255,255,255,0.22)' }}>
            Developed by{' '}
            <a
              href="https://www.instagram.com/devlogic_web?igsh=ejE2NDd6MGhocjVh"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold tracking-widest uppercase transition-all duration-300 hover:tracking-[0.2em]"
              style={{
                color: 'rgba(255,255,255,0.38)',
                textDecorationLine: 'underline',
                textDecorationColor: 'transparent',
                textUnderlineOffset: '3px',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = 'hsl(var(--g300))';
                (e.currentTarget as HTMLAnchorElement).style.textDecorationColor = 'hsl(var(--g400))';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.38)';
                (e.currentTarget as HTMLAnchorElement).style.textDecorationColor = 'transparent';
              }}
            >
              DEV LOGIC
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
