import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { PayPalButtons, PayPalScriptProvider, type ReactPayPalScriptOptions } from '@paypal/react-paypal-js';
import { useAuth } from '@/lib/auth';
import { auth } from '@/lib/firebase';
import { DEFAULT_EVENT_SETTINGS, subscribeSiteSettings, type EventSettings } from '@/lib/siteSettings';
import { compressReceiptToDataUrl, createCliqRegistration, createOnlineEventRegistration } from '@/lib/eventRegistrations';
import { serverApi } from '@/lib/serverApi';
import EventPage from './Event';

const CLIENT_ID = (import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined)?.trim() ||
  (typeof process !== 'undefined' ? process.env.PAYPAL_CLIENT_ID?.trim() : undefined) || '';

export default function EventRoute() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [settings, setSettings] = useState<EventSettings>(DEFAULT_EVENT_SETTINGS);
  const [settingsStatus, setSettingsStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [paypalError, setPaypalError] = useState('');
  const [paypalDone, setPaypalDone] = useState(false);

  useEffect(() => {
    return subscribeSiteSettings((s) => {
      setSettings({
        ...DEFAULT_EVENT_SETTINGS,
        ...(s.event || {}),
        portraitUrl: s.event?.portraitUrl || '',
      });
      setSettingsStatus('ready');
    }, (error) => {
      console.error('Could not load the event page settings', error);
      setSettingsStatus('error');
    });
  }, []);
  useEffect(() => {
    if (settingsStatus === 'ready' && settings.enabled === false) setLocation('/', { replace: true });
  }, [settingsStatus, settings.enabled, setLocation]);

  const paypalOptions = useMemo<ReactPayPalScriptOptions | null>(() => CLIENT_ID ? ({
    clientId: CLIENT_ID,
    currency: 'USD',
    intent: 'capture',
    components: 'buttons',
  }) : null, []);

  const requireLogin = () => {
    if (user) return true;
    sessionStorage.setItem('dh_redirect_after_login', '/event');
    setLocation('/login');
    return false;
  };

  const submitInPerson = async () => {
    if (!requireLogin()) return;
    setBusy(true);
    setSubmitError('');
    try {
      if (!settings.cliqAlias.trim()) throw new Error('إعداد حساب CliQ غير مكتمل. تواصلي معنا أو حاولي لاحقًا.');
      if (!receipt) throw new Error('أرفقي صورة إيصال التحويل.');
      const receiptDataUrl = await compressReceiptToDataUrl(receipt);
      await createCliqRegistration({ name, phone, receiptDataUrl });
      setSubmitted(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setSubmitError(message === 'IMAGE_TOO_LARGE'
        ? 'الصورة كبيرة؛ اختاري صورة أصغر أو قللي دقتها.'
        : message === 'INVALID_IMAGE'
          ? 'يرجى اختيار صورة للإيصال.'
          : message || 'تعذّر إرسال الطلب. تحققي من الاتصال ثم حاولي مجددًا.');
    } finally {
      setBusy(false);
    }
  };

  const paypalSlot = paypalOptions && !paypalDone ? (
    <PayPalScriptProvider options={paypalOptions}>
      <PayPalButtons
        style={{ layout: 'vertical', shape: 'pill', label: 'paypal' }}
        createOrder={async () => {
          if (!requireLogin()) throw new Error('Sign in required');
          if (name.trim().length < 2 || phone.trim().length < 7) {
            setPaypalError('أدخلي الاسم ورقم الهاتف أولًا.');
            throw new Error('Attendee details are required');
          }
          const response = await serverApi('/api/paypal/create-event-order', {
            method: 'POST',
            body: JSON.stringify({ name, phone }),
          });
          const body = await response.json().catch(() => ({}));
          if (!response.ok || typeof body.id !== 'string') throw new Error(body.error || 'تعذّر إنشاء طلب الدفع.');
          return body.id;
        }}
        onApprove={async ({ orderID }) => {
          try {
            const response = await serverApi('/api/paypal/capture-order', {
              method: 'POST',
              body: JSON.stringify({ orderId: orderID }),
            });
            const body = await response.json().catch(() => ({}));
            if (!response.ok || body.captureStatus !== 'COMPLETED') throw new Error(body.error || 'لم يكتمل الدفع.');
            if (!auth.currentUser) throw new Error('يرجى تسجيل الدخول لإكمال التسجيل.');
            const { createOnlineEventRegistration } = await import('@/lib/eventRegistrations');
            await createOnlineEventRegistration({ name, phone, paypalOrderId: orderID });
            setPaypalDone(true);
          } catch (error) {
            setPaypalError(error instanceof Error ? error.message : 'تعذّر تأكيد الدفع.');
          }
        }}
        onError={(error) => setPaypalError(error instanceof Error ? error.message : 'تعذّر إتمام الدفع عبر PayPal.')}
      />
    </PayPalScriptProvider>
  ) : null;

  if (settingsStatus === 'error') {
    return <div dir="rtl" className="min-h-screen grid place-content-center gap-5 p-6 text-center">
      <p role="alert">تعذّر تحميل إعدادات الورشة. يرجى إعادة المحاولة لاحقًا.</p>
      <a href={import.meta.env.BASE_URL} className="underline">العودة إلى الصفحة الرئيسية</a>
    </div>;
  }
  if (settingsStatus === 'loading' || !settings.enabled) {
    return <div dir="rtl" role="status" className="min-h-screen grid place-content-center p-6">جارٍ تحميل الصفحة…</div>;
  }

  return <EventPage
    enabled={settings.enabled}
    portraitUrl={settings.portraitUrl || undefined}
    backgroundUrl={settings.ammanImageUrl || undefined}
    cliqAlias={settings.cliqAlias}
    cliqName={settings.cliqAccountName}
    announcement={settings.announcementEnabled ? { title: 'لقاؤنا في عمّان', body: '21 نوفمبر' } : null}
    name={name}
    phone={phone}
    onNameChange={setName}
    onPhoneChange={setPhone}
    receiptFile={receipt}
    onReceiptChange={setReceipt}
    onSubmitInPerson={submitInPerson}
    submitting={busy}
    submitError={submitError}
    submitted={submitted}
    paypalSlot={paypalSlot}
    paypalError={paypalError}
    paypalDone={paypalDone}
  />;
}
