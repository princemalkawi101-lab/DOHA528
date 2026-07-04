import { Link } from 'wouter';
import { useApp } from '@/lib/store';
import { LogoSVG } from '@/components/icons';

export function Footer() {
  const { t, lang } = useApp();

  return (
    <footer className="bg-[hsl(var(--p900))] border-t border-[rgba(212,160,23,0.15)]">
      <div className="max-w-[1100px] mx-auto px-8 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <LogoSVG width="160" height="42" opacity="0.8" />
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
