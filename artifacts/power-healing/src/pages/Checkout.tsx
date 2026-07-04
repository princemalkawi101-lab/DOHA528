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

// PayPal client config is read at build time from Vite env vars.
// Required:  VITE_PAYPAL_CLIENT_ID  (PayPal REST app client id, public — safe to ship)
// Optional:  VITE_PAYPAL_CURRENCY   (defaults to "USD")
// Optional:  VITE_PAYPAL_JOD_TO_USD (defaults to 1.41)
const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;
const PAYPAL_CURRENCY = (import.meta.env.VITE_PAYPAL_CURRENCY as string | undefined) || 'USD';
const JOD_TO_USD = Number(import.meta.env.VITE_PAYPAL_JOD_TO_USD) || 1.41;

// Base URL for the backend API. When deployed on a different origin (Netlify),
// set VITE_API_URL to the full origin of the api-server, e.g.
//   VITE_API_URL=https://your-repl-name.replit.app
// Leave empty/unset for same-origin development on Replit.
const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) || '').replace(/\/+$/, '');
const apiUrl = (path: string) => `${API_BASE}${path}`;

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
          {configError && (
            <div className="mb-4 bg-[rgba(255,80,80,0.1)] border border-[rgba(255,80,80,0.3)] text-[#ff9999] text-sm rounded-xl px-4 py-3">{configError}</div>
          )}

          <div className="bg-white rounded-xl p-3">
            {scriptOptions ? (
              <PayPalScriptProvider options={scriptOptions}>
                <PayPalButtons
                  disabled={processing || cart.length === 0}
                  style={{ layout: 'vertical', shape: 'rect', label: 'paypal' }}
                  forceReRender={[cartTotal, cart.length]}
                  createOrder={async () => {
                    setError('');
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
                    if (!res.ok) {
                      const data = await res.json().catch(() => ({}));
                      throw new Error(data.error || 'create-order failed');
                    }
                    const data = await res.json();
                    return data.id as string;
                  }}
                  onApprove={async (data) => {
                    setProcessing(true);
                    try {
                      const res = await fetch(apiUrl('/api/paypal/capture-order'), {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId: data.orderID }),
                      });
                      const result = await res.json();
                      if (!res.ok || result.captureStatus !== 'COMPLETED') {
                        throw new Error(result.error || 'Payment not completed');
                      }
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
                      console.error(err);
                      setError(
                        lang === 'ar'
                          ? 'تم الدفع لكن حدث خطأ في تسجيل الطلب. تواصل معنا مع رقم الطلب.'
                          : 'Payment captured but order recording failed. Please contact support with your order ID.',
                      );
                      setProcessing(false);
                    }
                  }}
                  onError={(err) => {
                    console.error('PayPal error', err);
                    setError(
                      lang === 'ar'
                        ? 'حدث خطأ أثناء الدفع. يرجى المحاولة مرة أخرى.'
                        : 'A payment error occurred. Please try again.',
                    );
                  }}
                  onCancel={() => {
                    setError(
                      lang === 'ar'
                        ? 'تم إلغاء عملية الدفع.'
                        : 'Payment was cancelled.',
                    );
                  }}
                />
              </PayPalScriptProvider>
            ) : (
              <div className="text-[#1a0a2e] text-sm text-center py-6">
                {configError || (lang === 'ar' ? 'جاري تحميل بوابة الدفع…' : 'Loading payment gateway…')}
              </div>
            )}
          </div>

          <p className="text-center text-[rgba(255,255,255,0.45)] text-xs mt-4">
            🔒 {lang === 'ar'
              ? 'الدفع آمن ومُشفّر عبر PayPal'
              : 'Secure encrypted checkout via PayPal'}
          </p>
        </div>
      </div>
    </div>
  );
}
