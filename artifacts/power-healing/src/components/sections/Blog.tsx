import { useApp } from '@/lib/store';

export function Blog() {
  const { t } = useApp();

  const posts = [
    { key: '1' },
    { key: '2' },
    { key: '3' },
  ];

  return (
    <section id="blog" className="section bg-[hsl(var(--card))]">
      <div className="section-inner">
        <div className="section-header">
          <span className="section-label">{t('blog.label')}</span>
          <h2 className="section-title">{t('blog.title')}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {posts.map(post => (
            <div key={post.key} className="bg-white rounded-2xl p-7 border border-[rgba(90,45,145,0.08)] transition-all hover:-translate-y-1.5 hover:shadow-[0_15px_40px_rgba(90,45,145,0.12)] flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="bg-[hsl(var(--muted))] text-[hsl(var(--p600))] text-[0.78rem] font-semibold py-1 px-3 rounded-full">
                  {t(`blog.cat${post.key}`)}
                </span>
                <span className="text-[hsl(var(--muted-foreground))] text-[0.78rem]">
                  {t(`blog.date${post.key}`)}
                </span>
              </div>
              <h3 className="text-[1.05rem] font-bold text-[hsl(var(--p900))] mb-3 leading-[1.5]">
                {t(`blog.title${post.key}`)}
              </h3>
              <p className="text-[hsl(var(--muted-foreground))] text-[0.9rem] leading-[1.7] mb-5 flex-1">
                {t(`blog.desc${post.key}`)}
              </p>
              <a href="#" className="text-[hsl(var(--p500))] font-semibold text-[0.9rem]">
                {t('blog.readMore')}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
