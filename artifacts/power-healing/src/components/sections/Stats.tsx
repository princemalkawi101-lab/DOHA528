import { useApp } from '@/lib/store';

export function Stats() {
  const { t, lang } = useApp();

  return (
    <section id="stats" className="bg-gradient-to-br from-[hsl(var(--p800))] to-[hsl(var(--p700))] flex justify-center items-center flex-wrap py-10 px-8">
      <div className="flex flex-col items-center py-2 px-12 md:px-6">
        <span className="text-3xl font-black text-[hsl(var(--g300))] leading-none">{lang === 'ar' ? '+٢٠٠٠' : '+2,000'}</span>
        <span className="text-[rgba(255,255,255,0.75)] text-[0.9rem] mt-1">{t('stat.sessions')}</span>
      </div>
      <div className="w-px h-[50px] bg-[rgba(212,160,23,0.25)] hidden md:block" />
      
      <div className="flex flex-col items-center py-2 px-12 md:px-6">
        <span className="text-3xl font-black text-[hsl(var(--g300))] leading-none">{lang === 'ar' ? '١٠+' : '10+'}</span>
        <span className="text-[rgba(255,255,255,0.75)] text-[0.9rem] mt-1">{t('stat.years')}</span>
      </div>
      <div className="w-px h-[50px] bg-[rgba(212,160,23,0.25)] hidden md:block" />
      
      <div className="flex flex-col items-center py-2 px-12 md:px-6">
        <span className="text-3xl font-black text-[hsl(var(--g300))] leading-none">{lang === 'ar' ? '١٨' : '18'}</span>
        <span className="text-[rgba(255,255,255,0.75)] text-[0.9rem] mt-1">{t('stat.countries')}</span>
      </div>
      <div className="w-px h-[50px] bg-[rgba(212,160,23,0.25)] hidden md:block" />
      
      <div className="flex flex-col items-center py-2 px-12 md:px-6">
        <span className="text-3xl font-black text-[hsl(var(--g300))] leading-none">{lang === 'ar' ? '+٥٠' : '+50'}</span>
        <span className="text-[rgba(255,255,255,0.75)] text-[0.9rem] mt-1">{t('stat.certs')}</span>
      </div>
    </section>
  );
}
