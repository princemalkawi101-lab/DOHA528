import { collection, doc, getDocs, orderBy, query, runTransaction, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

export type Article = {
  id: string;
  categoryAr: string;
  categoryEn: string;
  dateAr: string;
  dateEn: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  contentAr: string;
  contentEn: string;
  order: number;
  active: boolean;
  imageUrl?: string;
  isDefault?: boolean;
  deleted?: boolean;
};

const COL = 'articles';

export const DEFAULT_ARTICLES: Article[] = [
  {
    id: 'default-1',
    isDefault: true,
    categoryAr: 'شفاء بالطاقة',
    categoryEn: 'Energy Healing',
    dateAr: 'مارس ٢٠٢٦',
    dateEn: 'March 2026',
    titleAr: 'الشاكرات السبع: دليلك العملي للتوازن اليومي',
    titleEn: 'The Seven Chakras: Your Practical Guide to Daily Balance',
    descriptionAr: 'الشاكرات ليست مجرد مفهوم روحي — إنها مراكز طاقة حقيقية في جسمك يمكنك تعلّم قراءتها والتعامل معها.',
    descriptionEn: 'Chakras are not just a spiritual concept — they are real energy centers in your body that you can learn to read and work with.',
    contentAr: 'الشاكرات ليست مجرد مفهوم روحي — إنها مراكز طاقة حقيقية في جسمك يمكنك تعلّم قراءتها والتعامل معها. كل شاكرا مسؤولة عن جوانب معينة من صحتك الجسدية والنفسية، وتوازنها يعني تدفق الطاقة بحرية في حياتك.',
    contentEn: 'Chakras are not just a spiritual concept — they are real energy centers in your body that you can learn to read and work with. Each chakra is responsible for certain aspects of your physical and psychological health, and balancing them means energy flows freely in your life.',
    order: 0,
    active: true,
  },
  {
    id: 'default-2',
    isDefault: true,
    categoryAr: 'علم الجهاز العصبي',
    categoryEn: 'Neuroscience',
    dateAr: 'فبراير ٢٠٢٦',
    dateEn: 'February 2026',
    titleAr: 'لماذا التنفس هو أقوى أداة شفاء تملكها',
    titleEn: 'Why Breathing Is the Most Powerful Healing Tool You Own',
    descriptionAr: 'العلم يُثبت ما عرفه الشرق منذ آلاف السنين: أنماط التنفس تؤثر مباشرةً على جهازك العصبي وحالتك الطاقية.',
    descriptionEn: 'Science confirms what the East has known for thousands of years: breathing patterns directly affect your nervous system and energetic state.',
    contentAr: 'العلم يُثبت ما عرفه الشرق منذ آلاف السنين: أنماط التنفس تؤثر مباشرةً على جهازك العصبي وحالتك الطاقية. التنفس العميق والواعي يمكن أن يوقف استجابة التوتر في الجسم ويبدأ عملية الشفاء الذاتي.',
    contentEn: 'Science confirms what the East has known for thousands of years: breathing patterns directly affect your nervous system and energetic state. Deep, conscious breathing can halt the stress response in the body and initiate self-healing.',
    order: 1,
    active: true,
  },
  {
    id: 'default-3',
    isDefault: true,
    categoryAr: 'الصحة العاطفية',
    categoryEn: 'Emotional Health',
    dateAr: 'يناير ٢٠٢٦',
    dateEn: 'January 2026',
    titleAr: 'الفرق بين الحزن الصحي والحمل الطاقي الثقل',
    titleEn: 'The Difference Between Healthy Grief and Heavy Energetic Burden',
    descriptionAr: 'ليس كل ألم مرض، وليس كل حزن يحتاج إلى إزالة. أحياناً الحزن رسالة من الجسم والروح — المهم أن تعرف كيف تستمع إليه.',
    descriptionEn: 'Not every pain is an illness, and not every grief needs to be removed. Sometimes grief is a message from the body and soul — what matters is learning to listen to it.',
    contentAr: 'ليس كل ألم مرض، وليس كل حزن يحتاج إلى إزالة. أحياناً الحزن رسالة من الجسم والروح — المهم أن تعرف كيف تستمع إليه. الحزن الصحي يتحرك ويتغير، بينما الحمل الطاقي يظل ثابتاً ويستنزف طاقتك اليومية.',
    contentEn: 'Not every pain is an illness, and not every grief needs to be removed. Sometimes grief is a message from the body and soul — what matters is learning to listen to it. Healthy grief moves and changes, while an energetic burden remains stagnant and drains your daily energy.',
    order: 2,
    active: true,
  },
];

export async function fetchArticles(): Promise<Article[]> {
  try {
    const snap = await getDocs(query(collection(db, COL), orderBy('order', 'asc')));
    const dbArticles = snap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Article, 'id'>),
    }));

    const byId = new Map(dbArticles.map((a) => [a.id, a]));

    // Merge defaults
    const mergedDefaults = DEFAULT_ARTICLES.map((def) => {
      const existing = byId.get(def.id);
      if (existing) {
        return { ...def, ...existing };
      }
      return def;
    });

    const custom = dbArticles.filter((a) => !a.isDefault && !DEFAULT_ARTICLES.some(d => d.id === a.id));

    return [...mergedDefaults, ...custom]
      .filter((a) => !a.deleted)
      .sort((a, b) => a.order - b.order);
  } catch {
    return DEFAULT_ARTICLES.slice();
  }
}

export async function saveArticle(article: Article): Promise<void> {
  const { id, ...rest } = article;
  const ref = doc(db, COL, id);
  await runTransaction(db, async (t) => {
    t.set(ref, {
      ...rest,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
}

export async function saveArticleOrder(articles: Article[]): Promise<void> {
  const batch = writeBatch(db);
  articles.forEach((a, index) => {
    batch.set(doc(db, COL, a.id), {
      order: index,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  });
  await batch.commit();
}

export async function deleteArticle(article: Article): Promise<void> {
  const ref = doc(db, COL, article.id);
  if (article.isDefault) {
    await runTransaction(db, async (t) => {
      t.set(ref, { deleted: true, updatedAt: serverTimestamp() }, { merge: true });
    });
  } else {
    await runTransaction(db, async (t) => {
      t.delete(ref);
    });
  }
}

export function newArticleTemplate(order: number): Article {
  return {
    id: `article-${Date.now()}`,
    categoryAr: '',
    categoryEn: '',
    dateAr: '',
    dateEn: '',
    titleAr: '',
    titleEn: '',
    descriptionAr: '',
    descriptionEn: '',
    contentAr: '',
    contentEn: '',
    order,
    active: true,
  };
}
