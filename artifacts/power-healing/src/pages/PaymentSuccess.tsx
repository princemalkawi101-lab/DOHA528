import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { useApp, CartItem } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { createBooking } from '@/lib/bookings';

const COUNTRY_CODES = [
  { code: '+962', label: 'الأردن (+962)' },
  { code: '+966', label: 'السعودية (+966)' },
  { code: '+971', label: 'الإمارات (+971)' },
  { code: '+965', label: 'الكويت (+965)' },
  { code: '+974', label: 'قطر (+974)' },
  { code: '+973', label: 'البحرين (+973)' },
  { code: '+968', label: 'عُمان (+968)' },
  { code: '+20',  label: 'مصر (+20)' },
  { code: '+961', label: 'لبنان (+961)' },
  { code: '+963', label: 'سوريا (+963)' },
  { code: '+964', label: 'العراق (+964)' },
  { code: '+970', label: 'فلسطين (+970)' },
  { code: '+212', label: 'المغرب (+212)' },
  { code: '+216', label: 'تونس (+216)' },
  { code: '+213', label: 'الجزائر (+213)' },
  { code: '+1',   label: 'USA / Canada (+1)' },
  { code: '+44',  label: 'UK (+44)' },
];

export default function PaymentSuccess() {
  const { lang, clearCart } = useApp();
  const { user } = useAuth();
  const [purchased, setPurchased] = useState<CartItem[]>([]);
  const [cartCleared, setCartCleared] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('dh_last_purchase');
      if (raw) setPurchased(JSON.parse(raw));
    } catch {}
    if (!cartCleared) {
      clearCart();
      setCartCleared(true);
    }
  }, [clearCart, cartCleared]);

  if (purchased.length === 0) {
    return (
      <div className="min-h-[calc(100dvh-68px)] mt-[68px] flex items-center justify-center px-4 py-10 bg-gradient-to-br from-[#1a0a2e] via-[#2a1444] to-[#1a0a2e]">
        <div className="max-w-md text-center">
          <h1 className="text-white text-2xl font-black mb-3">
            {lang === 'ar' ? 'لا توجد عملية شراء حديثة' : 'No recent purchase'}
          </h1>
          <Link href="/" className="inline-block bg-[hsl(var(--g500))] text-[hsl(var(--p900))] font-bold py-2 px-5 rounded-lg">
            {lang === 'ar' ? 'العودة إلى الرئيسية' : 'Back to home'}
          </Link>
        </div>
      </div>
    );
  }

  const bookingItems = purchased.filter((p) => p.requiresBooking);
  const linkItems = purchased.filter((p) => !p.requiresBooking);

  return (
    <div className="min-h-[calc(100dvh-68px)] mt-[68px] px-4 py-10 bg-gradient-to-br from-[#1a0a2e] via-[#2a1444] to-[#1a0a2e]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[hsl(var(--g500))] to-[hsl(var(--g400))] text-[hsl(var(--p900))] text-4xl font-black mb-4">✓</div>
          <h1 className="text-white text-3xl font-black mb-2">
            {lang === 'ar' ? 'تم الدفع بنجاح!' : 'Payment Successful!'}
          </h1>
          <p className="text-[rgba(255,255,255,0.7)]">
            {lang === 'ar' ? 'شكراً لشرائك. تفاصيل الوصول أدناه.' : 'Thank you for your purchase. Access details are below.'}
          </p>
        </div>

        {/* Telegram links — only for non-booking items */}
        {linkItems.length > 0 && (
        <section className="bg-[rgba(30,14,56,0.75)] border border-[rgba(212,160,23,0.25)] rounded-2xl p-6 mb-6">
          <h2 className="text-white text-lg font-black mb-4">
            {lang === 'ar' ? '🔓 روابط الوصول إلى المحتوى (تلجرام)' : '🔓 Content Access Links (Telegram)'}
          </h2>
          <div className="flex flex-col gap-3">
            {linkItems.map((p) => {
              const title = lang === 'ar' ? (p.titleAr || p.nameKey) : (p.titleEn || p.nameKey);
              return (
                <div key={p.key} className="bg-[rgba(0,0,0,0.25)] border border-[rgba(255,255,255,0.08)] rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{p.icon}</span>
                    <span className="text-white font-bold flex-1">{title}</span>
                  </div>
                  {p.telegramLink ? (
                    <a
                      href={p.telegramLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#229ED9] text-white font-bold py-2 px-4 rounded-lg text-sm hover:opacity-90"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.62 8.16-1.86 8.78c-.14.62-.51.77-1.03.48l-2.85-2.1-1.37 1.32c-.15.15-.28.28-.57.28l.2-2.9 5.27-4.76c.23-.2-.05-.32-.36-.12l-6.51 4.1-2.81-.88c-.61-.19-.62-.61.13-.9l10.99-4.24c.51-.19.96.12.79.93z"/></svg>
                      {lang === 'ar' ? 'افتح القناة على تلجرام' : 'Open on Telegram'}
                    </a>
                  ) : (
                    <p className="text-[rgba(255,255,255,0.5)] text-sm italic">
                      {lang === 'ar' ? 'لم يتم إعداد رابط بعد. سيتم التواصل معك قريباً.' : 'Link not set yet. We will contact you shortly.'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
        )}

        {/* Booking forms for individual sessions */}
        {bookingItems.length > 0 && (
          <section className="bg-[rgba(30,14,56,0.75)] border border-[rgba(212,160,23,0.25)] rounded-2xl p-6 mb-6">
            <h2 className="text-white text-lg font-black mb-2">
              {lang === 'ar' ? '📝 أكمل بياناتك لحجز الجلسة الفردية' : '📝 Complete Your Details to Book Your 1-on-1 Session'}
            </h2>
            <p className="text-[rgba(255,255,255,0.6)] text-sm mb-5">
              {lang === 'ar'
                ? 'بعد تأكيد البيانات، سيتم تحويلك مباشرة إلى التقويم لاختيار الموعد المناسب لك.'
                : 'After confirming, you will be redirected to the calendar to pick a suitable time.'}
            </p>

            <div className="flex flex-col gap-6">
              {bookingItems.map((item) => (
                <BookingForm key={item.key} item={item} userEmail={user?.email || null} userUid={user?.uid || null} />
              ))}
            </div>
          </section>
        )}

        <div className="text-center">
          <Link href="/" className="inline-block bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-[rgba(255,255,255,0.12)]">
            {lang === 'ar' ? 'العودة إلى الرئيسية' : 'Back to Home'}
          </Link>
        </div>
      </div>
    </div>
  );
}

const CALENDLY_URL = 'https://calendly.com/dohamlk74/new-meeting';

function BookingForm({ item, userEmail, userUid }: { item: CartItem; userEmail: string | null; userUid: string | null }) {
  const { lang } = useApp();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [countryCode, setCountryCode] = useState('+962');
  const [phone, setPhone] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Min selectable date = tomorrow
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();

  const title = lang === 'ar' ? (item.titleAr || item.nameKey) : (item.titleEn || item.nameKey);

  const handleDescChange = (val: string) => {
    if (val.length > 300) return;
    const lines = val.split('\n');
    if (lines.length > 3) return;
    setDescription(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError(lang === 'ar' ? 'يرجى تعبئة جميع الحقول المطلوبة' : 'Please fill all required fields');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await createBooking({
        itemId: item.itemId || item.key,
        itemTitleAr: item.titleAr || item.nameKey,
        itemTitleEn: item.titleEn || item.nameKey,
        buyerUid: userUid,
        buyerEmail: userEmail,
        name: name.trim(),
        description: description.trim(),
        whatsappCountryCode: countryCode,
        whatsappNumber: phone.trim(),
        sessionDate: sessionDate || undefined,
        sessionTime: sessionTime || undefined,
      });
      // Redirect to Calendly ONLY for "individual online session" purchases.
      // For VIP and other booking-required items, show a confirmation message
      // — Doha contacts the client directly.
      if (item.itemKind === 'individual-online') {
        window.location.href = CALENDLY_URL;
      } else {
        setSubmitted(true);
        setSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setError(lang === 'ar' ? 'حدث خطأ، حاول مجدداً' : 'An error occurred, please try again');
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-[rgba(0,0,0,0.25)] border border-[rgba(212,160,23,0.3)] rounded-xl p-6 text-center">
        <div className="text-4xl mb-3">✅</div>
        <div className="text-white font-bold text-lg mb-2">
          {lang === 'ar' ? 'تم استلام بياناتك بنجاح' : 'Your details have been received'}
        </div>
        <p className="text-[rgba(255,255,255,0.75)] text-sm leading-relaxed">
          {lang === 'ar'
            ? 'سيتم التواصل معك قريباً عبر الواتساب لتحديد تفاصيل الجلسة وموعدها.'
            : 'You will be contacted shortly via WhatsApp to confirm the session details and schedule.'}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-[rgba(0,0,0,0.25)] border border-[rgba(255,255,255,0.08)] rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">{item.icon}</span>
        <div className="text-white font-bold">{title}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-[rgba(255,255,255,0.7)] text-xs font-semibold mb-1.5">
            {lang === 'ar' ? 'الاسم الكامل *' : 'Full Name *'}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="bk-input"
            placeholder={lang === 'ar' ? 'اسمك الكامل' : 'Your full name'}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-[rgba(255,255,255,0.7)] text-xs font-semibold mb-1.5">
            {lang === 'ar' ? `وصف الحالة (3 أسطر بحد أقصى — ${300 - description.length} حرف متبقي)` : `Case description (max 3 lines — ${300 - description.length} chars left)`}
          </label>
          <textarea
            value={description}
            onChange={(e) => handleDescChange(e.target.value)}
            rows={3}
            className="bk-input resize-none"
            placeholder={lang === 'ar' ? 'وصف موجز عن حالتك أو ما تود التركيز عليه…' : 'A brief description of your case or focus area…'}
          />
        </div>

        <div>
          <label className="block text-[rgba(255,255,255,0.7)] text-xs font-semibold mb-1.5">
            {lang === 'ar' ? 'مفتاح الدولة *' : 'Country Code *'}
          </label>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            required
            className="bk-input"
            dir="ltr"
          >
            {COUNTRY_CODES.map((c) => (
              <option key={c.code} value={c.code} className="bg-[#1a0a2e]">{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[rgba(255,255,255,0.7)] text-xs font-semibold mb-1.5">
            {lang === 'ar' ? 'رقم الواتساب *' : 'WhatsApp Number *'}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
            required
            dir="ltr"
            className="bk-input"
            placeholder="7XXXXXXXX"
          />
        </div>

        <div>
          <label className="block text-[rgba(255,255,255,0.7)] text-xs font-semibold mb-1.5">
            {lang === 'ar' ? 'التاريخ المفضّل' : 'Preferred Date'}
          </label>
          <input
            type="date"
            value={sessionDate}
            min={minDate}
            onChange={(e) => setSessionDate(e.target.value)}
            dir="ltr"
            className="bk-input"
          />
        </div>

        <div>
          <label className="block text-[rgba(255,255,255,0.7)] text-xs font-semibold mb-1.5">
            {lang === 'ar' ? 'الوقت المفضّل' : 'Preferred Time'}
          </label>
          <input
            type="time"
            value={sessionTime}
            onChange={(e) => setSessionTime(e.target.value)}
            dir="ltr"
            className="bk-input"
          />
        </div>

      </div>

      <div className="mt-4 p-3 rounded-lg bg-[rgba(212,160,23,0.08)] border border-[rgba(212,160,23,0.25)] text-[rgba(255,255,255,0.85)] text-sm flex items-start gap-2">
        <span>📅</span>
        <span>
          {lang === 'ar'
            ? 'بعد الضغط على "تأكيد البيانات"، سيتم تحويلك مباشرة إلى التقويم لاختيار الموعد المناسب لك.'
            : 'After clicking "Confirm", you will be redirected to the calendar to choose your preferred time.'}
        </span>
      </div>

      {error && <p className="text-[#ff8888] text-sm mt-3">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 w-full bg-gradient-to-br from-[hsl(var(--g500))] to-[hsl(var(--g400))] text-[hsl(var(--p900))] font-black py-3 rounded-lg hover:opacity-90 disabled:opacity-50"
      >
        {submitting
          ? (lang === 'ar' ? 'جاري الإرسال…' : 'Submitting…')
          : (lang === 'ar' ? '✓ تأكيد البيانات والانتقال إلى التقويم' : '✓ Confirm & Go to Calendar')}
      </button>

      <style>{`
        .bk-input { width: 100%; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; padding: 10px 12px; color: white; font-size: 0.9rem; outline: none; }
        .bk-input:focus { border-color: hsl(var(--g500)); }
      `}</style>
    </form>
  );
}
