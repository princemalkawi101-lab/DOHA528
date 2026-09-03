import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation } from 'wouter';
import {
  PayPalScriptProvider,
  PayPalButtons,
  type ReactPayPalScriptOptions,
} from '@paypal/react-paypal-js';
import { useApp } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { savePurchase } from '@/lib/purchases';

// PayPal client config is read at build time.
// VITE_PAYPAL_CLIENT_ID takes priority; PAYPAL_CLIENT_ID is the Vercel fallback.
// Optional:  VITE_PAYPAL_CURRENCY   (defaults to "USD")
// Optional:  VITE_PAYPAL_JOD_TO_USD (defaults to 1.41)
const PAYPAL_CLIENT_ID =
  (import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined) ||
  (typeof process !== 'undefined' ? process.env.PAYPAL_CLIENT_ID : undefined);
const PAYPAL_CURRENCY = (import.meta.env.VITE_PAYPAL_CURRENCY as string | undefined) || 'USD';
const JOD_TO_USD = Number(import.meta.env.VITE_PAYPAL_JOD_TO_USD) || 1.41;

// Base URL for the backend API. When deployed on a different origin (Netlify),
// set VITE_API_URL to the full origin of the api-server, e.g.
//   VITE_API_URL=https://your-repl-name.replit.app
// Leave empty/unset for same-origin development on Replit.
const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) || '').replace(/\/+$/, '');
const apiUrl = (path: string) => `${API_BASE}${path}`;

type ApiResponse = {
  id?: unknown;
  captureStatus?: unknown;
  error?: unknown;
  code?: unknown;
  paypalErrorName?: unknown;
  paypalStatus?: unknown;
  paypalOperation?: unknown;
  debugId?: unknown;
  requestId?: unknown;
  [key: string]: unknown;
};

async function readApiResponse(response: Response): Promise<ApiResponse> {
  const text = await response.text();
  if (!text) return {};

  try {
    const body: unknown = JSON.parse(text);
    if (body && typeof body === 'object') return body as ApiResponse;
  } catch {
    // Keep a bounded preview for console diagnostics when the API returns
    // HTML/text (for example, if the frontend is pointed at the wrong host).
  }

  return { error: 'Unexpected non-JSON response from payment API', rawPreview: text.slice(0, 240) };
}

function getApiErrorMessage(body: ApiResponse, fallback: string): string {
  return typeof body.error === 'string' && body.error ? body.error : fallback;
}

function formatPayPalDiagnostic(body: ApiResponse, fallback: string, lang: string): string {
  const providerCode = typeof body.paypalErrorName === 'string' ? body.paypalErrorName : '';
  const providerStatus = typeof body.paypalStatus === 'number' ? String(body.paypalStatus) : '';
  const requestId = typeof body.requestId === 'string' ? body.requestId : '';
  const debugId = typeof body.debugId === 'string' ? body.debugId : '';
  const details = Array.isArray(body.details)
    ? body.details
        .map((detail) => {
          if (!detail || typeof detail !== 'object') return '';
          const value = detail as Record<string, unknown>;
          return [
            typeof value.issue === 'string' ? value.issue : '',
            typeof value.description === 'string' ? value.description : '',
            typeof value.field === 'string' ? `field=${value.field}` : '',
            typeof value.value === 'string' ? `value=${value.value}` : '',
            typeof value.location === 'string' ? `location=${value.location}` : '',
          ].filter(Boolean).join(' — ');
        })
        .filter(Boolean)
        .join('\n')
    : '';

  const lines = [
    `${lang === 'ar' ? 'خطأ PayPal' : 'PayPal error'}: ${getApiErrorMessage(body, fallback)}`,
    providerCode && `${lang === 'ar' ? 'رمز PayPal' : 'PayPal code'}: ${providerCode}`,
    providerStatus && `${lang === 'ar' ? 'حالة PayPal' : 'PayPal status'}: ${providerStatus}`,
    details && `${lang === 'ar' ? 'تفاصيل PayPal' : 'PayPal details'}: ${details}`,
    debugId && `${lang === 'ar' ? 'معرّف PayPal التشخيصي' : 'PayPal debug ID'}: ${debugId}`,
    requestId && `${lang === 'ar' ? 'رقم تتبع الطلب' : 'Request ID'}: ${requestId}`,
  ];

  return lines.filter(Boolean).join('\n');
}

