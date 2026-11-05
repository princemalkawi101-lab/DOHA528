import { useState, type FormEvent, type ReactNode } from 'react';
import { CalendarDays, Clock, MapPin, Video, Crown, BookOpen, Gift, MessageCircle, Upload, Loader2, AlertCircle, CheckCircle2, Copy, Sparkles } from 'lucide-react';
import './Event.css';

export type EventMode = 'in-person' | 'online';
export interface EventAnnouncement { title?: string; body?: string; }
export interface EventPageProps {
  enabled?: boolean;
  portraitUrl?: string;
  backgroundUrl?: string;
  cliqAlias?: string;
  cliqName?: string;
  announcement?: EventAnnouncement | null;
  name: string;
  phone: string;
  onNameChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  receiptFile?: File | null;
  onReceiptChange: (f: File | null) => void;
  onSubmitInPerson: () => void;
  submitting?: boolean;
  submitError?: string | null;
  submitted?: boolean;
  paypalSlot?: ReactNode;
  onPayPal?: () => void;
  paypalPending?: boolean;
  paypalError?: string | null;
  paypalDone?: boolean;
}

const facts = [
  { icon: MapPin, label: 'المكان', value: 'الأردن، عمّان' },
  { icon: CalendarDays, label: 'التاريخ', value: 'السبت 21 نوفمبر 2026' },
  { icon: Clock, label: 'الوقت', value: '1:00 ظهرًا بتوقيت الأردن' },
  { icon: Sparkles, label: 'المدة', value: '3 ساعات' },
];
const perks = [
  { icon: Crown, t: 'مقعد VIP', d: 'مكانك محجوز في الصفوف الأولى، قريبًا من دعاء.' },
  { icon: BookOpen, t: 'برنامج مسجّل', d: 'تعود إليه متى احتجت، لتثبّت ما تعلّمته.' },
  { icon: Gift, t: 'دفتر امتنان مجاني', d: 'رفيقك اليومي لترسيخ التجسيد بعد الورشة.' },
  { icon: MessageCircle, t: 'جلسة أسئلة خاصة عبر Zoom', d: 'لقاء مباشر مع دعاء للإجابة عن أسئلتك.' },
];

