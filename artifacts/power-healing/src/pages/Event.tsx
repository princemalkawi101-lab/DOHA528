import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { CalendarDays, Clock, MapPin, Video, Crown, BookOpen, Gift, MessageCircle, Upload, Loader2, AlertCircle, CheckCircle2, Copy, Sparkles, ArrowLeft, Check } from 'lucide-react';
import dohaAmmanImage from '../assets/doha-amman.webp';
import dohaGardenImage from '../assets/doha-mentor-garden.webp';
import dohaSeatedImage from '../assets/doha-mentor-seated.webp';
import dohaDeskImage from '../assets/doha-mentor-desk.webp';
import EventExperienceSection from './EventExperienceSection';
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
  email: string;
  onEmailChange: (v: string) => void;
  onVipOffer?: () => void;
  bookingControls?: ReactNode;
  existingBooking?: ReactNode;
  registrationLoading?: boolean;
  registrationError?: string;
  onRetryRegistration?: () => void;
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
  { icon: Crown, t: 'مقعد VIP', d: 'مكانك محجوز في الصفوف الأولى، قريبًا من دوحة.' },
  { icon: BookOpen, t: 'برنامج مسجّل', d: 'تعود إليه متى احتجت، لتثبّت ما تعلّمته.' },
  { icon: Gift, t: 'دفتر امتنان مجاني', d: 'رفيقك اليومي لترسيخ التجسيد بعد الورشة.' },
  { icon: MessageCircle, t: 'جلسة أسئلة خاصة عبر Zoom', d: 'لقاء مباشر مع دوحة للإجابة عن أسئلتك.' },
];
const bioImages = [
  { src: dohaGardenImage, alt: 'ضحى ملكاوي في صورة خارجية' },
  { src: dohaSeatedImage, alt: 'ضحى ملكاوي جالسة على كرسي' },
  { src: dohaDeskImage, alt: 'ضحى ملكاوي جالسة على مكتب وتكتب في دفتر' },
];

