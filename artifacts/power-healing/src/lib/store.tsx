import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { Language, TRANSLATIONS } from './translations';

export type CurrencyCode = 'JOD' | 'SAR' | 'AED' | 'USD';

export const RATES: Record<CurrencyCode, number> = {
  JOD: 1,
  SAR: 5.33,
  AED: 5.32,
  USD: 1.41
};

export const SYMBOLS: Record<CurrencyCode, string> = {
  JOD: 'د.أ',
  SAR: 'ر.س',
  AED: 'د.إ',
  USD: '$'
};

export type CartItem = {
  key: string;
  itemId?: string;
  itemKind?: string;
  purchaseVariant?: 'standard' | 'vip';
  nameKey: string;
  titleAr?: string;
  titleEn?: string;
  icon: string;
  jod: number;
  originalJod?: number;
  qty: number;
  telegramLink?: string;
  telegramStandardLink?: string;
  telegramVipLink?: string;
  requiresBooking?: boolean;
};

export type AddToCartOptions = {
  itemId?: string;
  itemKind?: string;
  purchaseVariant?: 'standard' | 'vip';
  titleAr?: string;
  titleEn?: string;
  originalJod?: number;
  telegramLink?: string;
  telegramStandardLink?: string;
  telegramVipLink?: string;
  requiresBooking?: boolean;
};

interface AppContextType {
  lang: Language;
  toggleLang: () => void;
  t: (key: string) => string;

  currency: CurrencyCode;
  setCurrency: (cur: CurrencyCode) => void;
  formatPrice: (jod: number, suffixAr?: string, suffixEn?: string) => string;

  cart: CartItem[];
  addToCart: (titleKey: string, icon: string, jod: number, opts?: AddToCartOptions) => void;
  changeQty: (key: string, delta: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('ar');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [userId, setUserId] = useState<string | null>(null);
  const cartKey = userId ? `dh_cart_${userId}` : 'dh_cart_guest';

  const [cart, setCart] = useState<CartItem[]>([]);

  // Sync cart with user auth state — each user gets their own isolated cart
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      const uid = u ? u.uid : null;
      setUserId(uid);
      try {
        const key = uid ? `dh_cart_${uid}` : 'dh_cart_guest';
        const raw = localStorage.getItem(key);
        setCart(raw ? JSON.parse(raw) : []);
      } catch {
        setCart([]);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    if (lang === 'en') {
      document.body.classList.add('ltr');
    } else {
      document.body.classList.remove('ltr');
    }
  }, [lang]);

  useEffect(() => {
    try { localStorage.setItem(cartKey, JSON.stringify(cart)); } catch {}
  }, [cart, cartKey]);

  const toggleLang = () => setLang(prev => prev === 'ar' ? 'en' : 'ar');

  const t = (key: string) => {
    return (TRANSLATIONS[key] && TRANSLATIONS[key][lang]) || key;
  };

  const formatPrice = (jod: number, suffixAr = '', suffixEn = '') => {
    const val = (jod * RATES[currency]).toFixed(2);
    const suffix = lang === 'ar' ? suffixAr : suffixEn;
    return `${SYMBOLS[currency]} ${val} ${suffix}`;
  };

  const addToCart = (titleKey: string, icon: string, jod: number, opts: AddToCartOptions = {}) => {
    setCart(prev => {
      const existing = prev.find(i => i.key === titleKey);
      if (existing) {
        return prev.map(i => i.key === titleKey ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, {
        key: titleKey,
        itemId: opts.itemId,
        itemKind: opts.itemKind,
        purchaseVariant: opts.purchaseVariant,
        nameKey: titleKey,
        titleAr: opts.titleAr,
        titleEn: opts.titleEn,
        icon,
        jod,
        originalJod: opts.originalJod,
        qty: 1,
        telegramLink: opts.telegramLink,
        telegramStandardLink: opts.telegramStandardLink,
        telegramVipLink: opts.telegramVipLink,
        requiresBooking: opts.requiresBooking,
      }];
    });
  };

  const changeQty = (key: string, delta: number) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.key === key) {
          return { ...i, qty: Math.max(0, i.qty + delta) };
        }
        return i;
      }).filter(i => i.qty > 0);
    });
  };

  const removeItem = (key: string) => {
    setCart(prev => prev.filter(i => i.key !== key));
  };

  const clearCart = () => setCart([]);

  const cartTotal = cart.reduce((sum, item) => sum + item.jod * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <AppContext.Provider value={{
      lang, toggleLang, t,
      currency, setCurrency, formatPrice,
      cart, addToCart, changeQty, removeItem, clearCart, cartTotal, cartCount
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