export default function Event(p: EventPageProps) {
  const [mode, setMode] = useState<EventMode>('in-person');
  const [copied, setCopied] = useState(false);
  const enabled = p.enabled !== false;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!p.submitting && p.name.trim() && p.phone.trim() && p.receiptFile) p.onSubmitInPerson();
  };
  const copy = async () => {
    if (!p.cliqAlias) return;
    try { await navigator.clipboard.writeText(p.cliqAlias); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  };

  return (
    <div dir="rtl" className="ev pt-[68px] min-h-[100dvh]" data-testid="page-event">
      {/* HERO */}
      <section className="relative z-[2] overflow-hidden">
        {p.backgroundUrl && (
          <img src={p.backgroundUrl} alt="عمّان" className="absolute inset-0 w-full h-full object-cover opacity-25" data-testid="img-amman" />
        )}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg,hsl(42 45% 96%/.6),hsl(42 45% 96%) 92%)' }} />
        <div className="relative max-w-6xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-[1.15fr_.85fr] gap-12 items-center">
          <div>
            {p.announcement?.title && (
              <div className="ev-rise inline-flex items-center gap-2 rounded-full border border-[hsl(var(--gold)/.4)] bg-[hsl(var(--gold2)/.18)] px-4 py-1.5 text-sm font-bold mb-6" data-testid="text-announcement">
                <span className="w-2 h-2 rounded-full bg-[hsl(var(--gold))]" />{p.announcement.title}
                {p.announcement.body && <span className="font-medium opacity-75">— {p.announcement.body}</span>}
              </div>
            )}
            <p className="ev-rise text-[hsl(var(--gold))] font-bold tracking-wide mb-3" style={{ animationDelay: '.1s' }}>ورشة حيّة مع دعاء · عمّان</p>
            <h1 className="ev-rise font-black leading-[1.05] text-[clamp(3rem,8vw,6rem)] text-[hsl(var(--plum))]" style={{ animationDelay: '.2s' }} data-testid="text-title">ورشة النجاح</h1>
            <p className="ev-rise mt-4 text-[clamp(1.25rem,2.6vw,1.9rem)] font-bold leading-snug" style={{ animationDelay: '.3s' }}>
              التجسيد <span className="text-[hsl(var(--gold))]">من عالم الروح</span> إلى عالم المادة
            </p>
            <div className="ev-rise grid grid-cols-2 gap-3 mt-9 max-w-lg" style={{ animationDelay: '.45s' }}>
              {facts.map(f => (
                <div key={f.label} className="ev-card p-3.5 flex gap-3 items-start">
                  <f.icon className="w-5 h-5 text-[hsl(var(--gold))] shrink-0 mt-1" aria-hidden />
                  <div><div className="text-xs opacity-60">{f.label}</div><div className="font-bold text-sm">{f.value}</div></div>
                </div>
              ))}
            </div>
            <a href="#register" className="ev-rise ev-shine inline-block mt-9 rounded-full px-9 py-4 font-black text-lg shadow-[0_14px_40px_-12px_hsl(43_78%_40%/.6)] transition-transform hover:-translate-y-0.5" style={{ animationDelay: '.6s' }} data-testid="link-register">احجز مقعدك</a>
          </div>
          <div className="ev-rise relative mx-auto w-[min(360px,80vw)] aspect-[4/5]" style={{ animationDelay: '.35s' }}>
            <div className="ev-halo absolute -inset-6 rounded-full opacity-60" style={{ background: 'conic-gradient(from 0deg,transparent,hsl(44 90% 66%/.55),transparent 40%,hsl(267 53% 60%/.25),transparent 75%)' }} />
            <div className="absolute inset-0 rounded-t-full rounded-b-[28px] border border-[hsl(var(--gold)/.5)] translate-x-3 translate-y-3" />
            <div className="relative h-full rounded-t-full rounded-b-[28px] overflow-hidden bg-[hsl(var(--plum))]">
              {p.portraitUrl
                ? <img src={p.portraitUrl} alt="دعاء" className="w-full h-full object-cover" data-testid="img-portrait" />
                : <div className="w-full h-full grid place-items-center text-[hsl(var(--gold2))] text-6xl font-black">دعاء</div>}
            </div>
          </div>
        </div>
      </section>

      {/* PERKS */}
      <section className="relative z-[2] bg-[hsl(var(--plum))] text-[hsl(var(--iv))] py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-[.8fr_1.2fr] gap-12">
          <div>
            <p className="text-[hsl(var(--gold2))] font-bold mb-2">ما يرافقك</p>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black leading-tight">أكثر من ثلاث ساعات. رحلة تكمل معك بعدها.</h2>
          </div>
          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-8">
            {perks.map(k => (
              <li key={k.t} className="border-t border-[hsl(var(--gold2)/.35)] pt-5">
                <k.icon className="w-6 h-6 text-[hsl(var(--gold2))] mb-3" aria-hidden />
                <h3 className="font-black text-lg">{k.t}</h3>
                <p className="opacity-75 text-sm mt-1">{k.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* REGISTER */}
      <section id="register" className="relative z-[2] py-20 px-6 scroll-mt-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-[clamp(1.8rem,3.5vw,2.6rem)] font-black text-[hsl(var(--plum))]">اختر طريقة حضورك</h2>
          {!enabled ? (
            <div className="ev-card mt-10 p-10 text-center" data-testid="status-closed">
              <AlertCircle className="w-8 h-8 mx-auto text-[hsl(var(--gold))]" aria-hidden />
              <p className="font-bold mt-3">التسجيل مغلق حاليًا. تابعونا للإعلان القادم.</p>
            </div>
          ) : (
            <>
              <div role="tablist" className="grid grid-cols-2 gap-3 mt-10">
                {([
                  { m: 'in-person', icon: MapPin, t: 'حضوري في عمّان', price: '25 دينار', note: 'المقاعد محدودة' },
                  { m: 'online', icon: Video, t: 'أونلاين', price: '30 دولار', note: 'بث مباشر' },
                ] as const).map(o => (
                  <button key={o.m} role="tab" aria-selected={mode === o.m} onClick={() => setMode(o.m)} data-testid={`tab-${o.m}`}
                    className={`text-right rounded-[20px] p-5 border transition-all ${mode === o.m ? 'bg-[hsl(var(--plum))] text-[hsl(var(--iv))] border-transparent -translate-y-1 shadow-xl' : 'bg-white/50 border-[hsl(var(--gold)/.35)] hover:border-[hsl(var(--gold))]'}`}>
                    <o.icon className="w-5 h-5 text-[hsl(var(--gold))]" aria-hidden />
                    <div className="font-bold mt-2">{o.t}</div>
                    <div className="text-2xl sm:text-3xl font-black mt-1">{o.price}</div>
                    <div className="text-xs opacity-70 mt-1">{o.note}</div>
                  </button>
                ))}
              </div>

              <div key={mode} className="ev-rise ev-card mt-6 p-6 sm:p-8">
                {mode === 'in-person' ? (
                  p.submitted ? (
                    <div className="text-center py-6" data-testid="status-submitted">
                      <CheckCircle2 className="w-10 h-10 mx-auto text-[hsl(var(--gold))]" aria-hidden />
                      <p className="font-black text-xl mt-3">وصل طلبك</p>
                      <p className="opacity-70 mt-1">سنراجع الإيصال ونتواصل معك لتأكيد مقعدك.</p>
                    </div>
                  ) : (
                    <form onSubmit={submit} className="space-y-5">
                      <div className="rounded-2xl bg-[hsl(var(--iv2))] p-4">
                        <div className="text-sm opacity-70">ادفع 25 دينار عبر CliQ إلى</div>
                        <div className="flex items-center justify-between gap-3 mt-1">
                          <div>
                            <div className="font-black text-xl" dir="ltr" data-testid="text-cliq-alias">{p.cliqAlias || '—'}</div>
                            {p.cliqName && <div className="text-sm" data-testid="text-cliq-name">{p.cliqName}</div>}
                          </div>
                          {p.cliqAlias && (
                            <button type="button" onClick={copy} className="flex items-center gap-1.5 text-sm font-bold rounded-full border border-[hsl(var(--gold)/.5)] px-3 py-1.5 hover:bg-white" data-testid="button-copy-cliq">
                              <Copy className="w-4 h-4" aria-hidden />{copied ? 'تم النسخ' : 'نسخ'}
                            </button>
                          )}
                        </div>
                      </div>
                      <label className="block"><span className="font-bold text-sm">الاسم الكامل</span>
                        <input className="ev-in mt-1.5" value={p.name} onChange={e => p.onNameChange(e.target.value)} required autoComplete="name" data-testid="input-name" /></label>
                      <label className="block"><span className="font-bold text-sm">رقم الهاتف</span>
                        <input className="ev-in mt-1.5" dir="ltr" type="tel" value={p.phone} onChange={e => p.onPhoneChange(e.target.value)} required autoComplete="tel" data-testid="input-phone" /></label>
                      <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-[hsl(var(--gold)/.45)] p-5 text-center hover:bg-white/60 transition-colors">
                        <Upload className="w-6 h-6 mx-auto text-[hsl(var(--gold))]" aria-hidden />
                        <span className="block font-bold mt-2">{p.receiptFile ? p.receiptFile.name : 'ارفع صورة إيصال التحويل'}</span>
                         <input type="file" accept="image/*" className="sr-only" onChange={e => p.onReceiptChange(e.target.files?.[0] ?? null)} data-testid="input-receipt" />
                      </label>
                      {p.submitError && <p role="alert" className="text-sm font-bold text-[hsl(0_65%_42%)] flex gap-2 items-center" data-testid="text-submit-error"><AlertCircle className="w-4 h-4" aria-hidden />{p.submitError}</p>}
                      <button type="submit" disabled={p.submitting || !p.name.trim() || !p.phone.trim() || !p.receiptFile}
                        className="ev-shine w-full rounded-full py-4 font-black text-lg disabled:opacity-50 flex justify-center items-center gap-2" data-testid="button-submit">
                        {p.submitting && <Loader2 className="w-5 h-5 animate-spin" aria-hidden />}
                        {p.submitting ? 'جارٍ الإرسال' : 'أرسل طلب الحجز'}
                      </button>
                    </form>
                  )
                ) : p.paypalDone ? (
                  <div className="text-center py-6" data-testid="status-paypal-done">
                    <CheckCircle2 className="w-10 h-10 mx-auto text-[hsl(var(--gold))]" aria-hidden />
                    <p className="font-black text-xl mt-3">تم تأكيد دفعك</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <label className="block"><span className="font-bold text-sm">الاسم الكامل</span><input className="ev-in mt-1.5" value={p.name} onChange={e => p.onNameChange(e.target.value)} required autoComplete="name" /></label>
                    <label className="block"><span className="font-bold text-sm">رقم الهاتف</span><input className="ev-in mt-1.5" dir="ltr" type="tel" value={p.phone} onChange={e => p.onPhoneChange(e.target.value)} required autoComplete="tel" /></label>
                    <p className="opacity-80">ادفع 30 دولارًا بأمان عبر PayPal، وستصلك تفاصيل الدخول.</p>
                    {p.paypalSlot ?? (p.onPayPal && (
                      <button onClick={p.onPayPal} disabled={p.paypalPending} className="ev-shine w-full rounded-full py-4 font-black text-lg disabled:opacity-50 flex justify-center items-center gap-2" data-testid="button-paypal">
                        {p.paypalPending && <Loader2 className="w-5 h-5 animate-spin" aria-hidden />}الدفع عبر PayPal
                      </button>
                    ))}
                    {!p.paypalSlot && !p.onPayPal && <p className="text-sm opacity-60" data-testid="status-paypal-unavailable">الدفع الإلكتروني غير متاح حاليًا.</p>}
                    {p.paypalError && <p role="alert" className="text-sm font-bold text-[hsl(0_65%_42%)]" data-testid="text-paypal-error">{p.paypalError}</p>}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