export default function Checkout() {
  const { t, lang, cart, cartTotal, formatPrice, changeQty, removeItem, clearCart } = useApp();
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const configError = !PAYPAL_CLIENT_ID
    ? (lang === 'ar'
        ? 'بوابة الدفع غير مهيّأة. يرجى التواصل مع الدعم.'
        : 'Payment gateway is not configured. Please contact support.')
    : '';

  useEffect(() => {
    if (!loading && !user) {
      sessionStorage.setItem('dh_redirect_after_login', '/checkout');
      setLocation('/login');
    }
  }, [loading, user, setLocation]);

  const scriptOptions: ReactPayPalScriptOptions | null = useMemo(() => {
    if (!PAYPAL_CLIENT_ID) return null;
    return {
      clientId: PAYPAL_CLIENT_ID,
      currency: PAYPAL_CURRENCY,
      intent: 'capture',
      components: 'buttons',
    };
  }, []);

  const usdTotal = useMemo(() => {
    return (cartTotal * JOD_TO_USD).toFixed(2);
  }, [cartTotal]);

  if (loading) {
    return (
      <div className="min-h-[calc(100dvh-68px)] mt-[68px] flex items-center justify-center text-[rgba(255,255,255,0.6)]">…</div>
    );
  }
  if (!user) return null;

  if (cart.length === 0) {
    return (
      <div className="min-h-[calc(100dvh-68px)] mt-[68px] flex items-center justify-center px-4 py-10 bg-gradient-to-br from-[#1a0a2e] via-[#2a1444] to-[#1a0a2e]">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h1 className="text-white text-2xl font-black mb-3">{t('cart.empty')}</h1>
          <Link href="/" className="inline-block bg-[hsl(var(--g500))] text-[hsl(var(--p900))] font-bold py-2 px-5 rounded-lg">{t('auth.backHome')}</Link>
        </div>
      </div>
    );
  }

  const recordPurchases = async () => {
    for (const item of cart) {
      const kind = (item.itemId ? (
        item.requiresBooking ? 'individual-online' :
        item.nameKey.includes('workshop') ? 'workshop' :
        item.nameKey.includes('recorded') ? 'recorded' : 'course'
      ) : 'course') as any;

      await savePurchase({
        userId: user.uid,
        userEmail: user.email,
        userName: user.displayName,
        itemId: item.itemId || item.key,
        itemTitleAr: item.titleAr || item.nameKey,
        itemTitleEn: item.titleEn || item.nameKey,
        itemKind: kind,
        paidJod: item.jod * item.qty,
      });
    }
  };

  return (
    <div className="min-h-[calc(100dvh-68px)] mt-[68px] px-4 py-10 bg-gradient-to-br from-[#1a0a2e] via-[#2a1444] to-[#1a0a2e]">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-white text-3xl font-black mb-2">{lang === 'ar' ? 'إتمام الشراء' : 'Checkout'}</h1>
        <p className="text-[rgba(255,255,255,0.6)] text-sm mb-6">
          {lang === 'ar' ? 'راجع طلبك وأكمل الدفع عبر PayPal' : 'Review your order and complete payment with PayPal'}
        </p>

        <div className="bg-[rgba(30,14,56,0.75)] border border-[rgba(212,160,23,0.25)] rounded-2xl p-6 mb-4">
          {cart.map((item) => {
            const title = lang === 'ar' ? (item.titleAr || t(item.nameKey)) : (item.titleEn || t(item.nameKey));
            const hasDiscount = item.originalJod && item.originalJod > item.jod;
            return (
              <div key={item.key} className="flex items-center gap-4 py-4 border-b border-[rgba(255,255,255,0.08)] last:border-0">
                <div className="w-12 h-12 rounded-xl shrink-0 bg-gradient-to-br from-[hsl(var(--p600))] to-[hsl(var(--p400))] flex items-center justify-center text-xl">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-semibold">{title}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[hsl(var(--g300))] font-bold">{formatPrice(item.jod)}</span>
                    {hasDiscount && <span className="text-[rgba(255,255,255,0.4)] text-sm line-through">{formatPrice(item.originalJod!)}</span>}
                  </div>
                  {item.requiresBooking && (
                    <div className="text-[hsl(var(--g400))] text-[0.72rem] mt-1.5">
                      📅 {lang === 'ar' ? 'سيُطلب منك حجز موعد بعد التأكيد' : 'You will book your appointment after confirmation'}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => changeQty(item.key, -1)} disabled={processing} className="w-8 h-8 rounded-md bg-[rgba(255,255,255,0.08)] text-white hover:bg-[rgba(255,255,255,0.15)] disabled:opacity-40">-</button>
                  <span className="text-white w-6 text-center font-bold">{item.qty}</span>
                  <button onClick={() => changeQty(item.key, 1)} disabled={processing} className="w-8 h-8 rounded-md bg-[rgba(255,255,255,0.08)] text-white hover:bg-[rgba(255,255,255,0.15)] disabled:opacity-40">+</button>
                  <button onClick={() => removeItem(item.key)} disabled={processing} className="ms-2 text-[rgba(255,255,255,0.4)] hover:text-[#ff7878] disabled:opacity-40">✕</button>
                </div>
              </div>
            );
          })}

          <div className="flex justify-between items-center pt-5 mt-3 border-t border-[rgba(212,160,23,0.25)]">
            <span className="text-white text-lg font-bold">{t('cart.total')}</span>
            <div className="text-right">
              <div className="text-[hsl(var(--g300))] text-2xl font-black">{formatPrice(cartTotal)}</div>
              {usdTotal && (
                <div className="text-[rgba(255,255,255,0.5)] text-xs mt-0.5" dir="ltr">
                  ≈ ${usdTotal} USD {lang === 'ar' ? '(يُحصّل بالدولار)' : '(charged in USD)'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PayPal Payment */}
        <div className="bg-[rgba(30,14,56,0.75)] border border-[rgba(212,160,23,0.25)] rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(212,160,23,0.08)] border border-[rgba(212,160,23,0.2)] mb-5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--g500))] to-[hsl(var(--g400))] flex items-center justify-center text-[hsl(var(--p900))] font-black text-[0.72rem] shrink-0">
              {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-white text-sm font-semibold truncate">{user.displayName || user.email}</div>
              <div className="text-[rgba(255,255,255,0.4)] text-xs truncate" dir="ltr">{user.email}</div>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-[rgba(255,80,80,0.1)] border border-[rgba(255,80,80,0.3)] text-[#ff9999] text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          {scriptOptions ? (
            <>
              <div className="bg-white rounded-xl p-3">
                <PayPalScriptProvider options={scriptOptions}>
                  <PayPalButtons
                    disabled={processing || cart.length === 0}
                    style={{ layout: 'vertical', shape: 'rect', label: 'paypal' }}
                    forceReRender={[cartTotal, cart.length]}
                    createOrder={async () => {
                      setError('');
                      try {
                        const res = await fetch(apiUrl('/api/paypal/create-order'), {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            cart: cart.map((c) => ({
                              titleEn: c.titleEn || c.nameKey,
                              titleAr: c.titleAr || c.nameKey,
                              nameKey: c.nameKey,
                              jod: c.jod,
                              qty: c.qty,
                            })),
                          }),
                        });
                        const data = await readApiResponse(res);
                        if (!res.ok || typeof data.id !== 'string' || !data.id) {
                          console.error('[PayPal] create-order failed', {
                            status: res.status,
                            code: data.code,
                            paypalErrorName: data.paypalErrorName,
                            paypalStatus: data.paypalStatus,
                            paypalOperation: data.paypalOperation,
                            requestId: data.requestId,
                            debugId: data.debugId,
                            details: data.details,
                            rawPreview: data.rawPreview,
                          });
                          setError(formatPayPalDiagnostic(data, 'PayPal order creation failed', lang));
                          throw new Error(getApiErrorMessage(data, 'PayPal order creation failed'));
                        }
                        return data.id;
                      } catch (err) {
                        console.error('[PayPal] create-order request failed', err);
                        throw err;
                      }
                    }}
                    onApprove={async (data) => {
                      setProcessing(true);
                      let captureCompleted = false;
                      let paymentErrorMessage = '';
                      try {
                        const res = await fetch(apiUrl('/api/paypal/capture-order'), {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ orderId: data.orderID }),
                        });
                        const result = await readApiResponse(res);
                        if (!res.ok || result.captureStatus !== 'COMPLETED') {
                          console.error('[PayPal] capture-order failed', {
                            status: res.status,
                            orderId: data.orderID,
                            code: result.code,
                            paypalErrorName: result.paypalErrorName,
                            paypalStatus: result.paypalStatus,
                            paypalOperation: result.paypalOperation,
                            requestId: result.requestId,
                            debugId: result.debugId,
                            details: result.details,
                            rawPreview: result.rawPreview,
                            captureStatus: result.captureStatus,
                          });
                          paymentErrorMessage = formatPayPalDiagnostic(result, 'Payment not completed', lang);
                          setError(paymentErrorMessage);
                          throw new Error(getApiErrorMessage(result, 'Payment not completed'));
                        }
                        captureCompleted = true;
                        sessionStorage.setItem('dh_last_purchase', JSON.stringify(cart));
                        sessionStorage.setItem('dh_last_payment', JSON.stringify({
                          provider: 'paypal',
                          orderId: result.orderId,
                          captureId: result.captureId,
                          amount: result.amount,
                        }));
                        await recordPurchases();
                        clearCart();
                        setLocation('/payment-success');
                      } catch (err: any) {
                        console.error('[PayPal] payment flow failed', {
                          orderId: data.orderID,
                          captureCompleted,
                          error: err,
                        });
                        setError(
                          captureCompleted && lang === 'ar'
                            ? 'تم الدفع لكن حدث خطأ في تسجيل الطلب. تواصل معنا مع رقم الطلب.'
                            : captureCompleted
                              ? 'Payment captured but order recording failed. Please contact support with your order ID.'
                              : paymentErrorMessage
                                ? paymentErrorMessage
                              : lang === 'ar'
                                  ? 'تعذّر إتمام الدفع عبر PayPal. يرجى المحاولة مرة أخرى أو فتح الرابط في متصفح خارجي.'
                                  : 'PayPal payment could not be completed. Please try again or open the link in an external browser.',
                        );
                        setProcessing(false);
                      }
                    }}
                    onError={(paypalError) => {
                      console.error('[PayPal] SDK error', paypalError);
                      setError(
                        lang === 'ar'
                          ? 'حدث خطأ أثناء الدفع. يرجى المحاولة مرة أخرى.'
                          : 'A payment error occurred. Please try again.',
                      );
                      setProcessing(false);
                    }}
                    onCancel={(cancelData) => {
                      console.info('[PayPal] checkout cancelled', cancelData);
                      setError(
                        lang === 'ar'
                          ? 'تم إلغاء عملية الدفع.'
                          : 'Payment was cancelled.',
                      );
                      setProcessing(false);
                    }}
                  />
                </PayPalScriptProvider>
              </div>
              <p className="text-center text-[rgba(255,255,255,0.45)] text-xs mt-4">
                🔒 {lang === 'ar' ? 'الدفع آمن ومُشفّر عبر PayPal' : 'Secure encrypted checkout via PayPal'}
              </p>
            </>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="bg-[rgba(255,165,0,0.08)] border border-[rgba(255,165,0,0.3)] rounded-xl px-4 py-3 text-sm text-[#ffd87a]">
                {lang === 'ar'
                  ? '⚠️ بوابة PayPal غير مفعّلة حالياً. يمكنك إتمام طلبك عبر واتساب وسنرتّب الدفع معك مباشرة.'
                  : '⚠️ PayPal gateway is not active yet. You can complete your order via WhatsApp and we will arrange payment with you directly.'}
              </div>
              <a
                href="https://wa.me/qr/MZLIT6ZFXNXQA1"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-3.5 px-6 rounded-xl font-black text-base text-white transition-all hover:opacity-90 cursor-pointer"
                style={{ backgroundColor: '#25D366' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
                {lang === 'ar' ? 'إتمام الطلب عبر واتساب' : 'Complete Order via WhatsApp'}
              </a>
              <p className="text-center text-[rgba(255,255,255,0.35)] text-xs">
                {lang === 'ar'
                  ? 'أرسلي لنا قائمة طلبك وسنرسل لك رابط الدفع فوراً'
                  : 'Send us your order list and we will send you the payment link immediately'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