export default function Event(p: EventPageProps) {
  const [mode, setMode] = useState<EventMode>('in-person');
  const [copied, setCopied] = useState(false);
  const [bioImageIndex, setBioImageIndex] = useState(0);
  const [receiptPreview, setReceiptPreview] = useState('');
  const [receiptPreviewError, setReceiptPreviewError] = useState(false);
  const enabled = p.enabled !== false;

  useEffect(() => {
    setReceiptPreviewError(false);
    if (!p.receiptFile) { setReceiptPreview(''); return; }
    const url = URL.createObjectURL(p.receiptFile);
    setReceiptPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [p.receiptFile]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setBioImageIndex(current => (current + 1) % bioImages.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!p.submitting && p.name.trim() && p.phone.trim() && p.email.trim() && p.receiptFile) p.onSubmitInPerson();
  };
  const copy = async () => {
    if (!p.cliqAlias) return;
    try { await navigator.clipboard.writeText(p.cliqAlias); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ }
  };

  return (
    <div dir="rtl" className="ev" data-testid="page-event">
      <div className="ev-wash" aria-hidden="true"><i className="ev-wash-a" /><i className="ev-wash-b" /><i className="ev-wash-c" /><i className="ev-wash-d" /></div>
      <header className="ev-hero" id="top">
        <figure className="ev-hero-portrait">
          <img
            src={p.portraitUrl || dohaAmmanImage}
            alt="Master Doha Malkawi in Amman, Jordan"
            className="ev-portrait-image"
            data-testid="img-portrait"
          />
          <figcaption className="ev-portrait-caption" dir="ltr" data-testid="text-location">
            <span className="ev-loc-country">JORDAN</span>
            <span className="ev-loc-city">AMMAN</span>
          </figcaption>
        </figure>
      </header>

      <main>
        <section className="ev-intro" id="details">
          <div className="ev-section-index"><span>01</span><i /></div>
          <div className="ev-intro-copy">
            <p className="ev-eyebrow">من عالم الروح إلى عالم المادة</p>
            <h1 className="ev-intro-title" data-testid="text-title">تجسيد النجاح</h1>
            <p className="ev-intro-lead">ماذا لو كان النجاح الذي تبحث عنه… احتمال موجود في أعماقك ينتظر أن تختار تجسيده</p>
            <div className="ev-intro-body">
              <p>هناك نجاحات لم تُخلق لتبقى مجرد احتمالات في داخلك.</p>
              <p>هناك خبرات، إمكانيات، ونسخ منك تنتظر أن تُستدعى إلى واقعك.</p>
              <p>في هذه التجربة الحضورية، سننطلق من مستوى الروح، لنفتح مساحة جديدة للوعي بالنجاح، ونستكشف ما يعنيه أن تنتقل من معرفة الإمكانيات التي تحملها إلى عيشها وتجسيدها في حياتك الحالية.</p>
              <p>النجاح ليس مجرد إنجاز تصل إليه…<br />بل وعي تختاره، وإمكانيات تسمح لها بالظهور، وواقع تبدأ بخلقه من خلال اختياراتك.</p>
            </div>
            <div className="ev-intro-signoff">
              <strong>تجسيد النجاح</strong>
              <p>تجربة انتقال من عالم الروح إلى عالم المادة.</p>
              <span>مع <bdi dir="ltr">Master Doha Malkawi</bdi></span>
            </div>
            <section className="ev-content-block" aria-labelledby="ev-waiting-title">
              <h2 id="ev-waiting-title">هل تشعر انك هناك شيء اكبر ينتظرك</h2>
              <div className="ev-content-body">
                <p>ربما تعرف أنك تحمل إمكانيات عظيمة، لكن واقعك الحالي لا يعكس بالكامل ما تشعر به في أعماقك.</p>
                <p>ربما لديك أحلام، طموحات، ورغبة في التوسع، لكنك ما زلت تتساءل:</p>
                <ul className="ev-question-list">
                  <li>لماذا أشعر أن النجاح قريب مني، لكنه لم يتجسد بالكامل في حياتي؟</li>
                  <li>ماذا لو كان النجاح أوسع بكثير من المفهوم الذي اعتدت عليه؟</li>
                  <li>هل يمكنني أن أعيش خبرات جديدة من النجاح، بدلًا من تكرار نفس الأنماط والنتائج؟</li>
                  <li>كيف أسمح لإمكانياتي الروحية أن تصبح اختيارات وتجارب ملموسة في حياتي؟</li>
                  <li>ماذا لو أن النسخة التي أعيشها اليوم قادرة على استقبال مستوى جديد من النجاح؟</li>
                </ul>
                <p>هذه الورشة مساحة لاستكشاف هذه الأسئلة، وتوسيع إدراكك لما هو ممكن، والانفتاح على طريقة جديدة في خلق واقعك.</p>
              </div>
            </section>
            <section className="ev-content-block ev-experience-block" aria-labelledby="ev-experience-title">
              <h2 id="ev-experience-title">ماذا سنختبر معا؟</h2>
              <ul className="ev-experience-list">
                <li>✨ استكشاف مكتبتك الروحية وإمكانيات النجاح.</li>
                <li>✨ تفعيل شيفرات وكودات النجاح ضمن تجربتك الحالية.</li>
                <li>✨ توسيع وعيك بالنجاح من منظور روحي مختلف.</li>
                <li>✨ فتح احتمالات جديدة للمال، الاستقبال، الخلق، والتوسع.</li>
                <li>✨ الانتقال من الوعي بالنجاح إلى اختيارات وتجارب تجسّده في واقعك.</li>
              </ul>
            </section>
            <section className="ev-content-block ev-takeaway-block" aria-labelledby="ev-takeaway-title">
              <h2 id="ev-takeaway-title">ماذا ستأخذ معك من الورشة؟</h2>
              <div className="ev-content-body">
                <p>هذه التجربة ليست مجرد معلومات عن النجاح، بل مساحة للعمل الداخلي والتأمل والتوسع.</p>
                <p>ستخرج منها وأنت تحمل:</p>
                <ul className="ev-experience-list">
                  <li>✨ وعيًا أوسع بمفهوم النجاح الروحي والتجسيد.</li>
                  <li>✨ تجربة لاستكشاف مكتبتك الروحية وإمكانيات النجاح التي تحملها.</li>
                  <li>✨ مساحة جديدة لاستقبال شيفرات وكودات النجاح ضمن ممارستك الروحية.</li>
                  <li>✨ إدراكًا أعمق للعلاقة بين الوعي، الاختيار، والفعل.</li>
                  <li>✨ أدوات وأسئلة تساعدك على استكشاف احتمالات جديدة في حياتك.</li>
                  <li>✨ بداية جديدة لعلاقتك مع النجاح، من الداخل إلى الخارج.</li>
                </ul>
              </div>
            </section>
            <section className="ev-content-block ev-bio-block" aria-labelledby="ev-bio-title">
              <h2 id="ev-bio-title">من هي ضحى؟</h2>
              <div className="ev-bio-layout">
                <figure className="ev-bio-photo" aria-label="صور ضحى ملكاوي">
                  <div className="ev-bio-photo-frame">
                    <img
                      key={bioImageIndex}
                      src={bioImages[bioImageIndex].src}
                      alt={bioImages[bioImageIndex].alt}
                      className="ev-bio-image"
                      data-testid="img-bio-portrait"
                    />
                    <span className="ev-bio-photo-caption"><bdi dir="ltr">Master Doha Malkawi</bdi></span>
                  </div>
                  <div className="ev-bio-photo-dots" aria-hidden="true">
                    {bioImages.map((image, index) => (
                      <span key={image.src} className={index === bioImageIndex ? 'is-active' : ''} />
                    ))}
                  </div>
                </figure>
                <div className="ev-bio-copy">
                  <p className="ev-bio-name"><bdi dir="ltr">Master Doha Malkawi</bdi></p>
                  <p className="ev-bio-role">مرشدة الحب والنور | <bdi dir="ltr">Spiritual Mentor</bdi></p>
                  <p>ضحى ملكاوي، مرشدة ومدربة في علوم الوعي والطاقة والتحول الروحي، بخبرة تمتد لسنوات في مرافقة الأشخاص نحو استكشاف إمكانياتهم، وتوسيع إدراكهم، وخلق مساحات جديدة في حياتهم.</p>
                  <p>من خلال رحلتها في علوم الوعي والبحث المستمر عن التجسيد والتحول والقفز الكمي ، تقدم ضحى تجارب تجمع بين العمق الروحي، استكشاف الذات، وفتح احتمالات جديدة للخلق والتجسيد.</p>
                  <p>في ورشة «تجسيد النجاح »، تدعوك ضحى إلى تجربة مختلفة؛ رحلة تبدأ من الداخل، وتفتح مساحة للنجاح كي يصبح جزءاً من واقعك.</p>
                </div>
              </div>
            </section>
            <section className="ev-content-block ev-closing-block" aria-labelledby="ev-closing-title">
              <h2 id="ev-closing-title">احجز مكانك في تجربة النجاح التجسيد</h2>
              <p className="ev-closing-name">تجسيد النجاح</p>
              <p className="ev-closing-tagline">من عالم الروح إلى عالم المادة</p>
              <div className="ev-content-body">
                <p>تجربة حضورية في الأردن مع <bdi dir="ltr">Master Doha Malkawi</bdi>.</p>
                <h3 className="ev-closing-details-title">التفاصيل:</h3>
                <ul className="ev-closing-details">
                  <li>📍 المكان: الاردن - عمان</li>
                  <li>📅 التاريخ: 21 نوفمبر 2026</li>
                  <li>🕰️ الوقت: من 1 مساءً - 4 مساءً بتوقيت الأردن</li>
                  <li>⏳ مدة الورشة: 3 ساعات</li>
                  <li>🎟️ قيمة الاستثمار: للحضور 25 دينار للشخص الواحد</li>
                </ul>
                <p>عدد المقاعد محدود لضمان مساحة مريحة وعميقة لجميع المشاركين.</p>
                <p className="ev-closing-question">هل أنت مستعد لفتح احتمالات جديدة للنجاح؟</p>
                <p>قد لا تحتاج إلى أن تصبح شخص آخر كي تعيش النجاح.</p>
                <p>ربما تحتاج أن تسمح لإمكانيات جديدة أن تظهر من خلالك، وأن تختار أن تعيشها في هذا الجسد، في هذه الحياة، وفي واقعك الحالي.</p>
                <p className="ev-closing-tagline">من عالم الروح… إلى عالم المادة.</p>
                <p>احجز مكانك الآن، وكن جزء من تجربة تجسيد النجاح</p>
              </div>
              <a href="#register" className="ev-closing-cta" data-testid="link-register">أريد حجز مكاني <ArrowLeft aria-hidden="true" /></a>
              <EventExperienceSection onVipOffer={p.onVipOffer} />
            </section>
          </div>
        </section>

        <section className="ev-facts-section" aria-label="تفاصيل الورشة">
          <div className="ev-facts-header">
            <span className="ev-eyebrow">كل ما تحتاج معرفته</span>
            <span className="ev-facts-rule" />
            <span className="ev-facts-date">السبت 21 نوفمبر 2026</span>
          </div>
          <div className="ev-facts-grid">
            {facts.map((f, i) => (
              <article key={f.label} className="ev-fact">
                <span className="ev-fact-number">0{i + 1}</span>
                <f.icon aria-hidden="true" />
                <span className="ev-fact-label">{f.label}</span>
                <strong>{f.value}</strong>
              </article>
            ))}
          </div>
        </section>

        <section className="ev-includes">
          <div className="ev-includes-head">
            <div className="ev-section-index ev-section-index-light"><span>02</span><i /></div>
            <p className="ev-eyebrow">ما يرافقك</p>
            <h2>أكثر من ثلاث ساعات.<br /><em>رحلة تكمل معك بعدها.</em></h2>
            <p className="ev-includes-intro">مع حضورك، تحصل على هذه المزايا:</p>
          </div>
          <ul className="ev-perks">
            {perks.map((k, i) => (
              <li key={k.t} className="ev-perk">
                <span className="ev-perk-num">0{i + 1}</span>
                <div className="ev-perk-icon"><k.icon aria-hidden="true" /></div>
                <div><h3>{k.t}</h3><p>{k.d}</p></div>
                <Check className="ev-perk-check" aria-hidden="true" />
              </li>
            ))}
          </ul>
          <div className="ev-includes-ornament" aria-hidden="true">∿</div>
        </section>

        <section className="ev-register-section" id="register">
          <div className="ev-register-heading">
            <div className="ev-section-index"><span>03</span><i /></div>
            <div>
              <p className="ev-eyebrow">موعدنا في 21 نوفمبر</p>
              <h2>اختر طريقة<br /><em>حضورك.</em></h2>
            </div>
            <p className="ev-register-lead">مكانك في اللقاء يبدأ من هنا.<br />احجز مباشرة بالاسم والهاتف والإيميل، بدون حساب أو كلمة مرور.</p>
          </div>

          {p.registrationError && !p.registrationLoading && (
            <div className="ev-closed ev-registration-warning" role="status" data-testid="event-registration-error">
              <AlertCircle aria-hidden="true" />
              <div>
              <p>تعذّر التحقق من تسجيلك حاليًا. يمكنك استعراض التذاكر واختيار طريقة الحضور أدناه، لكن يجب التحقق قبل بدء الدفع أو تأكيد الحجز لتجنب تكرار الدفع.</p>
              <p className="text-sm break-words" data-testid="event-registration-diagnostic">{p.registrationError}</p>
              <button type="button" className="font-bold underline" onClick={p.onRetryRegistration}>إعادة التحقق من التسجيل</button>
              </div>
            </div>
          )}
          {p.registrationLoading ? <p role="status">جارٍ تحميل حالة التسجيل…</p> : !enabled ? (
            <div className="ev-closed" data-testid="status-closed">
              <AlertCircle aria-hidden="true" />
              <p>التسجيل مغلق حاليًا. تابعونا للإعلان القادم.</p>
            </div>
          ) : (
            <div className="ev-booking">
              <div className="ev-package-list" role="tablist" aria-label="اختيار طريقة الحضور">
                {([
                  { m: 'in-person', icon: MapPin, t: 'حضوري في عمّان', price: '25', currency: 'دينار', note: 'المقاعد محدودة' },
                  { m: 'online', icon: Video, t: 'أونلاين', price: '30', currency: 'دولار', note: 'بث مباشر' },
                ] as const).map(o => (
                  <button key={o.m} type="button" role="tab" aria-selected={mode === o.m} aria-controls="ev-registration-panel" onClick={() => setMode(o.m)} data-testid={`tab-${o.m}`}
                    className={`ev-package ${o.m === 'online' ? 'ev-package-online' : ''} ${mode === o.m ? 'is-selected' : ''}`}>
                    <span className="ev-package-top"><o.icon aria-hidden="true" /><span>{mode === o.m ? 'اختيارك' : 'طريقة الحضور'}</span></span>
                    <span className="ev-package-title">{o.t}</span>
                    <span className="ev-package-price"><strong>{o.price}</strong><span>{o.currency}</span></span>
                    <span className="ev-package-note">{o.note}</span>
                    <span className="ev-package-check" aria-hidden="true">{mode === o.m && <Check />}</span>
                  </button>
                ))}
              </div>

              <div id="ev-registration-panel" role="tabpanel" key={mode} className="ev-form-panel ev-rise">
                <div className="ev-panel-heading">
                  <div><span className="ev-eyebrow">{mode === 'in-person' ? 'حضور في عمّان' : 'حضور أونلاين'}</span><h3>أكمل بيانات التسجيل</h3></div>
                  <span className="ev-panel-price">{mode === 'in-person' ? '25 دينار' : '30 دولار'}</span>
                </div>
                {p.bookingControls}
                {p.existingBooking || (mode === 'in-person' ? (
                  p.submitted ? (
                    <div className="ev-success" data-testid="status-submitted">
                      <span className="ev-success-icon"><CheckCircle2 aria-hidden="true" /></span>
                      <p className="ev-success-title">وصل طلبك</p>
                      <p>سنراجع الإيصال ونتواصل معك لتأكيد مقعدك.</p>
                    </div>
                  ) : (
                    <form onSubmit={submit} className="ev-form">
                      <div className="ev-payment-instructions">
                        <div className="ev-cliq-label"><span className="ev-cliq-mark">CliQ</span><span>ادفع 25 دينار عبر CliQ إلى</span></div>
                        <div className="ev-cliq-account">
                          <div>
                            <strong dir="ltr" data-testid="text-cliq-alias">{p.cliqAlias || '—'}</strong>
                            {p.cliqName && <span data-testid="text-cliq-name">{p.cliqName}</span>}
                          </div>
                          {p.cliqAlias && (
                            <button type="button" onClick={copy} className="ev-copy" data-testid="button-copy-cliq" aria-label="نسخ اسم حساب CliQ">
                              <Copy aria-hidden="true" />{copied ? 'تم النسخ' : 'نسخ'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="ev-fields">
                        <label className="ev-field" htmlFor="ev-name"><span>الاسم الكامل</span>
                          <input id="ev-name" className="ev-in" value={p.name} onChange={e => p.onNameChange(e.target.value)} required autoComplete="name" data-testid="input-name" />
                        </label>
                        <label className="ev-field" htmlFor="ev-phone"><span>رقم الهاتف</span>
                          <input id="ev-phone" className="ev-in" dir="ltr" type="tel" value={p.phone} onChange={e => p.onPhoneChange(e.target.value)} required autoComplete="tel" data-testid="input-phone" />
                        </label>
                      </div>
                      <label className="ev-field" htmlFor="ev-email"><span>البريد الإلكتروني للتأكيد</span>
                        <input id="ev-email" className="ev-in" dir="ltr" type="email" value={p.email} onChange={e => p.onEmailChange(e.target.value)} required autoComplete="email" data-testid="input-event-email" />
                      </label>
                      <label className="ev-upload" htmlFor="ev-receipt">
                        <span className="ev-upload-icon"><Upload aria-hidden="true" /></span>
                        <span className="ev-upload-copy"><strong>{p.receiptFile ? p.receiptFile.name : 'ارفع صورة إيصال التحويل'}</strong><small>صورة الإيصال مطلوبة لإرسال طلب الحجز</small></span>
                        <span className="ev-upload-action">اختيار صورة</span>
                        <input id="ev-receipt" type="file" accept="image/*" className="ev-file-input" onChange={e => {
                          const file = e.currentTarget.files?.[0];
                          if (file) p.onReceiptChange(file);
                          e.currentTarget.value = '';
                        }} data-testid="input-receipt" aria-label="رفع صورة إيصال التحويل" />
                      </label>
                      {p.receiptFile && <div className="ev-receipt-preview" data-testid="receipt-preview">
                        <p role="status">تم اختيار الصورة: {p.receiptFile.name}. تُرسل مع طلب الحجز عند الضغط على «أرسل طلب الحجز».</p>
                        {receiptPreview && !receiptPreviewError && <img src={receiptPreview} alt="معاينة إيصال التحويل المختار" onError={() => setReceiptPreviewError(true)} />}
                        {receiptPreviewError && <p role="alert">تعذّر فتح الصورة. يرجى اختيار صورة بصيغة JPG أو PNG أو WebP.</p>}
                      </div>}
                      {p.submitError && <p role="alert" className="ev-error" data-testid="text-submit-error"><AlertCircle aria-hidden="true" />{p.submitError}</p>}
                      <button type="submit" disabled={p.submitting || !p.name.trim() || !p.phone.trim() || !p.email.trim() || !p.receiptFile}
                        className="ev-submit" data-testid="button-submit">
                        {p.submitting && <Loader2 className="ev-spinner" aria-hidden="true" />}
                        {p.submitting ? 'جارٍ الإرسال' : 'أرسل طلب الحجز'}<ArrowLeft aria-hidden="true" />
                      </button>
                      <p className="ev-form-footnote">بعد مراجعة الإيصال، سنتواصل معك لتأكيد مقعدك.</p>
                    </form>
                  )
                ) : p.paypalDone ? (
                  <div className="ev-success" data-testid="status-paypal-done">
                    <span className="ev-success-icon"><CheckCircle2 aria-hidden="true" /></span>
                    <p className="ev-success-title">تم تأكيد دفعك</p>
                  </div>
                ) : (
                  <div className="ev-form">
                    <div className="ev-fields">
                      <label className="ev-field" htmlFor="ev-name-online"><span>الاسم الكامل</span><input id="ev-name-online" className="ev-in" value={p.name} onChange={e => p.onNameChange(e.target.value)} required autoComplete="name" /></label>
                      <label className="ev-field" htmlFor="ev-phone-online"><span>رقم الهاتف</span><input id="ev-phone-online" className="ev-in" dir="ltr" type="tel" value={p.phone} onChange={e => p.onPhoneChange(e.target.value)} required autoComplete="tel" /></label>
                    </div>
                    <label className="ev-field" htmlFor="ev-email-online"><span>البريد الإلكتروني للتأكيد</span>
                      <input id="ev-email-online" className="ev-in" dir="ltr" type="email" value={p.email} onChange={e => p.onEmailChange(e.target.value)} required autoComplete="email" data-testid="input-event-email-online" />
                    </label>
                    <p className="ev-paypal-copy">ادفع 30 دولارًا بأمان عبر PayPal، وستصلك تفاصيل الدخول.</p>
                    {p.paypalSlot ?? (p.onPayPal && (
                      <button type="button" onClick={p.onPayPal} disabled={p.paypalPending} className="ev-submit" data-testid="button-paypal">
                        {p.paypalPending && <Loader2 className="ev-spinner" aria-hidden="true" />}الدفع عبر PayPal<ArrowLeft aria-hidden="true" />
                      </button>
                    ))}
                    {!p.paypalSlot && !p.onPayPal && <p className="ev-paypal-unavailable" data-testid="status-paypal-unavailable">الدفع الإلكتروني غير متاح حاليًا.</p>}
                    {p.paypalError && <p role="alert" className="ev-error" data-testid="text-paypal-error"><AlertCircle aria-hidden="true" />{p.paypalError}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>

      <footer className="ev-footer">
        <a href="#top" className="ev-footer-brand">تجسيد النجاح<span> · </span>من عالم الروح إلى عالم المادة</a>
        <span>السبت 21 نوفمبر 2026 <i /> عمّان وأونلاين</span>
      </footer>
    </div>
  );
}
