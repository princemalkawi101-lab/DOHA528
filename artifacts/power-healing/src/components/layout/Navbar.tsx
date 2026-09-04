import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useApp } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { MasahaLogo } from '@/components/icons';

export function Navbar() {
  const { lang, toggleLang, t, cart, cartCount, cartTotal, changeQty, removeItem, clearCart, formatPrice, currency, setCurrency } = useApp();
  const { user, isAdmin, logout } = useAuth();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const cartRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setIsCartOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [location, navigate] = useLocation();
  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  function scrollToProducts(tab: 'course' | 'workshop' | 'recorded' | 'individual-online' | 'vip' | 'all') {
    const hash = tab === 'all' ? '#products' : `#products-${tab}`;
    try { history.replaceState(null, '', hash); } catch {}
    window.dispatchEvent(new CustomEvent('products:set-tab', { detail: tab }));
    requestAnimationFrame(() => {
      const el = document.getElementById('products');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function handleProductsNav(
    e: React.MouseEvent<HTMLAnchorElement>,
    tab: 'course' | 'workshop' | 'recorded' | 'individual-online' | 'vip',
  ) {
    e.preventDefault();
    setIsMenuOpen(false);
    if (location !== '/') {
      navigate(`/#products-${tab}`);
      setTimeout(() => scrollToProducts(tab), 120);
    } else {
      scrollToProducts(tab);
    }
  }

  const MENU_LINK = "block text-[rgba(255,255,255,0.85)] text-[0.92rem] font-medium py-3 px-5 border-b border-[rgba(255,255,255,0.07)] hover:bg-[rgba(212,160,23,0.1)] hover:text-[hsl(var(--g300))] transition-colors";

  function handleBookClick(e: React.MouseEvent) {
    e.preventDefault();
    if (location !== '/') {
      navigate('/#products-course');
      setTimeout(() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    } else {
      scrollToProducts('course');
    }
  }

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 bg-[rgba(26,10,46,0.97)] backdrop-blur-md border-b border-[rgba(212,160,23,0.2)]">
      <div className="max-w-[1280px] mx-auto px-6 h-[68px] flex items-center justify-between gap-3">
        
        <a
          href="/#hero"
          onClick={(e) => {
            e.preventDefault();
            if (location !== '/') {
              navigate('/#hero');
              setTimeout(() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }), 60);
            } else {
              document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="flex items-center gap-2 text-white text-[1.1rem] font-bold whitespace-nowrap"
        >
          <span className="relative flex items-center justify-center w-[76px] h-[64px] -my-1.5">
            <MasahaLogo width={82} height={82} />
          </span>
        </a>

        <div className="flex items-center gap-2.5 shrink-0">
          <button 
            onClick={toggleLang}
            className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.85)] text-[0.78rem] font-bold py-1.5 px-3 rounded-lg cursor-pointer tracking-wider transition-all hover:bg-[rgba(212,160,23,0.2)] hover:border-[var(--g500)] whitespace-nowrap"
          >
            {lang === 'ar' ? 'EN' : 'AR'}
          </button>

          {/* Cart */}
          <div className="relative" ref={cartRef}>
            <button 
              onClick={() => setIsCartOpen(!isCartOpen)}
              className="flex items-center justify-center w-10 h-10 rounded-[10px] bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.85)] cursor-pointer relative"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -left-1.5 bg-[hsl(var(--g400))] text-[hsl(var(--p900))] text-[0.65rem] font-black leading-none min-w-[18px] h-[18px] rounded-full flex items-center justify-center p-0.5">
                  {cartCount}
                </span>
              )}
            </button>

            {isCartOpen && (
              <div className={`absolute top-[calc(100%+10px)] ${lang === 'en' ? 'right-0' : 'left-0'} w-[340px] max-w-[calc(100vw-2rem)] bg-[#1e0e38] border border-[rgba(212,160,23,0.25)] rounded-[16px] overflow-hidden shadow-[0_16px_50px_rgba(0,0,0,0.5)] z-[100] animate-in fade-in slide-in-from-top-2 duration-200`}>
                <div className="flex items-center justify-between p-4 border-b border-[rgba(255,255,255,0.08)]">
                  <h3 className="text-white text-base font-bold">{t('cart.title')}</h3>
                  <button onClick={clearCart} className="text-[rgba(255,255,255,0.45)] text-[0.78rem] hover:text-[#ff7878] transition-colors">{t('cart.clear')}</button>
                </div>
                
                <div className="max-h-[280px] overflow-y-auto">
                  {cart.length === 0 ? (
                    <div className="p-10 text-center text-[rgba(255,255,255,0.4)] text-[0.9rem]">{t('cart.empty')}</div>
                  ) : (
                    cart.map(item => (
                      <div key={item.key} className="flex items-start gap-3.5 p-3.5 border-b border-[rgba(255,255,255,0.06)]">
                        <div className="w-[42px] h-[42px] rounded-[10px] shrink-0 bg-gradient-to-br from-[hsl(var(--p600))] to-[hsl(var(--p400))] flex items-center justify-center text-[1.1rem]">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[rgba(255,255,255,0.9)] text-[0.88rem] font-semibold leading-snug">{t(item.nameKey)}</div>
                          <div className="text-[hsl(var(--g400))] text-[0.82rem] font-bold mt-1">{formatPrice(item.jod)}</div>
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <button onClick={() => changeQty(item.key, -1)} className="w-[22px] h-[22px] rounded-md bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.15)] text-white flex items-center justify-center cursor-pointer hover:bg-[rgba(255,255,255,0.2)]">-</button>
                            <span className="text-white text-[0.82rem] font-bold min-w-[16px] text-center">{item.qty}</span>
                            <button onClick={() => changeQty(item.key, 1)} className="w-[22px] h-[22px] rounded-md bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.15)] text-white flex items-center justify-center cursor-pointer hover:bg-[rgba(255,255,255,0.2)]">+</button>
                          </div>
                        </div>
                        <button onClick={() => removeItem(item.key)} className="text-[rgba(255,255,255,0.3)] hover:text-[#ff7878] p-0.5 cursor-pointer">✕</button>
                      </div>
                    ))
                  )}
                </div>

                {cart.length > 0 && (
                  <div className="p-4 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(0,0,0,0.2)]">
                    <div className="flex justify-between items-center mb-3.5">
                      <span className="text-[rgba(255,255,255,0.6)] text-[0.88rem]">{t('cart.total')}</span>
                      <span className="text-[hsl(var(--g300))] text-[1.1rem] font-black">{formatPrice(cartTotal)}</span>
                    </div>
                    <button onClick={handleCheckout} className="w-full p-3 rounded-[10px] bg-gradient-to-br from-[hsl(var(--g500))] to-[hsl(var(--g400))] text-[hsl(var(--p900))] font-bold text-[0.95rem] hover:opacity-90 transition-opacity">
                      {t('cart.checkout')}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop: user controls */}
          {user ? (
            <div className="hidden md:flex items-center gap-1.5">
              <div className="flex items-center gap-2 bg-[rgba(212,160,23,0.08)] border border-[rgba(212,160,23,0.3)] py-1.5 px-3 rounded-lg max-w-[180px]">
                <span className="w-7 h-7 shrink-0 rounded-full bg-gradient-to-br from-[hsl(var(--g500))] to-[hsl(var(--g400))] text-[hsl(var(--p900))] font-black text-[0.78rem] flex items-center justify-center">
                  {(user.displayName || user.email || '?').trim().charAt(0).toUpperCase()}
                </span>
                <span className="text-[rgba(255,255,255,0.92)] text-[0.78rem] font-semibold truncate">
                  {t('auth.hello')} {user.displayName || (user.email || '').split('@')[0]}
                </span>
              </div>
              {!isAdmin && (
              <Link
                href="/my-courses"
                className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.85)] py-1.5 px-3 rounded-lg font-semibold text-[0.78rem] whitespace-nowrap transition-colors hover:bg-[rgba(212,160,23,0.15)] hover:border-[rgba(212,160,23,0.4)] hover:text-[hsl(var(--g300))]"
              >
                {lang === 'ar' ? 'دوراتي' : 'My Courses'}
              </Link>
            )}
              <Link
                href="/my-profile"
                className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.85)] py-1.5 px-3 rounded-lg font-semibold text-[0.78rem] whitespace-nowrap transition-colors hover:bg-[rgba(255,255,255,0.12)]"
              >
                {lang === 'ar' ? 'ملفي الشخصي' : 'My Profile'}
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="bg-[rgba(212,160,23,0.12)] border border-[rgba(212,160,23,0.4)] text-[hsl(var(--g300))] py-1.5 px-3 rounded-lg font-bold text-[0.78rem] whitespace-nowrap transition-colors hover:bg-[rgba(212,160,23,0.22)]"
                >
                  {t('auth.admin')}
                </Link>
              )}
              <button
                onClick={() => logout()}
                className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.85)] py-1.5 px-3 rounded-lg font-semibold text-[0.78rem] whitespace-nowrap transition-colors hover:bg-[rgba(255,80,80,0.15)] hover:text-[#ffb0b0] hover:border-[rgba(255,80,80,0.35)]"
              >
                {t('auth.logout')}
              </button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5">
              <Link
                href="/login"
                className="bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.9)] py-1.5 px-3 rounded-lg font-semibold text-[0.78rem] whitespace-nowrap transition-all hover:bg-[rgba(255,255,255,0.12)] hover:border-[hsl(var(--g500))] hover:text-[hsl(var(--g300))]"
              >
                {t('auth.login')}
              </Link>
              <Link
                href="/signup"
                className="bg-gradient-to-br from-[hsl(var(--g500))] to-[hsl(var(--g400))] text-[hsl(var(--p900))] py-1.5 px-3 rounded-lg font-bold text-[0.78rem] whitespace-nowrap transition-opacity hover:opacity-90"
              >
                {t('auth.signup')}
              </Link>
            </div>
          )}

          <button onClick={handleBookClick} className="hidden lg:inline-block bg-[hsl(var(--g500))] text-[hsl(var(--p900))] py-2 px-4 rounded-lg font-bold text-[0.82rem] whitespace-nowrap transition-colors hover:bg-[hsl(var(--g400))] border-none cursor-pointer">
            {t('nav.book')}
          </button>

          {/* Hamburger menu */}
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`flex flex-col justify-center items-center gap-[5px] w-10 h-10 rounded-[10px] bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] cursor-pointer transition-colors ${isMenuOpen ? 'bg-[rgba(212,160,23,0.2)] border-[hsl(var(--g500))]' : ''}`}
            >
              <span className={`block w-[18px] h-0.5 rounded-sm transition-colors ${isMenuOpen ? 'bg-[hsl(var(--g300))]' : 'bg-white'}`}></span>
              <span className={`block w-[18px] h-0.5 rounded-sm transition-colors ${isMenuOpen ? 'bg-[hsl(var(--g300))]' : 'bg-white'}`}></span>
              <span className={`block w-[18px] h-0.5 rounded-sm transition-colors ${isMenuOpen ? 'bg-[hsl(var(--g300))]' : 'bg-white'}`}></span>
            </button>

            {isMenuOpen && (
              <div
                className={`absolute top-[calc(100%+10px)] ${lang === 'en' ? 'right-0' : 'left-0'} bg-[#1e0e38] border border-[rgba(212,160,23,0.25)] rounded-[14px] min-w-[260px] shadow-[0_16px_50px_rgba(0,0,0,0.5)] z-[100] animate-in fade-in slide-in-from-top-2 duration-200`}
                style={{ maxHeight: 'calc(100dvh - 90px)', overflowY: 'auto' }}
              >
                {/* Nav links */}
                <div className="flex flex-col">
                  <a href="/#hero" onClick={(e) => { e.preventDefault(); setIsMenuOpen(false); if (location !== '/') { navigate('/#hero'); setTimeout(() => document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }), 60); } else { document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth' }); } }} className={MENU_LINK}>{t('nav.home')}</a>
                  <a href="/#products-course" onClick={(e) => handleProductsNav(e, 'course')} className={MENU_LINK}>{t('nav.courses')}</a>
                  <a href="/#products-workshop" onClick={(e) => handleProductsNav(e, 'workshop')} className={MENU_LINK}>{t('nav.workshops')}</a>
                  <a href="/#products-recorded" onClick={(e) => handleProductsNav(e, 'recorded')} className={MENU_LINK}>{t('nav.recorded')}</a>
                  <a href="/#products-individual-online" onClick={(e) => handleProductsNav(e, 'individual-online')} className={MENU_LINK}>{t('nav.sessions')}</a>
                  <a href="/#products-vip" onClick={(e) => handleProductsNav(e, 'vip')} className={MENU_LINK}>{t('nav.vip')}</a>
                  <a href="#blog" onClick={() => setIsMenuOpen(false)} className={MENU_LINK}>{t('nav.blog')}</a>
                  <a href="#about" onClick={() => setIsMenuOpen(false)} className={MENU_LINK}>{t('nav.about')}</a>
                  <a href="#book" onClick={() => setIsMenuOpen(false)} className="block text-[rgba(255,255,255,0.85)] text-[0.92rem] font-medium py-3 px-5 hover:bg-[rgba(212,160,23,0.1)] hover:text-[hsl(var(--g300))] transition-colors">{t('nav.contact')}</a>
                </div>

                {/* Auth section */}
                <div className="p-3.5 px-5 border-t border-[rgba(212,160,23,0.15)] flex flex-col gap-2">
                  {user ? (
                    <>
                      <div className="text-[rgba(255,255,255,0.5)] text-[0.72rem] truncate" dir="ltr">{user.email}</div>
                      {!isAdmin && (
                        <Link href="/my-courses" onClick={() => setIsMenuOpen(false)} className="block text-[rgba(255,255,255,0.9)] text-[0.88rem] font-semibold py-2 px-3 rounded-md bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] hover:bg-[rgba(212,160,23,0.15)] hover:border-[rgba(212,160,23,0.35)] hover:text-[hsl(var(--g300))] transition-colors text-center">
                          {lang === 'ar' ? '📚 دوراتي' : '📚 My Courses'}
                        </Link>
                      )}
                      <Link href="/my-profile" onClick={() => setIsMenuOpen(false)} className="block text-[rgba(255,255,255,0.9)] text-[0.88rem] font-semibold py-2 px-3 rounded-md bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.11)] transition-colors text-center">
                        {lang === 'ar' ? '👤 ملفي الشخصي' : '👤 My Profile'}
                      </Link>
                      {isAdmin && (
                        <Link href="/admin" onClick={() => setIsMenuOpen(false)} className="block text-[hsl(var(--g300))] text-[0.88rem] font-bold py-2 px-3 rounded-md bg-[rgba(212,160,23,0.12)] border border-[rgba(212,160,23,0.3)] text-center hover:bg-[rgba(212,160,23,0.2)]">{t('auth.admin')}</Link>
                      )}
                      <button onClick={() => { logout(); setIsMenuOpen(false); }} className="text-[#ffb0b0] text-[0.88rem] font-semibold py-2 px-3 rounded-md bg-[rgba(255,80,80,0.1)] border border-[rgba(255,80,80,0.25)] hover:bg-[rgba(255,80,80,0.2)]">
                        {t('auth.logout')}
                      </button>
                    </>
                  ) : (
                    <div className="flex gap-2">
                      <Link href="/login" onClick={() => setIsMenuOpen(false)} className="flex-1 text-center text-white text-[0.88rem] font-semibold py-2 rounded-md bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.12)]">{t('auth.login')}</Link>
                      <Link href="/signup" onClick={() => setIsMenuOpen(false)} className="flex-1 text-center text-[hsl(var(--p900))] text-[0.88rem] font-bold py-2 rounded-md bg-[hsl(var(--g500))] hover:bg-[hsl(var(--g400))]">{t('auth.signup')}</Link>
                    </div>
                  )}
                </div>

                {/* Currency selector — full visibility, no clipping */}
                <div className="p-3.5 px-5 border-t border-[rgba(212,160,23,0.15)]">
                  <span className="block text-[rgba(255,255,255,0.45)] text-[0.72rem] mb-2">{t('nav.currency')}</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(['JOD', 'SAR', 'AED', 'USD'] as const).map(cur => (
                      <button 
                        key={cur}
                        onClick={() => setCurrency(cur)}
                        className={`text-[0.72rem] font-semibold py-1 px-2.5 rounded-md cursor-pointer transition-all ${currency === cur ? 'bg-[rgba(212,160,23,0.25)] border-[hsl(var(--g500))] text-[hsl(var(--g300))] border' : 'bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.12)] text-[rgba(255,255,255,0.7)]'}`}
                      >
                        {cur}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
