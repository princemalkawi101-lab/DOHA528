import { useEffect, useRef, type ReactNode } from 'react';
import { X, Crown, CheckCircle2, Clock, Send, AlertCircle } from 'lucide-react';
import './EventPostRegistration.css';

type Stage = 'offer' | 'standard' | 'vip';

interface Props {
  stage: Stage;
  corePending: boolean;
  purchasing: boolean;
  error: string;
  paypalSlot: ReactNode;
  telegramUrl?: string;
  onlineTelegramUrl?: string;
  onStartVip: () => void;
  onDecline: () => void;
  onClose: () => void;
}

const PENDING = 'تم استلام طلبك وهو قيد المراجعة، وسنرسل لك بريداً للتأكيد فور التحقق.';

const features = [
  '🎥 البرنامج مسجل لتتمكن من العودة إلى التجربة في أي وقت.',
  '🎁 كراسة الامتنان (هدية خاصة فقط لمشتركي VIP).',
  '💫 لقاء Zoom مباشر مع ضحى لمدة ساعة كاملة، مخصص للأسئلة والأجوبة.',
  '🤍 الانضمام إلى جروب خاص لمتابعة التجربة والتواصل.',
  '🎧 سيبليمنال النجاح.',
];

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,iframe,[tabindex]:not([tabindex="-1"])';

export default function EventPostRegistration({
  stage, corePending, purchasing, error, paypalSlot, telegramUrl, onlineTelegramUrl, onStartVip, onDecline, onClose,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const purchasingRef = useRef(purchasing);
  purchasingRef.current = purchasing;

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, []);

  useEffect(() => { headingRef.current?.focus(); }, [stage]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (!purchasingRef.current) { e.preventDefault(); closeRef.current(); }
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const els = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter((el) => el.offsetParent !== null || el === document.activeElement);
      if (!els.length) { e.preventDefault(); return; }
      const first = els[0], last = els[els.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const pendingNote = (
    <div className="ev-post-pending" role="status" data-testid="status-core-pending">
      <Clock aria-hidden="true" />
      <p>{PENDING}</p>
    </div>
  );

  return (
    <div className="ev-post-backdrop" data-testid="modal-post-registration">
      <div
        ref={dialogRef}
        className={`ev-post ev-post--${stage}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ev-post-title"
        dir="rtl"
      >
        <button
          type="button"
          className="ev-post-close"
          onClick={onClose}
          disabled={purchasing}
          aria-label="إغلاق"
          data-testid="button-close-post"
        >
          <X aria-hidden="true" />
        </button>

        <div className="ev-post-body">
          {!corePending && onlineTelegramUrl && <div className="ev-post-confirmed" data-testid="online-access-confirmed">
            <div>
              <p>تم تأكيد دفعك وحضورك أونلاين.</p>
              <a className="ev-post-tg" href={onlineTelegramUrl} target="_blank" rel="noopener noreferrer" data-testid="link-online-telegram">
                <Send aria-hidden="true" />انضم إلى قناة الورشة للأونلاين على Telegram
              </a>
            </div>
          </div>}
          {stage === 'offer' && (
            <>
              {corePending ? pendingNote : (
                <div className="ev-post-confirmed" role="status" data-testid="status-core-confirmed">
                  <CheckCircle2 aria-hidden="true" /><p>تم تأكيد تسجيلك في الورشة.</p>
                </div>
              )}
              <blockquote className="ev-post-quote">
                <h2 id="ev-post-title" ref={headingRef} tabIndex={-1} data-testid="text-offer-headline">
                  «لا تنهِ التجربة عند انتهاء الورشة… اجعل النجاح رحلة مستمرة.»
                </h2>
              </blockquote>
              <section className="ev-post-vip" data-testid="card-vip-offer">
                <i className="ev-post-ring" aria-hidden="true" />
                <span className="ev-post-badge"><Crown aria-hidden="true" />✨ مقعد VIP - تجربة أعمق مع ضحى</span>
                <p className="ev-post-sub">لمن يرغب في التوسع أكثر، واستكمال رحلة النجاح والتجسيد بعد الورشة.</p>
                <ul className="ev-post-list">
                  {features.map((f, i) => <li key={i} data-testid={`text-vip-feature-${i}`}>{f}</li>)}
                </ul>
                <div className="ev-post-price" data-testid="text-vip-price">
                  <span>السعر</span><bdi dir="ltr">$49 USD</bdi>
                </div>

                {error && (
                  <div className="ev-post-error" role="alert" data-testid="status-payment-error">
                    <AlertCircle aria-hidden="true" />
                    <p>{error}</p>
                  </div>
                )}

                {purchasing ? (
                  <div className="ev-post-pay" aria-live="polite" data-testid="container-paypal">
                    <p className="ev-post-pay-label">أكمل الدفع الآمن عبر PayPal</p>
                    {paypalSlot}
                  </div>
                ) : (
                  <button type="button" className="ev-post-cta" onClick={onStartVip} data-testid="button-start-vip">
                    {error ? 'إعادة المحاولة - ' : 'احجز مقعد VIP الآن - '}<bdi dir="ltr">$49</bdi>
                  </button>
                )}
              </section>
              <button type="button" className="ev-post-decline" onClick={onDecline} data-testid="button-decline-vip">
                لا شكراً، أرغب بالاستمرار مع التذكرة العادية
              </button>
            </>
          )}

          {stage === 'standard' && (
            <div className="ev-post-final">
              <span className="ev-post-seal" aria-hidden="true">{corePending ? <Clock /> : <CheckCircle2 />}</span>
              <h2 id="ev-post-title" ref={headingRef} tabIndex={-1} data-testid="text-standard-title">
                {corePending ? 'طلبك قيد المراجعة' : 'تم تأكيد تسجيلك'}
              </h2>
              {corePending ? pendingNote : (
                <p className="ev-post-lead" data-testid="status-standard-confirmed">
                  مقعدك في الورشة محجوز بالتذكرة العادية. نلتقي قريباً في رحلة النجاح والتجسيد.
                </p>
              )}
              <button type="button" className="ev-post-cta" onClick={onClose} data-testid="button-done">تم</button>
            </div>
          )}

          {stage === 'vip' && (
            <div className="ev-post-final ev-post-final--vip">
              <span className="ev-post-seal ev-post-seal--gold" aria-hidden="true"><Crown /></span>
              <span className="ev-post-member" data-testid="status-vip-member">VIP Member</span>
              <h2 id="ev-post-title" ref={headingRef} tabIndex={-1} data-testid="text-vip-success">
                تم تأكيد مقعد VIP بنجاح
              </h2>
              <p className="ev-post-lead">أهلاً بك في التجربة الأعمق مع ضحى.</p>
              {telegramUrl && (
                <a className="ev-post-tg" href={telegramUrl} target="_blank" rel="noopener noreferrer" data-testid="link-telegram">
                  <Send aria-hidden="true" />انضم إلى جروب VIP الخاص على Telegram
                </a>
              )}
              {corePending && pendingNote}
              <button type="button" className="ev-post-decline" onClick={onClose} data-testid="button-done">إغلاق</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
