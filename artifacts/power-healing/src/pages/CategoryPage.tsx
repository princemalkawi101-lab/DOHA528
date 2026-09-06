import { useEffect, useMemo, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { ProductCard } from '@/components/sections/Products';
import {
  ContentCategory,
  fetchContentCategories,
  mergeBuiltInContentCategories,
} from '@/lib/contentCategories';
import { fetchItems, Item } from '@/lib/items';
import { useApp } from '@/lib/store';

export default function CategoryPage() {
  const { lang } = useApp();
  const [, params] = useRoute('/category/:categoryId');
  const categoryId = params?.categoryId ? decodeURIComponent(params.categoryId) : '';
  const [items, setItems] = useState<Item[] | null>(null);
  const [categories, setCategories] = useState<ContentCategory[] | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    Promise.all([fetchItems(), fetchContentCategories()])
      .then(([nextItems, nextCategories]) => {
        setItems(nextItems);
        setCategories(mergeBuiltInContentCategories(nextCategories));
      })
      .catch(() => {
        setItems([]);
        setCategories([]);
      });
  }, [categoryId]);

  const category = categories?.find((entry) => entry.id === categoryId);
  const categoryItems = useMemo(() => {
    if (!items || !category) return [];
    return items
      .filter((item) => item.active !== false)
      .filter((item) => category.builtInKind
        ? !item.categoryId && item.kind === category.builtInKind
        : item.categoryId === category.id);
  }, [category, items]);

  const loading = items === null || categories === null;
  const title = category ? (lang === 'ar' ? category.titleAr : category.titleEn || category.titleAr) : '';
  const description = category ? (lang === 'ar' ? category.descriptionAr : category.descriptionEn) : '';

  return (
    <div className="min-h-[calc(100dvh-68px)] mt-[68px] bg-[#f4fbf7] px-4 py-10 sm:py-14">
      <div className="max-w-6xl mx-auto">
        <Link
          href="/#products"
          data-testid="link-back-categories"
          className="inline-flex items-center gap-2 text-[#176f50] font-bold text-sm mb-7 hover:opacity-75"
        >
          <span aria-hidden="true">{lang === 'ar' ? '→' : '←'}</span>
          {lang === 'ar' ? 'العودة إلى جميع الأقسام' : 'Back to all categories'}
        </Link>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-[340px] rounded-[18px] bg-[#dff5e9] animate-pulse" />
            ))}
          </div>
        ) : !category || category.active === false ? (
          <div className="text-center py-24">
            <h1 className="text-2xl font-black text-[hsl(var(--p900))] mb-4">
              {lang === 'ar' ? 'القسم غير موجود' : 'Category not found'}
            </h1>
            <Link href="/#products" className="text-[#176f50] font-bold underline">
              {lang === 'ar' ? 'عرض جميع الأقسام' : 'View all categories'}
            </Link>
          </div>
        ) : (
          <>
            <header className="mb-9">
              <span className="inline-block bg-[#d7f1e3] text-[#176f50] px-4 py-1.5 rounded-full text-sm font-bold mb-3">
                {lang === 'ar' ? 'الكورسات والمواد' : 'Courses & Materials'}
              </span>
              <h1 data-testid="text-category-title" className="text-3xl sm:text-4xl font-black text-[hsl(var(--p900))] mb-3">
                {title}
              </h1>
              {description && <p className="text-[#477062] max-w-2xl leading-7">{description}</p>}
            </header>

            {categoryItems.length === 0 ? (
              <div className="rounded-2xl border border-[#b8dfca] bg-[#dff5e9] text-center py-16 px-5 text-[#477062]">
                {lang === 'ar' ? 'لا توجد كورسات أو مواد في هذا القسم حاليًا.' : 'No courses or materials are available in this category yet.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryItems.map((item) => (
                  <ProductCard key={item.id} it={item} category={category} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}