import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useApp } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { fetchUserPurchases, Purchase } from '@/lib/purchases';

const KIND_ICON: Record<string, string> = {
  course: '📚',
  workshop: '🎓',
  recorded: '🎬',
  'individual-online': '🔮',
};

const KIND_LABEL_AR: Record<string, string> = {
  course: 'كورس',
  workshop: 'ورشة',
  recorded: 'جلسة مسجلة',
  'individual-online': 'جلسة فردية أونلاين',
};

export default function MyCourses() {
  const { lang, formatPrice } = useApp();
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      sessionStorage.setItem('dh_redirect_after_login', '/my-courses');
      setLocation('/login');
    }
  }, [loading, user, setLocation]);

  useEffect(() => {
    if (!user) return;
    fetchUserPurchases(user.uid)
      .then(setPurchases)
      .catch(() => setPurchases([]))
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-[calc(100dvh-68px)] mt-[68px] flex items-center justify-center text-[rgba(255,255,255,0.6)]">…</div>
    );
  }

  const formatDate = (ts: any) => {
    if (!ts) return '—';
    try {
      const d = ts.toDate ? ts.toDate() : new Date(ts);
      return d.toLocaleDateString(lang === 'ar' ? 'ar-JO' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return '—';
    }
  };

  return (
    <div className="min-h-[calc(100dvh-68px)] mt-[68px] px-4 py-10 bg-gradient-to-br from-[#1a0a2e] via-[#2a1444] to-[#1a0a2e]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-white text-3xl font-black" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              {lang === 'ar' ? '📚 دوراتي' : '📚 My Courses'}
            </h1>
            <p className="text-[rgba(255,255,255,0.55)] text-sm mt-1" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              {lang === 'ar' ? 'كل ما اشتريتيه في مكان واحد' : 'All your purchases in one place'}
            </p>
          </div>
          <Link href="/" className="ms-auto bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.14)] text-white text-sm font-semibold py-2 px-4 rounded-lg hover:bg-[rgba(255,255,255,0.12)]">
            {lang === 'ar' ? '← الرئيسية' : '← Home'}
          </Link>
        </div>

        {fetching ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[rgba(30,14,56,0.6)] border border-[rgba(212,160,23,0.12)] rounded-2xl p-6 h-[160px] animate-pulse" />
            ))}
          </div>
        ) : purchases.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-5">📭</div>
            <h2 className="text-white text-xl font-bold mb-3">
              {lang === 'ar' ? 'لم تشتري أي محتوى بعد' : 'No purchases yet'}
            </h2>
            <p className="text-[rgba(255,255,255,0.5)] mb-6 text-sm">
              {lang === 'ar' ? 'استكشف كورساتنا وورشاتنا الآن!' : 'Explore our courses and workshops now!'}
            </p>
            <Link href="/#products" className="inline-block bg-gradient-to-br from-[hsl(var(--g500))] to-[hsl(var(--g400))] text-[hsl(var(--p900))] font-black py-3 px-7 rounded-xl">
              {lang === 'ar' ? 'استكشف المحتوى' : 'Browse Content'}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {purchases.map((p) => (
              <div
                key={p.id}
                className="bg-[rgba(30,14,56,0.75)] border border-[rgba(212,160,23,0.2)] rounded-2xl p-6 hover:border-[rgba(212,160,23,0.4)] transition-colors"
                dir={lang === 'ar' ? 'rtl' : 'ltr'}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--p600))] to-[hsl(var(--p400))] flex items-center justify-center text-2xl shrink-0">
                    {KIND_ICON[p.itemKind] || '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold leading-snug line-clamp-2">
                      {lang === 'ar' ? p.itemTitleAr : p.itemTitleEn}
                    </div>
                    <div className="text-[rgba(255,255,255,0.45)] text-xs mt-1">
                      {lang === 'ar' ? KIND_LABEL_AR[p.itemKind] || p.itemKind : p.itemKind}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-[hsl(var(--g300))] font-black text-sm">
                    {formatPrice(p.paidJod)}
                  </div>
                  <div className="text-[rgba(255,255,255,0.35)] text-xs">
                    {formatDate(p.createdAt)}
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[rgba(255,255,255,0.07)]">
                  <span
                    className="inline-flex items-center gap-1.5 text-[0.7rem] font-bold py-1 px-2.5 rounded-full"
                    style={{
                      backgroundColor: p.status === 'pending' ? 'rgba(212,160,23,0.15)' : 'rgba(56,200,120,0.15)',
                      color: p.status === 'pending' ? '#ffd87a' : '#7cf2a3',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {lang === 'ar'
                      ? (p.status === 'pending' ? 'بانتظار التأكيد' : 'مؤكد')
                      : (p.status === 'pending' ? 'Pending Confirmation' : 'Confirmed')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
