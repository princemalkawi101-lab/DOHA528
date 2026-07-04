import { useApp } from '@/lib/store';

const INSTAGRAM_URL = 'https://www.instagram.com/doham528?igsh=OWQ0ODVjZmgzN2Qx';
const TELEGRAM_URL = 'https://t.me/dohamalkawi528';
const WHATSAPP_URL = 'https://wa.me/qr/MZLIT6ZFXNXQA1';

export function BookCTA() {
  const { t, lang } = useApp();

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
            {/* Instagram */}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram — @doham528"
              className="group inline-flex items-center gap-2.5 bg-[rgba(0,0,0,0.25)] hover:bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.15)] hover:border-[hsl(var(--g400))] text-white font-semibold py-2.5 px-5 rounded-full transition-all hover:-translate-y-0.5 animate-shake"
            >
              <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#feda75] via-[#fa7e1e] via-40% to-[#d62976] to-70% flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none" />
                </svg>
              </span>
              <span className="text-sm">Instagram</span>
            </a>

            {/* Telegram */}
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Telegram — @dohamalkawi528"
              className="group inline-flex items-center gap-2.5 bg-[rgba(0,0,0,0.25)] hover:bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.15)] hover:border-[hsl(var(--g400))] text-white font-semibold py-2.5 px-5 rounded-full transition-all hover:-translate-y-0.5 animate-shake"
            >
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#37aee2] to-[#1e96c8] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="white" aria-hidden="true">
                  <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/>
                </svg>
              </span>
              <span className="text-sm">Telegram</span>
            </a>

            {/* WhatsApp */}
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="group inline-flex items-center gap-2.5 bg-[rgba(0,0,0,0.25)] hover:bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.15)] hover:border-[hsl(var(--g400))] text-white font-semibold py-2.5 px-5 rounded-full transition-all hover:-translate-y-0.5 animate-shake"
            >
              <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#25d366] to-[#128c7e] flex items-center justify-center shrink-0">
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" fill="white" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
              </span>
              <span className="text-sm">WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
