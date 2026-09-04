import { useState, FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { useApp } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { MasahaLogo } from '@/components/icons';
import { PasswordField } from '@/components/ui/PasswordField';

export default function Signup() {
  const { t, lang } = useApp();
  const { signup } = useAuth();
  const [, setLocation] = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signup(name.trim(), email, password);
      setLocation('/');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') setError(t('auth.errInUse'));
      else if (code === 'auth/invalid-email') setError(t('auth.errEmail'));
      else if (code === 'auth/weak-password') setError(t('auth.errWeak'));
      else if (code === 'auth/operation-not-allowed') setError(t('auth.errNotEnabled'));
      else if (code === 'auth/unauthorized-domain') setError(t('auth.errDomain'));
      else if (code === 'auth/configuration-not-found') setError(t('auth.errNotEnabled'));
      else setError(`${t('auth.errGeneric')} (${code || err?.message || 'unknown'})`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100dvh-68px)] mt-[68px] flex items-center justify-center px-4 py-10 bg-gradient-to-br from-[#1a0a2e] via-[#2a1444] to-[#1a0a2e]">
      <div className="w-full max-w-md bg-[rgba(30,14,56,0.75)] backdrop-blur-md border border-[rgba(212,160,23,0.25)] rounded-2xl p-8 shadow-[0_16px_50px_rgba(0,0,0,0.5)]">
        <div className="flex justify-center mb-6">
          <MasahaLogo width={112} height={112} />
        </div>
        <h1 className="text-white text-2xl font-black text-center mb-2">{t('auth.signupTitle')}</h1>
        <p className="text-[rgba(255,255,255,0.6)] text-sm text-center mb-6">{t('auth.signupSub')}</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-[rgba(255,255,255,0.75)] text-sm font-semibold mb-1.5">{t('auth.name')}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.15)] rounded-xl px-4 py-3 text-white placeholder:text-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[hsl(var(--g500))] ${lang === 'ar' ? 'text-right' : 'text-left'}`}
              placeholder={t('auth.namePh')}
            />
          </div>

          <div>
            <label className="block text-[rgba(255,255,255,0.75)] text-sm font-semibold mb-1.5">{t('auth.email')}</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
              className={`w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.15)] rounded-xl px-4 py-3 text-white placeholder:text-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[hsl(var(--g500))] ${lang === 'ar' ? 'text-right' : 'text-left'}`}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-[rgba(255,255,255,0.75)] text-sm font-semibold mb-1.5">{t('auth.password')}</label>
            <PasswordField
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.15)] rounded-xl px-4 py-3 text-white placeholder:text-[rgba(255,255,255,0.3)] focus:outline-none focus:border-[hsl(var(--g500))] ${lang === 'ar' ? 'text-right' : 'text-left'}`}
            />
            <p className="text-[rgba(255,255,255,0.4)] text-xs mt-1">{t('auth.pwHint')}</p>
          </div>

          {error && (
            <div className="bg-[rgba(255,80,80,0.1)] border border-[rgba(255,80,80,0.3)] text-[#ff9999] text-sm rounded-lg px-3 py-2">{error}</div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-gradient-to-br from-[hsl(var(--g500))] to-[hsl(var(--g400))] text-[hsl(var(--p900))] font-black py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50"
          >
            {busy ? '…' : t('auth.signupBtn')}
          </button>
        </form>

        <p className="text-center text-sm text-[rgba(255,255,255,0.6)] mt-6">
          {t('auth.haveAccount')}{' '}
          <Link href="/login" className="text-[hsl(var(--g300))] font-bold hover:underline">{t('auth.loginBtn')}</Link>
        </p>
        <p className="text-center text-sm text-[rgba(255,255,255,0.4)] mt-3">
          <Link href="/" className="hover:text-[hsl(var(--g300))]">{t('auth.backHome')}</Link>
        </p>
      </div>
    </div>
  );
}
