import { useState, FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { useApp } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { auth } from '@/lib/firebase';
import { PasswordField } from '@/components/ui/PasswordField';

export default function MyProfile() {
  const { lang } = useApp();
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [pwError, setPwError] = useState('');

  if (!loading && !user) {
    sessionStorage.setItem('dh_redirect_after_login', '/my-profile');
    setLocation('/login');
    return null;
  }

  if (loading || !user) {
    return (
      <div className="min-h-[calc(100dvh-68px)] mt-[68px] flex items-center justify-center text-[rgba(255,255,255,0.6)]">…</div>
    );
  }

  const handleSaveName = async (e: FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSaving(true);
    setSaveMsg('');
    try {
      await updateProfile(auth.currentUser!, { displayName: displayName.trim() });
      setSaveMsg(lang === 'ar' ? '✓ تم حفظ الاسم بنجاح' : '✓ Name saved successfully');
    } catch {
      setSaveMsg(lang === 'ar' ? 'حدث خطأ، حاول مجدداً' : 'An error occurred, please try again');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 3000);
    }
  };

  const handleChangePw = async (e: FormEvent) => {
    e.preventDefault();
    setPwMsg(''); setPwError('');
    if (newPw.length < 6) {
      setPwError(lang === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    setChangingPw(true);
    try {
      const credential = EmailAuthProvider.credential(user.email!, currentPw);
      await reauthenticateWithCredential(auth.currentUser!, credential);
      await updatePassword(auth.currentUser!, newPw);
      setPwMsg(lang === 'ar' ? '✓ تم تغيير كلمة المرور بنجاح' : '✓ Password changed successfully');
      setCurrentPw(''); setNewPw('');
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setPwError(lang === 'ar' ? 'كلمة المرور الحالية غير صحيحة' : 'Current password is incorrect');
      } else {
        setPwError(lang === 'ar' ? 'حدث خطأ، حاول مجدداً' : 'An error occurred, please try again');
      }
    } finally {
      setChangingPw(false);
    }
  };

  const initials = (user.displayName || user.email || '?').trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-[calc(100dvh-68px)] mt-[68px] px-4 py-10 bg-gradient-to-br from-[#1a0a2e] via-[#2a1444] to-[#1a0a2e]">
      <div className="max-w-xl mx-auto" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-4 mb-8 flex-wrap">
          <h1 className="text-white text-3xl font-black">
            {lang === 'ar' ? '👤 ملفي الشخصي' : '👤 My Profile'}
          </h1>
          <Link href="/" className="ms-auto bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.14)] text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-[rgba(255,255,255,0.12)]">
            {lang === 'ar' ? '← الرئيسية' : '← Home'}
          </Link>
        </div>

        {/* Avatar card */}
        <div className="bg-[rgba(30,14,56,0.75)] border border-[rgba(212,160,23,0.25)] rounded-2xl p-6 mb-5 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[hsl(var(--g500))] to-[hsl(var(--p400))] flex items-center justify-center text-[hsl(var(--p900))] font-black text-2xl shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-lg truncate">{user.displayName || (lang === 'ar' ? 'بدون اسم' : 'No name set')}</div>
            <div className="text-[rgba(255,255,255,0.45)] text-sm truncate" dir="ltr">{user.email}</div>
          </div>
        </div>

        {/* Update name */}
        <div className="bg-[rgba(30,14,56,0.75)] border border-[rgba(212,160,23,0.25)] rounded-2xl p-6 mb-5">
          <h2 className="text-white text-base font-bold mb-4">
            {lang === 'ar' ? 'تعديل الاسم' : 'Update Name'}
          </h2>
          <form onSubmit={handleSaveName} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={lang === 'ar' ? 'اسمك الكامل' : 'Your full name'}
              className="flex-1 bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.15)] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[hsl(var(--g500))]"
            />
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-br from-[hsl(var(--g500))] to-[hsl(var(--g400))] text-[hsl(var(--p900))] font-black py-3 px-5 rounded-xl text-sm hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
            >
              {saving ? '…' : (lang === 'ar' ? 'حفظ' : 'Save')}
            </button>
          </form>
          {saveMsg && <p className="text-[hsl(var(--g300))] text-sm mt-2 font-semibold">{saveMsg}</p>}
        </div>

        {/* Change password */}
        <div className="bg-[rgba(30,14,56,0.75)] border border-[rgba(212,160,23,0.25)] rounded-2xl p-6 mb-5">
          <h2 className="text-white text-base font-bold mb-4">
            {lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
          </h2>
          <form onSubmit={handleChangePw} className="space-y-3">
            <PasswordField
              iconSize={18}
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder={lang === 'ar' ? 'كلمة المرور الحالية' : 'Current password'}
              autoComplete="current-password"
              className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.15)] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[hsl(var(--g500))]"
            />
            <PasswordField
              iconSize={18}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder={lang === 'ar' ? 'كلمة المرور الجديدة (6 أحرف على الأقل)' : 'New password (min 6 characters)'}
              autoComplete="new-password"
              className="w-full bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.15)] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[hsl(var(--g500))]"
            />
            {pwError && <p className="text-[#ff8888] text-sm">{pwError}</p>}
            {pwMsg && <p className="text-[hsl(var(--g300))] text-sm font-semibold">{pwMsg}</p>}
            <button
              type="submit"
              disabled={changingPw || !currentPw || !newPw}
              className="w-full bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.15)] text-white font-bold py-3 rounded-xl text-sm hover:bg-[rgba(255,255,255,0.12)] disabled:opacity-40"
            >
              {changingPw ? '…' : (lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password')}
            </button>
          </form>
        </div>

        {/* Quick links */}
        <div className="bg-[rgba(30,14,56,0.75)] border border-[rgba(212,160,23,0.25)] rounded-2xl p-6 mb-5">
          <h2 className="text-white text-base font-bold mb-4">
            {lang === 'ar' ? 'روابط سريعة' : 'Quick Links'}
          </h2>
          <div className="flex flex-col gap-2">
            <Link href="/my-courses" className="flex items-center gap-3 text-[rgba(255,255,255,0.8)] text-sm font-semibold py-3 px-4 rounded-xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.09)] transition-colors">
              <span>📚</span> {lang === 'ar' ? 'دوراتي ومشترياتي' : 'My Courses & Purchases'}
            </Link>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={() => { logout(); setLocation('/'); }}
          className="w-full bg-[rgba(255,80,80,0.1)] border border-[rgba(255,80,80,0.25)] text-[#ffb0b0] font-bold py-3 rounded-xl hover:bg-[rgba(255,80,80,0.18)] transition-colors"
        >
          {lang === 'ar' ? '⟵ تسجيل الخروج' : '⟵ Sign Out'}
        </button>
      </div>
    </div>
  );
}
