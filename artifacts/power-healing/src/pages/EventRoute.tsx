import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { PayPalButtons, PayPalScriptProvider, type ReactPayPalScriptOptions } from '@paypal/react-paypal-js';
import { useAuth } from '@/lib/auth';
import { DEFAULT_EVENT_SETTINGS, subscribeSiteSettings, type EventSettings } from '@/lib/siteSettings';
import { compressReceiptToDataUrl, createCliqRegistration, eventRequest, type MyEventRegistration } from '@/lib/eventRegistrations';
import EventPage from './Event';
import EventPostRegistration from './EventPostRegistration';

const CLIENT_ID = (import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined)?.trim() || '';
type Stage = 'offer' | 'standard' | 'vip';
type Captured = { captureStatus: string; registration: MyEventRegistration };

export default function EventRoute() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [settings, setSettings] = useState<EventSettings>(DEFAULT_EVENT_SETTINGS);
  const [settingsStatus, setSettingsStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [paypalError, setPaypalError] = useState('');
  const [registration, setRegistration] = useState<MyEventRegistration | null>(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [registrationError, setRegistrationError] = useState('');
  const [stage, setStage] = useState<Stage | null>(null);
  const [showVipPaypal, setShowVipPaypal] = useState(false);
  const [vipError, setVipError] = useState('');
  const [recoverOrder, setRecoverOrder] = useState('');
  const paymentBusy = useRef(false);
  const registrationRevision = useRef(0);
  const activeUser = useRef(user?.uid);
  activeUser.current = user?.uid;
  const recoveryKey = user ? `event-payment-recovery:${user.uid}` : '';

  useEffect(() => subscribeSiteSettings((s) => {
    setSettings({ ...DEFAULT_EVENT_SETTINGS, ...s.event });
    setSettingsStatus('ready');
  }, () => setSettingsStatus('error')), []);
  useEffect(() => {
    if (settingsStatus === 'ready' && !settings.enabled) setLocation('/', { replace: true });
  }, [settingsStatus, settings.enabled, setLocation]);

  useEffect(() => {
    let cancelled = false;
    registrationRevision.current += 1;
    setRegistration(null); setStage(null); setShowVipPaypal(false);
    setName(''); setPhone(''); setEmail(user?.email || ''); setReceipt(null);
    setSubmitError(''); setPaypalError(''); setVipError(''); setRegistrationError('');
    setRecoverOrder(recoveryKey ? sessionStorage.getItem(recoveryKey) || '' : '');
    if (!user) { setRegistrationLoading(false); return; }
    setRegistrationLoading(true);
    const load = async () => {
      const revision = registrationRevision.current;
      try {
        const result = await eventRequest<{ registration: MyEventRegistration | null }>({ action: 'mine' });
        if (cancelled || revision !== registrationRevision.current) return;
        setRegistration(result.registration);
        if (result.registration?.status === 'rejected' && result.registration.membershipStatus !== 'VIP Member') setStage(null);
        if (result.registration) {
          setName(result.registration.name); setPhone(result.registration.phone); setEmail(result.registration.email || user.email || '');
        }
        setRegistrationError('');
      } catch (error) {
        if (!cancelled) setRegistrationError(error instanceof Error ? error.message : 'تعذّر تحميل التسجيل الحالي.');
      } finally { if (!cancelled) setRegistrationLoading(false); }
    };
    void load();
    const refresh = () => { void load(); };
    window.addEventListener('focus', refresh);
    return () => { cancelled = true; window.removeEventListener('focus', refresh); };
  }, [user?.uid, recoveryKey]);

  const paypalOptions = useMemo<ReactPayPalScriptOptions | null>(() => CLIENT_ID ? ({
    clientId: CLIENT_ID, currency: 'USD', intent: 'capture', components: 'buttons',
  }) : null, []);

  const requireLogin = () => {
    if (user) return true;
    sessionStorage.setItem('dh_redirect_after_login', '/event');
    setLocation('/login');
    return false;
  };
  const openRegistration = (entry: MyEventRegistration) => {
    registrationRevision.current += 1;
    setRegistration(entry);
    if (entry.status === 'rejected' && entry.membershipStatus !== 'VIP Member') {
      setStage(null);
      setSubmitError('تم رفض الطلب السابق. يرجى التواصل معنا أو إعادة إرسال طلب صحيح.');
      document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    setStage(entry.membershipStatus === 'VIP Member' ? 'vip' : 'offer');
    setShowVipPaypal(false); setVipError('');
  };
  const submitInPerson = async () => {
    if (!requireLogin() || busy) return;
    const uid = user!.uid;
    setBusy(true); setSubmitError('');
    try {
      if (!receipt) throw new Error('يرجى إرفاق صورة إيصال التحويل.');
      const receiptDataUrl = await compressReceiptToDataUrl(receipt);
      const result = await createCliqRegistration({ name, phone, email, receiptDataUrl });
      if (activeUser.current === uid) openRegistration(result.registration);
    } catch (error) {
      if (activeUser.current === uid) setSubmitError(error instanceof Error ? error.message : 'تعذّر إرسال طلبك.');
    } finally { setBusy(false); }
  };
  const finishCapture = async (orderId: string) => {
    if (!user || paymentBusy.current) return;
    const uid = user.uid;
    paymentBusy.current = true; setBusy(true);
    try {
      const result = await eventRequest<Captured>({ action: 'capture-order', orderId });
      if (result.captureStatus !== 'COMPLETED') throw new Error('لم يتم تأكيد الدفع بعد.');
      sessionStorage.removeItem(`event-payment-recovery:${uid}`);
      if (activeUser.current === uid) {
        setRecoverOrder(''); setPaypalError(''); setVipError('');
        openRegistration(result.registration);
      }
    } finally { paymentBusy.current = false; setBusy(false); }
  };
  const paymentButtons = (tier: 'online' | 'vip') => {
    if (!paypalOptions) return <p role="alert">الدفع عبر PayPal غير متاح حاليًا. يرجى التواصل معنا.</p>;
    return <PayPalScriptProvider options={paypalOptions}>
      <PayPalButtons
        style={{ layout: 'vertical', shape: 'pill', label: 'paypal' }}
        forceReRender={[tier, name, phone, email, registration?.id]}
        createOrder={async () => {
          const report = tier === 'vip' ? setVipError : setPaypalError;
          try {
            report('');
            if (!requireLogin()) throw new Error('يرجى تسجيل الدخول لإكمال الحجز.');
            if (registrationLoading || registrationError) throw new Error('يرجى تحديث حالة تسجيلك أولاً.');
            if (tier === 'online' && (name.trim().length < 2 || phone.trim().length < 7 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) {
              throw new Error('يرجى إدخال الاسم ورقم الهاتف والبريد الإلكتروني الصحيح أولاً.');
            }
            const result = await eventRequest<{ id: string }>({
              action: 'create-order', tier, name, phone, email, registrationId: registration?.id,
            });
            if (recoveryKey) sessionStorage.setItem(recoveryKey, result.id);
            setRecoverOrder(result.id);
            return result.id;
          } catch (error) {
            report(error instanceof Error ? error.message : 'تعذّر تجهيز الدفع.');
            throw error;
          }
        }}
        onApprove={async ({ orderID }) => {
          try { await finishCapture(orderID); }
          catch (error) {
            const message = error instanceof Error ? error.message : 'تعذّر تأكيد الدفع. استخدم استعادة التأكيد دون الدفع مجددًا.';
            if (tier === 'vip') { setVipError(message); setShowVipPaypal(false); }
            else setPaypalError(message);
          }
        }}
        onCancel={() => {
          if (tier === 'vip') setShowVipPaypal(false);
        }}
        onError={() => {
          if (tier === 'vip') { setVipError('تعذّر إتمام الدفع عبر PayPal. يمكنك إعادة المحاولة.'); setShowVipPaypal(false); }
          else setPaypalError('تعذّر إتمام الدفع عبر PayPal. يرجى المحاولة مجددًا.');
        }}
      />
    </PayPalScriptProvider>;
  };
  const onVipOffer = () => {
    if (registration) { openRegistration(registration); return; }
    setSubmitError('يرجى إكمال تسجيل التذكرة الأساسية أولاً للاستفادة من ترقية VIP.');
    document.getElementById('register')?.scrollIntoView({ behavior: 'smooth' });
  };
  const closeModal = useCallback(() => {
    if (!paymentBusy.current) { setStage(null); setShowVipPaypal(false); }
  }, []);

  if (settingsStatus === 'error') return <div dir="rtl" className="min-h-screen grid place-content-center p-6" role="alert">تعذّر تحميل إعدادات الورشة. يرجى تحديث الصفحة.</div>;
  if (settingsStatus === 'loading' || !settings.enabled) return <div dir="rtl" role="status" className="min-h-screen grid place-content-center p-6">جارٍ تحميل الصفحة…</div>;
  return <div className="ev">
    <EventPage
      enabled={settings.enabled} portraitUrl={settings.portraitUrl || undefined}
      backgroundUrl={settings.ammanImageUrl || undefined}
      cliqAlias={settings.cliqAlias} cliqName={settings.cliqAccountName}
      name={name} phone={phone} email={email} onNameChange={setName} onPhoneChange={setPhone} onEmailChange={setEmail}
      receiptFile={receipt} onReceiptChange={setReceipt} onSubmitInPerson={submitInPerson}
      submitting={busy} submitError={submitError}
      submitted={registration?.attendance === 'in-person' && registration.status !== 'rejected'}
      paypalSlot={paymentButtons('online')} paypalError={paypalError}
      paypalDone={registration?.attendance === 'online' && registration.status !== 'rejected'}
      registrationLoading={authLoading || registrationLoading || !!registrationError}
      onVipOffer={onVipOffer}
    />
    {(registrationError || recoverOrder || registration) && <aside dir="rtl" className="mx-auto max-w-3xl border border-amber-600/30 bg-[#fff8e7] p-5 text-[#174c3c]" data-testid="event-registration-status">
      {registrationError && <p role="alert">{registrationError} <button className="underline" onClick={() => window.location.reload()}>إعادة المحاولة</button></p>}
      {registration && <><p>{registration.membershipStatus === 'VIP Member' ? 'VIP Member' : 'التذكرة العادية'} · {registration.status === 'pending' ? 'قيد المراجعة' : registration.status === 'approved' ? 'تم تأكيد التسجيل' : 'تم رفض الطلب؛ يرجى التواصل معنا.'}</p>
        {registration.status !== 'rejected' && <button className="mt-3 font-bold underline" onClick={() => openRegistration(registration)} data-testid="button-manage-event">{registration.membershipStatus === 'VIP Member' ? 'عرض وصول VIP' : 'عرض التسجيل وترقية VIP'}</button>}</>}
      {recoverOrder && <div className="mt-4"><p>إذا وافقت على الدفع ولم يظهر التأكيد، استعد تأكيده هنا دون دفع جديد.</p>
        <button type="button" disabled={busy} className="font-bold underline" data-testid="button-recover-event-payment" onClick={async () => {
          try { await finishCapture(recoverOrder); } catch (error) { setPaypalError(error instanceof Error ? error.message : 'تعذّر استعادة الدفع.'); }
        }}>استعادة تأكيد الدفع السابق</button>{paypalError && <p role="alert">{paypalError}</p>}</div>}
    </aside>}
    {stage && registration && <EventPostRegistration
      stage={stage} corePending={registration.status === 'pending'} purchasing={showVipPaypal}
      error={vipError} paypalSlot={showVipPaypal ? paymentButtons('vip') : null}
      telegramUrl={registration.telegramUrl}
      onStartVip={() => { setVipError(''); setShowVipPaypal(true); }}
      onDecline={() => { if (!paymentBusy.current) { setShowVipPaypal(false); setStage('standard'); } }}
      onClose={closeModal}
    />}
  </div>;
}
