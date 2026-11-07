import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'wouter';
import { PayPalButtons, PayPalScriptProvider, type ReactPayPalScriptOptions } from '@paypal/react-paypal-js';
import { DEFAULT_EVENT_SETTINGS, subscribeSiteSettings, type EventSettings } from '@/lib/siteSettings';
import { compressReceiptToDataUrl, createCliqRegistration, guestEventRequest as eventRequest, type MyEventRegistration } from '@/lib/eventRegistrations';
import EventPage from './Event';
import EventPostRegistration from './EventPostRegistration';
import { guestAuthorization, savedBookingSessions, selectBookingSession } from '@/lib/eventGuest';

const CLIENT_ID = (import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined)?.trim() || '';
type Stage = 'offer' | 'standard' | 'vip';
type Captured = { captureStatus: string; registration: MyEventRegistration };

export default function EventRoute() {
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
  const retryRegistration = useRef<() => void>(() => {});
  const [stage, setStage] = useState<Stage | null>(null);
  const [showVipPaypal, setShowVipPaypal] = useState(false);
  const [vipError, setVipError] = useState('');
  const [recoverOrder, setRecoverOrder] = useState('');
  const [bookingSession, setBookingSession] = useState(0);
  const [previousSessions, setPreviousSessions] = useState<string[]>([]);
  const paymentBusy = useRef(false);
  const paymentFailure = useRef({ online: '', vip: '' });
  const registrationRevision = useRef(0);
  const active = useRef(true);
  const recoveryKey = 'event-guest-payment-recovery';
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setSettingsStatus('error'), 12000);
    const unsubscribe = subscribeSiteSettings((s) => {
      clearTimeout(timer);
      setSettings({ ...DEFAULT_EVENT_SETTINGS, ...s.event });
      setSettingsStatus('ready');
    }, () => { clearTimeout(timer); setSettingsStatus('error'); });
    return () => { clearTimeout(timer); unsubscribe(); };
  }, []);
  useEffect(() => {
    if (settingsStatus === 'ready' && !settings.enabled) setLocation('/', { replace: true });
  }, [settingsStatus, settings.enabled, setLocation]);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    const controller = new AbortController();
    registrationRevision.current += 1;
    setRegistration(null); setStage(null); setShowVipPaypal(false);
    setName(''); setPhone(''); setEmail(''); setReceipt(null);
    setSubmitError(''); setPaypalError(''); setVipError(''); setRegistrationError('');
    try { setRecoverOrder(localStorage.getItem(recoveryKey) || ''); } catch { /* guest session reports blocked storage */ }
    try {
      const current = guestAuthorization().slice(6);
      setPreviousSessions(savedBookingSessions().filter(token => token !== current));
    } catch { setPreviousSessions([]); }
    retryRegistration.current = () => {};
    setRegistrationLoading(true);
    const load = async (background = false) => {
      if (inFlight || cancelled) return;
      inFlight = true;
      if (!background) setRegistrationLoading(true);
      const revision = registrationRevision.current;
      try {
        const result = await eventRequest<{ registration: MyEventRegistration | null }>({ action: 'mine' }, { signal: controller.signal });
        if (cancelled || revision !== registrationRevision.current) return;
        if (!result || !Object.prototype.hasOwnProperty.call(result, 'registration')) {
          throw new Error('تعذّر التحقق من حالة التسجيل. يرجى إعادة المحاولة.');
        }
        setRegistration(result.registration);
        if (result.registration?.status === 'rejected' && result.registration.membershipStatus !== 'VIP Member') setStage(null);
        if (result.registration) {
          setName(result.registration.name); setPhone(result.registration.phone); setEmail(result.registration.email || '');
        }
        setRegistrationError('');
      } catch (error) {
        if (!cancelled && revision === registrationRevision.current) setRegistrationError(error instanceof Error ? error.message : 'تعذّر تحميل التسجيل الحالي.');
      } finally { inFlight = false; if (!cancelled && !background) setRegistrationLoading(false); }
    };
    void load();
    // Mobile file pickers and PayPal windows both cause focus events. Never
    // unmount their form/input while refreshing status on return to the page.
    const refresh = () => { void load(true); };
    retryRegistration.current = refresh;
    window.addEventListener('focus', refresh);
    return () => { cancelled = true; controller.abort(); window.removeEventListener('focus', refresh); };
  }, [bookingSession]);

  const switchBooking = (token?: string) => {
    if (busy || paymentBusy.current || registrationLoading) return;
    if (recoverOrder) {
      setSubmitError('يرجى استعادة نتيجة الدفع السابق أولاً قبل بدء حجز آخر، لتجنب تكرار الدفع.');
      return;
    }
    if (!token && !window.confirm('سيبدأ حجز جديد بمبلغ منفصل. حجزك السابق محفوظ ويمكن الرجوع إليه من هذه الصفحة. هل تريد المتابعة؟')) return;
    try {
      selectBookingSession(token);
      registrationRevision.current += 1;
      setRegistration(null); setStage(null); setShowVipPaypal(false);
      setRegistrationLoading(true);
      setBookingSession(value => value + 1);
    } catch { setSubmitError('تعذّر تغيير الحجز. يرجى السماح بتخزين بيانات الموقع في المتصفح.'); }
  };

  const paypalOptions = useMemo<ReactPayPalScriptOptions | null>(() => CLIENT_ID ? ({
    clientId: CLIENT_ID, currency: 'USD', intent: 'capture', components: 'buttons',
  }) : null, []);

  const openRegistration = (entry: MyEventRegistration) => {
    registrationRevision.current += 1;
    setRegistrationError('');
    setRegistrationLoading(false);
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
    if (busy) return;
    setBusy(true); setSubmitError('');
    try {
      if (registrationLoading || registrationError) throw new Error('يرجى إعادة التحقق من حالة تسجيلك قبل تأكيد الحجز لتجنب تكرار الدفع.');
      if (!receipt) throw new Error('يرجى إرفاق صورة إيصال التحويل.');
      const receiptDataUrl = await compressReceiptToDataUrl(receipt);
      const result = await createCliqRegistration({ name, phone, email, receiptDataUrl });
      if (active.current) openRegistration(result.registration);
    } catch (error) {
      if (active.current) setSubmitError(error instanceof Error ? error.message : 'تعذّر إرسال طلبك.');
    } finally { setBusy(false); }
  };
  const finishCapture = async (orderId: string) => {
    if (paymentBusy.current) return;
    paymentBusy.current = true; setBusy(true);
    try {
      const result = await eventRequest<Captured>({ action: 'capture-order', orderId });
      if (result.captureStatus !== 'COMPLETED') throw new Error('لم يتم تأكيد الدفع بعد.');
      localStorage.removeItem(recoveryKey);
      if (active.current) {
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
            paymentFailure.current[tier] = '';
            report('');
            if (registrationLoading || registrationError) throw new Error('تعذّر التحقق من تسجيلك، لذلك لم تبدأ عملية الدفع. اضغط «إعادة التحقق من التسجيل» ثم حاول مجددًا.');
            if (tier === 'online' && (name.trim().length < 2 || phone.trim().length < 7 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))) {
              throw new Error('يرجى إدخال الاسم ورقم الهاتف والبريد الإلكتروني الصحيح أولاً.');
            }
            const result = await eventRequest<{ id: string }>({
              action: 'create-order', tier, name, phone, email, registrationId: registration?.id,
            });
            localStorage.setItem(recoveryKey, result.id);
            setRecoverOrder(result.id);
            return result.id;
          } catch (error) {
            const message = error instanceof Error ? error.message : 'تعذّر تجهيز الدفع.';
            paymentFailure.current[tier] = message;
            report(message);
            throw error;
          }
        }}
        onApprove={async ({ orderID }) => {
          try { await finishCapture(orderID); }
          catch (error) {
            const message = error instanceof Error ? error.message : 'تعذّر تأكيد الدفع. استخدم استعادة التأكيد دون الدفع مجددًا.';
            paymentFailure.current[tier] = message;
            if (tier === 'vip') { setVipError(message); setShowVipPaypal(false); }
            else setPaypalError(message);
          }
        }}
        onCancel={() => {
          if (tier === 'vip') setShowVipPaypal(false);
        }}
        onError={() => {
          const message = paymentFailure.current[tier] || 'تعذّر الاتصال بـ PayPal. تحقق من اتصالك وحاول مجددًا. إذا وافقت على دفعة سابقة فاستخدم استعادة التأكيد ولا تدفع مرة أخرى.';
          if (tier === 'vip') { setVipError(message); setShowVipPaypal(false); }
          else setPaypalError(message);
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

  if (settingsStatus === 'error') return <div dir="rtl" className="min-h-screen grid place-content-center p-6" role="alert">تعذّر تحميل إعدادات الورشة. <button type="button" className="underline" onClick={() => window.location.reload()}>إعادة المحاولة</button></div>;
  if (settingsStatus === 'loading' || !settings.enabled) return <div dir="rtl" role="status" className="min-h-screen grid place-content-center p-6">جارٍ تحميل الصفحة…</div>;
  return <div className="ev">
    <EventPage
      enabled={settings.enabled} portraitUrl={settings.portraitUrl || undefined}
      backgroundUrl={settings.ammanImageUrl || undefined}
      cliqAlias={settings.cliqAlias} cliqName={settings.cliqAccountName}
      name={name} phone={phone} email={email} onNameChange={setName} onPhoneChange={setPhone} onEmailChange={setEmail}
      receiptFile={receipt} onReceiptChange={(file) => { setReceipt(file); setSubmitError(''); }} onSubmitInPerson={submitInPerson}
      submitting={busy} submitError={submitError}
      submitted={registration?.attendance === 'in-person' && registration.status !== 'rejected'}
      paypalSlot={paymentButtons('online')} paypalError={paypalError}
      paypalDone={registration?.attendance === 'online' && registration.status !== 'rejected'}
      registrationLoading={registrationLoading}
      registrationError={registrationError}
      onRetryRegistration={() => retryRegistration.current()}
      onVipOffer={onVipOffer}
      bookingControls={previousSessions.length > 0 && <label className="ev-field mb-5">
        <span>الرجوع إلى حجز سابق من هذا المتصفح</span>
        <select className="ev-in" value="" disabled={busy || !!recoverOrder || registrationLoading} onChange={event => { if (event.target.value) switchBooking(event.target.value); }} data-testid="select-previous-booking">
          <option value="">اختر الحجز السابق</option>
          {previousSessions.map((token, index) => <option key={token} value={token}>الحجز المحفوظ {index + 1}</option>)}
        </select>
      </label>}
      existingBooking={registration && registration.status !== 'rejected' ? <div className="ev-success" data-testid={registration.attendance === 'in-person' ? 'status-submitted' : 'status-paypal-done'}>
        <p className="ev-success-title">{registration.status === 'pending' ? 'وصل طلبك' : 'تم تأكيد حجزك'}</p>
        <p>{registration.attendance === 'in-person' ? 'حجز حضوري في عمّان' : 'حجز أونلاين'} · {registration.name}</p>
        <p>{registration.status === 'pending' ? 'طلب CliQ قيد مراجعة الإيصال؛ لا تحوّل المبلغ مرة أخرى لهذا الحجز.' : 'هذا الحجز محفوظ؛ لا تحتاج إلى الدفع عليه مرة أخرى.'}</p>
        <button type="button" className="ev-submit mt-5" onClick={() => openRegistration(registration)} data-testid="button-view-current-booking">عرض الحجز وخيارات VIP</button>
        <button type="button" className="ev-submit mt-3" disabled={busy || !!recoverOrder} onClick={() => switchBooking()} data-testid="button-new-event-booking">حجز مقعد إضافي / لشخص آخر</button>
        {recoverOrder && <p>استعد تأكيد الدفع السابق أدناه قبل بدء حجز جديد.</p>}
        {submitError && <p role="alert">{submitError}</p>}
      </div> : undefined}
    />
    {(registrationError || recoverOrder || registration) && <aside dir="rtl" className="mx-auto max-w-3xl border border-amber-600/30 bg-[#fff8e7] p-5 text-[#174c3c]" data-testid="event-registration-status">
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
