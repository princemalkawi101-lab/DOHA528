import { useEffect, useState } from 'react';
import { useApp } from '@/lib/store';
import { Article, fetchArticles } from '@/lib/articles';

export function Blog() {
  const { t, lang } = useApp();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  useEffect(() => {
    fetchArticles().then((data) => {
      setArticles(data.filter(a => a.active));
      setLoading(false);
    });
  }, []);

  return (
    <section id="blog" className="section bg-[hsl(var(--card))]">
      <div className="section-inner">
        <div className="section-header">
          <span className="section-label">{t('blog.label')}</span>
          <h2 className="section-title">{t('blog.title')}</h2>
        </div>

        {loading ? (
          <div className="text-center py-10 opacity-50">...</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-10 opacity-50">{lang === 'ar' ? 'لا يوجد مقالات حالياً.' : 'No articles available.'}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {articles.map((post) => (
              <div
                key={post.id}
                className="bg-[#e6f7f4] rounded-3xl overflow-hidden border border-[#b2e5d9] transition-all hover:-translate-y-1.5 hover:shadow-[0_15px_40px_rgba(30,170,140,0.12)] flex flex-col"
              >
                {post.imageUrl && (
                  <div className="w-full h-56 relative shrink-0">
                    <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex justify-between items-center mb-4">
                    <span className="bg-[#ccede5] text-[#13755f] text-[0.78rem] font-semibold py-1 px-3 rounded-full">
                      {lang === 'ar' ? post.categoryAr : post.categoryEn}
                    </span>
                    <span className="text-[#3c9b84] text-[0.78rem] font-medium flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                      {lang === 'ar' ? post.dateAr : post.dateEn}
                    </span>
                  </div>
                  <h3 className="text-[1.1rem] font-black text-[#0d5947] mb-3 leading-[1.5]">
                    {lang === 'ar' ? post.titleAr : post.titleEn}
                  </h3>
                  <p className="text-[#2b8670] text-[0.95rem] leading-[1.7] mb-6 flex-1 line-clamp-3">
                    {lang === 'ar' ? post.descriptionAr : post.descriptionEn}
                  </p>
                  <button
                    onClick={() => setActiveArticle(post)}
                    className="w-full bg-[#0d5947] text-white py-3 rounded-xl font-bold hover:bg-[#0a4537] transition-all active:scale-[0.98] text-[0.95rem]"
                  >
                    {t('blog.readMore')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Full Article Dialog */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            className="absolute inset-0 bg-[rgba(10,35,30,0.4)] backdrop-blur-sm"
            onClick={() => setActiveArticle(null)}
          ></div>
          <div className="relative bg-[#f4fcf9] w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-5 sm:p-6 border-b border-[#d8f2ec] bg-white">
              <span className="bg-[#ccede5] text-[#13755f] text-[0.8rem] font-bold py-1 px-3 rounded-full">
                {lang === 'ar' ? activeArticle.categoryAr : activeArticle.categoryEn}
              </span>
              <button
                onClick={() => setActiveArticle(null)}
                className="w-8 h-8 rounded-full bg-[#edf9f6] text-[#2b8670] flex items-center justify-center hover:bg-[#d8f2ec] hover:text-[#10705a] transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6 sm:p-8 overflow-y-auto">
              {activeArticle.imageUrl && (
                <div className="w-full h-64 sm:h-80 rounded-2xl overflow-hidden mb-6">
                  <img src={activeArticle.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="mb-6">
                <span className="text-[#3c9b84] text-sm font-medium flex items-center gap-1.5 mb-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  {lang === 'ar' ? activeArticle.dateAr : activeArticle.dateEn}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#0d5947] leading-[1.4]">
                  {lang === 'ar' ? activeArticle.titleAr : activeArticle.titleEn}
                </h2>
              </div>
              <div className="text-[#206655] text-[1.05rem] leading-[1.9] whitespace-pre-wrap">
                {lang === 'ar' ? activeArticle.contentAr : activeArticle.contentEn}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
