import { useState } from 'react';
import { useApp } from '@/lib/store';

export function FAQ() {
  const { t, lang } = useApp();
  const [openId, setOpenId] = useState<number | null>(null);

  const faqs = [1, 2, 3, 4, 5];

  const toggleFaq = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section id="faq" className="section bg-white">
      <div className="section-inner">
        <div className="section-header">
          <span className="section-label">{t('faq.label')}</span>
          <h2 className="section-title">{t('faq.title')}</h2>
          <p className="section-desc">{t('faq.desc')}</p>
        </div>
        
        <div className="max-w-[800px] mx-auto flex flex-col gap-3">
          {faqs.map(i => (
            <div 
              key={i} 
              className={`border rounded-[14px] overflow-hidden transition-colors ${openId === i ? 'border-[hsl(var(--p400))]' : 'border-[rgba(90,45,145,0.12)]'}`}
            >
              <button 
                onClick={() => toggleFaq(i)}
                className={`w-full flex justify-between items-center gap-4 p-5 bg-transparent border-none cursor-pointer font-sans text-base font-semibold text-[hsl(var(--p900))] transition-colors ${lang === 'en' ? 'text-left' : 'text-right'} ${openId === i ? 'bg-[hsl(var(--muted))]' : ''}`}
              >
                <span>{t(`faq.q${i}`)}</span>
                <span className="text-[1.4rem] text-[hsl(var(--g500))] shrink-0">{openId === i ? '−' : '+'}</span>
              </button>
              
              {openId === i && (
                <div className="p-5 pt-1 text-[hsl(var(--muted-foreground))] text-[0.95rem] leading-[1.85] border-t border-[rgba(90,45,145,0.08)] bg-[hsl(var(--muted))]">
                  {t(`faq.a${i}`)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
