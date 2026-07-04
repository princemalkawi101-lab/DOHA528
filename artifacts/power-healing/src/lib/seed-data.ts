import { Item } from './items';

// Source: attached_assets/الدورات_والكورسات_1776448651483.docx
// Prices in the document are in USD; converted to JOD at 1 JOD = 1.41 USD (Jordanian Dinar peg).
// Items #38 and #39 are explicitly priced in JOD (in-person sessions in Jordan).

export const SEED_ITEMS: Item[] = [
  // ============== الكورسات المدفوعة (8) ==============
  {
    id: 'c-faatinat-al-ard',
    kind: 'course',
    icon: '🩷',
    titleAr: 'كورس معجزة الجمال (فاتنة الأرض)',
    titleEn: 'The Beauty Miracle Course (Earth Enchantress)',
    descAr: `بقيادة ضحى ملكاوي 💎
كورس يشتغل على مستوى الجينات لتغيير المخطط الجيني الوراثي بالكامل: المعتقدات، الموروثات، والبرمجيات المخزّنة في خريطتك الجينية.

🦋 محاور الكورس:
💥 جلسة تاج الأرض للشعر — اخفاء الشيب، إصلاح جينات الشعر، إيقاف التساقط، وفتح شاكرا التاج
💥 جلسة عيون نجوم النور — تحرير صدمات الأجيال في العيون، تكثيف الرموش، شد الجفون، صفاء العيون كحور العين
💥 جلسة الحور العين للبشرة — إزالة التصبغات والندبات والحبوب، شد البشرة، تحفيز الكولاجين والخلايا الجذعية
💥 جلسة معجزة الجسد — تفعيل شيفرة المعجزة للجسد على كل المستويات
💥 جلسة الهيبة الملكة — تحرير كارمات الأجداد، تفعيل شيفرة الهيبة والهالة الملكة
💥 سيبليمنال الفاتنة — يحوي تفعيل لكل طاقات الكورس

ينقلك إلى عالم الجمال الفاتن والجاذبية والحب والعلاقات التي تليق بك كملكة بشيفرة الحور العين.
تنبيه: لست مسؤولة عن جمالك الطاغي بعد الكورس 😅`,
    descEn: `Led by Doha Mlkawi.
A genetic-level course rewriting the inherited blueprint of beauty, hormones, womb energy and feminine power.

Modules: Crown of the Earth (hair), Stars of Light Eyes, Houri-skin, Body Miracle, Royal Aura, and Enchantress Subliminal.
Works on all levels: beauty, body, love, relationships, money, chakras, masculine/feminine balance, hormones, and womb.`,
    originalPriceJod: 157,
    discountPriceJod: 135,
    telegramLink: 'https://t.me/+VupuZxSfAOAyMzA0',
    order: 1,
  },
  {
    id: 'c-stefa-kingdom',
    kind: 'course',
    icon: '🧜‍♀️',
    titleAr: 'كورس مملكة الملكة ستيفا',
    titleEn: 'Queen Stefa Kingdom Course',
    descAr: `مملكة كاملة أنثوية لكل أنثى تريد أن تكون "ليدي" بكل معنى الكلمة.
لمن تبحث عن: علاقات عظيمة، رجل عظيم، مال، حب، هدايا، طاقة ملكة نادرة، تفعيل البصيرة والقدرات الحدسية.

🧬 محاور الكورس:
🧜‍♀️ التحصين اليومي • سر الماء • الملكة ستيفا
🧜‍♀️ شحن الماء وماء الورد والميكاب والعطور والملابس
🧜‍♀️ شحن الأكل والشرب • تحرير الطفيليات والسموم والبكتيريا
🧜‍♀️ مغطس للمهبل • مغطس العناصر الخمسة • بخاخ للمنزل والأثاث
🧜‍♀️ جلسة الزواج • إغواء الشريك للمتزوجات • كن أنت
🧜‍♀️ ثراء الملكة • طاقة الأفعى وأسرارها • رقصة الأفعى الذهبية
🧜‍♀️ خزان المال الوفير من غير حساب • التحرر والتشافي
🧜‍♀️ أسرار روحية عن الرحم • شفاء الرحم • تحرير ذاكرة الرحم
🧜‍♀️ نغمة الرحم • دم القمر الوردي للدورة الشهرية
🧜‍♀️ تفعيل الليدي ومشية الليدي • نغمة الوزن المثالي
🧜‍♀️ حب الذات وتقدير الذات • توازن الذكورة والأنوثة
🧜‍♀️ يأتيها رزقها • جلسة الشعر`,
    descEn: `A complete feminine kingdom for women who want to be a true Lady.
30+ sessions: daily protection, water rituals, Queen Stefa session, womb healing, snake energy, feminine balance, marriage and spouse seduction, money flows, and lady-walk activation.`,
    originalPriceJod: 142,
    discountPriceJod: 128,
    telegramLink: 'https://t.me/+bJ8HqbnDvRFmMzI8',
    order: 2,
  },
  {
    id: 'c-you-are-miracle',
    kind: 'course',
    icon: '🦋',
    titleAr: 'مجتمع أنت المعجزة',
    titleEn: 'You Are The Miracle Community',
    descAr: `مع ضحى ملكاوي 👸
عبارة عن 7 مكالمات مباشرة (ويتم تسجيلها) + هدية لكل مشترك: لووب للمعجزات.

💥 ماذا في هذه المكالمات؟
🍀 تيسير وتنظيفات وتوضيحات وسحب طاقي
🍀 فتح المجال الكمي واستعادة الجزيئات للمال والحب والعلاقات والذهب والكنوز
🍀 تفعيل جزيئات المعجزات في الخلايا وبناء مستقبلات حسية جديدة بطاقة المعجزات
🍀 استعادة جيناتك الأصلية اللي من الطبيعي تعيش وتستقبل المعجزات
🍀 إعادة تكوين DNA بشيفرة المعجزات

اللووب: تكرار السؤال أو المانترا لتفكيك الطاقة العالقة وفتح مساحات جديدة. يُسمع وقت النوم أو التأمل.`,
    descEn: `With Doha Mlkawi. 7 live calls (recorded) + a Miracles Loop gift for every subscriber.
Energetic clearings, quantum field expansion, miracle-particle activation, DNA recoding to a miracle blueprint.`,
    originalPriceJod: 106,
    discountPriceJod: 79,
    telegramLink: 'https://t.me/+BGlL48_D03dkZjM0',
    order: 3,
  },
  {
    id: 'c-money-reiki',
    kind: 'course',
    icon: '💲',
    titleAr: 'كورس ريكي المال 💲',
    titleEn: 'Money Reiki Course',
    descAr: `فرصة استثنائية لتغيير واقعك المالي من الجذور.

🔺️ المحاور:
1. الممارس: كارما الثراء، رمز $ للتشافي والشحن، تناغم سلطة المال
2. الماستر: تناغم ورموز أعمق، صندوق ريكي المال، رفع الاستحقاق المالي، إزالة الكارمات السلبية
3. جراند ماستر: تناغم الجراند ماستر، تقنيات متقدمة للوفرة، مباركة المال والممتلكات

💠 الهدايا: ريكي نهر المال، سحب طاقي، تجلي الأهداف، شيك الوفرة، صورة مشحونة، ريكي الصورة، اكسس بارز، تقنية التواصل مع المال واسترجاع أموالك بأضعاف.

في النهاية شهادة جراند ماستر بنسب طاقي.`,
    descEn: `Three-level course (Practitioner, Master, Grand Master) with money attunements, the $ symbol, money law techniques, and a Grand Master certificate at the end.`,
    originalPriceJod: 85,
    discountPriceJod: 69,
    telegramLink: 'https://t.me/+8U2a6YnOTJs2Mjcy',
    order: 4,
  },
  {
    id: 'c-wow-world',
    kind: 'course',
    icon: '🎉',
    titleAr: 'عالم الوااو WOW',
    titleEn: 'The WOW World',
    descAr: `عالم مليء بالخيرات والبركات والمفاجآت والسحر والتجلي العظيم.
هل أنت مستعد لاستقبال السحر والمفاجآت في حياتك؟ هل أنت مستعد للقاء نسختك العظيمة؟

عالم الوااو = 14 لقاء + حفلة الواو الختامية.
لقاءات تشمل تمارين وجلسات ووعي بمختلف المواضيع: المال، العلاقات، الجسد، الروح، العقود والعهود، الأسلاف، الأمراض، التشافي، الطفل الداخلي، طاقة الذكورة والأنوثة، الشاكرات، تحرير الظلام، والكثير من المواضيع المهمة.`,
    descEn: `A world of blessings, surprises and great manifestation. 14 meetings + a closing WOW celebration. Sessions cover money, relationships, body, soul, contracts, ancestors, healing, inner child, masculine/feminine energy, chakras, and shadow release.`,
    originalPriceJod: 142,
    discountPriceJod: 79,
    telegramLink: 'https://t.me/+tgZhfzRRiusxZmI0',
    order: 5,
  },
  {
    id: 'c-universe-in-hands',
    kind: 'course',
    icon: '⭐',
    titleAr: 'كورس الكون بين يديك (للارتقاء الروحي)',
    titleEn: 'The Universe In Your Hands (Spiritual Ascension)',
    descAr: `محاور الكورس:
⭐ أسرار الارتقاء الروحي • أسرار الذات العليا
⭐ تحرير الصدمات العالقة • التنفس البطني
⭐ تحرير الجسد • تسامح وغفران الجسد والروح
⭐ تشافي DNA • تنظيف الهالة والجسد والشاكرات
⭐ إزالة المعيقات المالية • تحرير جزيئات الروح المفقودة
⭐ ترميم الروح المتصدعة • إطلاق نوايا جماعية
⭐ توضيحات اكسس بارز • تنزيلات مشاعر ثيتا
⭐ تفعيل الذات العليا • صناعة الواقع
⭐ جلسة الارتقاء الروحي بالدوائر والأبعاد السبعة`,
    descEn: `A complete spiritual ascension course: trauma release, DNA healing, aura cleansing, removing money blocks, retrieving lost soul fragments, Higher Self activation, reality creation, and a 7-dimensions ascension session.`,
    originalPriceJod: 106,
    discountPriceJod: 71,
    telegramLink: 'https://t.me/+B2jniZ1QdDw0OGY8',
    order: 6,
  },
  {
    id: 'c-spiritual-journey',
    kind: 'course',
    icon: '🕊️',
    titleAr: 'السفر الروحي للاتصال بصوت الحق لتفعيل مفاتيح التجلي',
    titleEn: 'The Spiritual Journey — Manifestation Keys',
    descAr: `10 لقاءات مباشرة على قناة خاصة:
1️⃣ الغفران 2️⃣ شكل حياتي
3️⃣ التواصل مع الأجداد والأسلاف وتدمير كارماتهم
4️⃣ الاتصال بسيدنا محمد ﷺ
5️⃣ الاتصال بالملاك جبريل عليه السلام
6️⃣ الاتصال بقدرنا الحقيقي
7️⃣ الاتصال بالحضرة الإلهية

🕊️ في كل يوم سفر روحي لمكان معين واتصال بوعي معين لتطهير الروح على كل المستويات.
بالإضافة لسحب طاقي للمال كل يوم لمدة 10 أيام بترددات عالية جدا.`,
    descEn: `10 live sessions: forgiveness, life-shape vision, ancestral connection, sacred connections (Prophet Muhammad ﷺ, Angel Gabriel), true destiny, and the Divine Presence — plus daily energetic money attraction.`,
    originalPriceJod: 142,
    discountPriceJod: 106,
    telegramLink: 'https://t.me/+gGAoH9_zl6IwM2Nk',
    order: 7,
  },
  {
    id: 'c-golden-money',
    kind: 'course',
    icon: '💰',
    titleAr: 'كورس المال الذهبي',
    titleEn: 'The Golden Money Course',
    descAr: `بتقنية ريكي المال وتقنيات أخرى.
برنامج علاجي يحتوي على جلسات طاقية تنظف وتطهر حقلك الطاقي من المعتقدات والكارمات السلبية المتعلقة بالمال والوفرة، وتعمل على تحسين الوضع المالي.

البرنامج مكون من 13 جلسة علاجية طاقية + هدية لكل المشتركين: جلسة تطهير وموازنة الشاكرات.

ملاحظة: كل الجلسات مشحونة ومدعومة بزيت Cash Money.`,
    descEn: `13 energetic sessions using Money Reiki and other techniques to cleanse blocks and money karma + a balancing chakras gift session. All sessions charged with Cash Money oil.`,
    originalPriceJod: 71,
    discountPriceJod: 43,
    telegramLink: 'https://t.me/+Vkuo0LW28qRhOTBk',
    order: 8,
  },

  // ============== الورشات المدفوعة (11) ==============
  {
    id: 'w-night-of-love',
    kind: 'workshop',
    icon: '❤️',
    titleAr: 'ليلة حب ❤️',
    titleEn: 'Night of Love',
    descAr: `كيف تعيش الرخاء من خلال الحب؟
ليلة نلتقي فيها مع خالق الوجود ليعلمنا مفهوم الحب الحقيقي بمفهومه الإلهي.

🦋 تذكر الذاكرة الأصلية لطاقتي الذكورة والأنوثة وموازنتها
🦋 نسف المفاهيم المغلوطة عن الحب والخالق والرجل والمرأة والزواج
🦋 تفكيك برمجيات الزواج والرجل والأنثى
🦋 خلطة خيميائية بين العناصر الكنة لتدفق الحب
🦋 تفعيل شيفرة الحب المقدسة
🦋 تحرير علاقات الماضي وتحرير كينونات النزاعات
🦋 تحرير صدمات العلاقات`,
    descEn: `A divine love night: rebalancing masculine/feminine, breaking love-marriage-relationship programs, activating the sacred love code, releasing past relationship traumas.`,
    originalPriceJod: 71,
    discountPriceJod: 50,
    telegramLink: 'https://t.me/+0CFif1S_XmphYzNk',
    order: 9,
  },
  {
    id: 'w-money-and-i',
    kind: 'workshop',
    icon: '✨',
    titleAr: 'مكالمة: أنا والمال.. نخلق معاً',
    titleEn: 'Me & Money — We Create Together',
    descAr: `رحلة مكثفة لمدة ساعتين لفك شفرة الوفرة في عالمك مع ضحى ملكاوي.

💸 ماذا سيحدث؟
• اقتلاع الجذور: تحرير المعتقدات الموروثة عن الفقر وكارما الحرمان
• استقبال كن عابر للحدود من كل بقاع الأرض والعصور
• لغة الحوار السرّية: كيف تطلب المال وتتحاور معه ككيان حيّ
• التشافي المالي والتخلص من ذنب الثراء
• لقاء مع نسختك الثرية ذات الوعي المالي الفطري
• أدوات سحرية تجعلك أنت طاقة المال

كن المغناطيس الذي يجذب الأموال بدلاً من الركض خلفها.`,
    descEn: `2-hour intensive to crack the abundance code: uproot inherited beliefs, receive money cosmically, dialogue with money as a living entity, financial healing, meet your wealthy higher self.`,
    originalPriceJod: 71,
    discountPriceJod: 53,
    telegramLink: 'https://t.me/+rrXHx-OY4P9iMjU0',
    order: 10,
  },
  {
    id: 'w-money-flow-keys',
    kind: 'workshop',
    icon: '💰',
    titleAr: 'مكالمة مفاتيح تدفق المال',
    titleEn: 'Money Flow Keys Call',
    descAr: `💥 محتوى المكالمة:
- توضيحات وتنظيفات لمعتقداتك عن المال
- فك بلوكات المال والخمسة الكبار (مع شرحهم)
- تفكيك المشتتات المغروسة
- فتح مسارات جديدة للمال
- مصادر جديدة لاستقبال المال

🎉 ستخرج من المكالمة منفوض من كل معتقدات وبرامج المال المغروسة.`,
    descEn: `A focused call to clear money beliefs, dissolve money blocks (and "the Big Five"), open new money pathways and reception channels.`,
    originalPriceJod: 39,
    discountPriceJod: null,
    telegramLink: 'https://t.me/+SVltmOLzdBRkNGRk',
    order: 11,
  },
  {
    id: 'w-cosmic-receiving',
    kind: 'workshop',
    icon: '🦋',
    titleAr: 'ورشة وعي الاستقبال الكن',
    titleEn: 'Cosmic Receiving Consciousness Workshop',
    descAr: `عام 2026 هو عام الحصاد والوفرة. لكن لتجني الثمار هناك مفاتيح سرية، وأكبرها: الاستقبال.

محاور الورشة (كلها تطبيقات عملية):
🦋 وعي الاستقبال الكن • فورتكس الاستقبال
🦋 تفعيل الشبكة الذهبية الكنة • وعي الجسد مع الاستقبال
🦋 قنوات الاستقبال الكن • مداخل الاستقبال في الجسد
🦋 تغيير وعي الاستقبال • رفع استقبال الوعي الحقيقي
🦋 تفعيل خلية الاستقبال • تمرين فتح القلب والحلق
🦋 تفعيل معجزة الاستقبال • تنظيف الحقل من الأحكام
🦋 تفعيل الجهاز العصبي للاستقبال
🦋 رسم خريطة الكنز للاستقبال لعام 2026 من خلال الروح
🦋 عجلة القدر وطي الزمن

ورشة لمن يريد تدمير وعي المستحيل.`,
    descEn: `Practical workshop on cosmic receiving for 2026: receiving vortex, golden network activation, body-receiving channels, opening the heart and throat, treasure-map drawing through the soul, and bending time.`,
    originalPriceJod: 128,
    discountPriceJod: 79,
    telegramLink: 'https://t.me/+s2WA67GwBtM0Yzhk',
    order: 12,
  },
  {
    id: 'w-heart-release',
    kind: 'workshop',
    icon: '💚',
    titleAr: 'مكالمة تحرير القلب من حب موجِع (بوابة كيمياء القلب المقدس)',
    titleEn: 'Releasing the Heart from Painful Love',
    descAr: `🌀 تفتح المكالمة بوابة في شاكرا القلب والجذر:
🟢 تحرير روابط الحب المشوَّه من الحمض النووي
🟢 إعادة هندسة الحقل العاطفي نحو حب واعي
🟢 تفكيك الارتباطات الطاقية القديمة (حتى من حيوات سابقة)
🟢 تنظيف القلب من الذكريات والتعلق والخذلان
🟢 تفعيل الغدة الزعترية

🟢 محتوى المكالمة:
✨️ تأمل خيميائي فتح البوابة الطاقية للقلب
✨️ توضيحات وعي خيميائي للقلب
✨️ تأمل خيميائي تفكيك العلاقة القديمة
✨️ تنظيفات Access Consciousness
✨️ شيفرات كنة لفتح شاكرا القلب والغدة الزعترية
✨️ تأمل كوانتي لفتح بوابات القلب للتجلي الأعظم`,
    descEn: `A heart-chakra alchemy gateway: release distorted love bonds from DNA, untangle past-life karmic ties, reset the emotional field, activate the thymus gland and prepare the heart for divine love.`,
    originalPriceJod: 79,
    discountPriceJod: 62,
    telegramLink: 'https://t.me/+xuidZP78HLMxOGJk',
    order: 13,
  },
  {
    id: 'w-written-destiny',
    kind: 'workshop',
    icon: '✍️',
    titleAr: 'ورشة قدر مكتوب ✍️',
    titleEn: 'Written Destiny Workshop',
    descAr: `هل أنت مستعد لتعيش حياة مختلفة لم تعيشها من قبل؟

🔶️ ستتعلم أدوات وتكنيك لتجسيد واقعك بسهولة ويسر
🔶️ تكنيك يساعدك على تذكر مستقبلك
🔶️ تجسيد أهدافك بسهولة
🔶️ كيف تسحب أهدافك إلى واقعك الحالي
🔶️ جلسة رقصة مع الكون لتجلي الأهداف
🔶️ جلسة حديقة العجائب
🔶️ تفعيل قانون التسخير والاتصال المباشر معه`,
    descEn: `Tools and techniques to manifest your reality, remember your future, dance with the universe to materialize goals, and activate the law of facilitation.`,
    originalPriceJod: 57,
    discountPriceJod: 39,
    telegramLink: 'https://t.me/+H-zap707ZqRkOWZk',
    order: 14,
  },
  {
    id: 'w-body-harmony',
    kind: 'workshop',
    icon: '🌀',
    titleAr: 'ورشة هارموني الجسد (لمن هذا الجسد)',
    titleEn: 'Body Harmony Workshop',
    descAr: `محاور الورشة:
🔸 تحرير الكانات الظلامية العالقة في الجسد
🔸 تحرير الصدمات والتروما والعقود الكارمية والبصمات الطاقية المرتبطة بالجسد
🔸 تعديل DNA الوراثي للجسد
🔸 توضيحات وتنظيفات قوية للجسد
🔸 رقصة الجسد الروحية للتحرير والتشافي
🔸 هارموني الأهداف
🔸 تفعيل هارموني سحر الجسد لتناغم جسدك مع كل شيء

مدة الورشة 4 ساعات. الرقص الروحي يفعّل الطاقة الأنثوية المقدسة، يوقظ الكواندليني، ويفعّل قنوات الاستقبال في الجسد.`,
    descEn: `4-hour workshop: clearing dark entities, traumas and karmic contracts from the body, modifying inherited DNA, sacred dance for liberation, and activating body magic harmony with goals.`,
    originalPriceJod: 79,
    discountPriceJod: 53,
    telegramLink: 'https://t.me/+c9bLwtZz2jQ4MGJk',
    order: 15,
  },
  {
    id: 'w-amazing-reality',
    kind: 'workshop',
    icon: '🌟',
    titleAr: 'ورشة خلق واقع مدهش وتذكر الخوارق',
    titleEn: 'Creating an Amazing Reality & Remembering Miracles',
    descAr: `مع ضحى ملكاوي (ملكة تغيير الواقع 👸)

💥 محاور الورشة:
🌟 تنظيفات وتوضيحات عن الواقع القديم وأي واقع لا يشبهك
🌟 أسئلة فتح احتمالات
🌟 تحرير العقود والعهود القديمة مع نسخك وواقعك القديم
🌟 الاتصال بالذات العليا ورسم واقعك من خلال الألوان
🌟 تنظيف سجلات الأكاشا من خلال DNA
🌟 تفعيل وتذكر الخوارق لديك من خلال DNA
🌟 فتح أبواب الخلق وممالك الخلق لتذكر المستقبل
🌟 سحب طاقي جبّار بتقنيات جديدة`,
    descEn: `Tools to clear your old reality, open new probabilities, connect to the Higher Self, draw your future through colors, clean Akashic records via DNA, and remember your supernatural abilities.`,
    originalPriceJod: 71,
    discountPriceJod: 50,
    telegramLink: 'https://t.me/+-F6R1aZ2aKNlYjlk',
    order: 16,
  },
  {
    id: 'w-arafa-gate',
    kind: 'workshop',
    icon: '🕋',
    titleAr: 'بوابة عرفة 🕋 — عبور إلى المعجزات',
    titleEn: 'The Arafa Gate — Crossing Into Miracles',
    descAr: `رحلة كنة شاملة للتحرر، التفعيل، والتجلي في أقدس أيام النور.

🌌 ماذا ستعيش داخل الورشة؟
🌿 تحرر من أعمق سجونك الطاقية
🔥 تفكيك البرمجات المخزنة في الذاكرة الخلوية وDNA
💎 تفعيل شيفرات الوفرة، العلاقات الواعية، الزواج المقدس
🕊️ اتحاد النفس والعقل والجسد والروح
👁️ فتح العين الثالثة والرؤية الكنة للواقع الجديد
🎇 فتح بوابة الحقل الكوانتي
👑 توقيع عهد جديد مع الذات والقدر أمام بوابة عرفة
🕋 تفعيل بوابة "مِنى" وتجلي الرغبات العليا
🌕 الاتصال بالوعي المُحمدي النبوي

تُقام في يوم عرفة المبارك مع كودات ميتاترونية وترددات صوتية مفعّلة.`,
    descEn: `A cosmic journey on the sacred Day of Arafa: liberate from energetic prisons, dismantle cellular and DNA programming, activate the abundance and sacred-marriage codes, open the quantum gate.`,
    originalPriceJod: 79,
    discountPriceJod: 53,
    telegramLink: 'https://t.me/+x19GWQRXoxk2NTM0',
    order: 17,
  },
  {
    id: 'w-rizq-cloud',
    kind: 'workshop',
    icon: '☁️',
    titleAr: 'سحب طاقي — سحابة رزق ☁️💰',
    titleEn: 'Energetic Pull — Provision Cloud',
    descAr: `من بين السحب تحلق بين الأبعاد، سحابة رزق تقودك نحو الخيرات المكتوبة بقدرك.

سحب طاقي مجنون يفوق الأبعاد، نحرك الأكوان لأجلك. أنت تستحق.. هيا استعد.

نداء من بين الأكوان لك تناديك. من سيحلّق معنا من بين الأبعاد والأكوان من خلال سحابة رزق؟`,
    descEn: `An across-dimensions energetic pull session: a "provision cloud" guides you toward your written blessings.`,
    originalPriceJod: 53,
    discountPriceJod: 39,
    telegramLink: 'https://t.me/+f4LYU5YQ3alkOGI8',
    order: 18,
  },
  {
    id: 'w-infinity-money',
    kind: 'workshop',
    icon: '♾️',
    titleAr: 'ورشة انفنتي المال ♾️💵',
    titleEn: 'Infinity Money Workshop',
    descAr: `محاور الورشة:
💰 جلسة كسر كارما الأجداد والأسلاف للفقر والوضع المالي
💰 تحرير العقود والعهود المتعلقة بالمال
💰 جلسة الهرم الذهبي
💰 جلسة انفنتي المال
💰 جلسة تنزيل رمز الثراء (رمز خاص بضحى)
💰 توضيحات وتنظيفات اكسس قوية جدا
💰 تنزيل مشاعر الوفرة والثراء
💰 تمرين اكتشاف المعتقدات الخاصة بالمال من خلال التواصل مع الجسد
💰 سيبليمنال الوفرة والثراء

🎁 الهدايا: جلسة شحن المحفظة • صورة مشحونة • فيديو مشحون • موسيقى مشحونة • وصفة خاصة للماء • وصفة للوفرة.`,
    descEn: `Money infinity workshop: break ancestral poverty karma, release money contracts, golden pyramid session, money symbol download, abundance subliminal + many gifts (charged wallet, image, video, music, water recipe).`,
    originalPriceJod: 39,
    discountPriceJod: null,
    telegramLink: 'https://t.me/+XCjahmHUxvgyOTFk',
    order: 19,
  },

  // ============== الجلسات المسجلة المدفوعة (6) ==============
  {
    id: 'r-sacred-feminine',
    kind: 'recorded',
    icon: '👑',
    titleAr: 'جلسات تفعيل الأنثى المقدسة (جلسة دانيلا + وعي الملكة)',
    titleEn: 'Sacred Feminine Activation Sessions',
    descAr: `جلستان معاً:

🧜‍♀️ جلسة دانيلا: للقوة وتفعيل خواص طاقة الأنوثة الحقيقية نمبر 1، أنوثة طاغية، وفرة، شفاء الرحم، جمال وجاذبية، حظ عظيم، تجلي أهداف، تفعيل فرمون الأنوثة، صوت أنثوي ملهم، تفعيل مسار الجنسوانية، تطهير الهالة، موازنة الشاكرات والهرمونات، حب الذات، تفعيل القدرات الحدسية، الحمل للراغبات بالإنجاب.

👑 جلسة وعي الملكة: تعديل الشيفرة الوراثية لإزالة بصمات اضطهاد المرأة من السلالة، تكن الملكة في عائلتك، الذكاء، الكاريزما، الهيبة، أدوات سحرية لجذب ما تريد، جمال وجاذبية وأنوثة الملكة بلقيس، أثر عظيم على الأرض، استقلال مالي، محبة من النساء بدلاً من الغيرة.`,
    descEn: `Two sessions: Daniella (true #1 femininity activation, womb healing, pregnancy support) + Queen Consciousness (DNA editing to remove ancestral oppression of women, royal aura and influence).`,
    originalPriceJod: 79,
    discountPriceJod: 55,
    telegramLink: 'https://t.me/+zxqTU-fBUU0wYjNk',
    order: 20,
  },
  {
    id: 'r-cosmic-tones',
    kind: 'recorded',
    icon: '🎶',
    titleAr: 'جلسة نغمات الكون 🎶',
    titleEn: 'Cosmic Tones Session',
    descAr: `لحظات سحرية تمتزج فيها النغمات العذبة مع ترددات الكون.

💫 محاور الجلسة:
- نغمة القلب ❤️ — الحب والتوازن الداخلي
- نغمة الفلك 🌌 — التواصل مع الكون
- نغمة الحب والعلاقات 💕
- نغمة المال 💰 — جذب الوفرة
- نغمة النور 🌟
- نغمة الخلق والإبداع 🎨
- تمرين السنارة 🎣
- تمرين السحب الطاقي مع التاج 👑

كل نغمة مع تمرين خاص. مفتاح الجلسة هو البهجة.`,
    descEn: `A magical session blending cosmic frequencies with tones for: heart, cosmos, love & relationships, money, light, creativity — each with its own exercise.`,
    originalPriceJod: 62,
    discountPriceJod: 43,
    telegramLink: 'https://t.me/+BQ0n7WX3xN45M2I0',
    order: 21,
  },
  {
    id: 'r-energetic-pull',
    kind: 'recorded',
    icon: '⚡',
    titleAr: 'جلسة السحب الطاقي',
    titleEn: 'Energetic Pull Session',
    descAr: `سحب طاقي لمدة ساعة كاملة. سحب طاقي مجنون.`,
    descEn: `A full one-hour intense energetic pull session.`,
    originalPriceJod: 43,
    discountPriceJod: 31,
    telegramLink: 'https://t.me/+BkFID71nt1lkNWFk',
    order: 22,
  },
  {
    id: 'r-i-am-money',
    kind: 'recorded',
    icon: '💵',
    titleAr: 'جلسة أنا المال 💵',
    titleEn: 'I Am Money Session',
    descAr: `لقاء طاقي عميق لرفع طاقتك وطاقة الأرض، والشبك مع طاقة المال الروحية والوفرة العظيمة.

✨ تشافي عميق ورفع ذبذبات المال في هالتك
✨ شحن الهالة والشاكرات بطاقة المال الروحية
✨ تحقيق هدف مالي
✨ سحب طاقي للمال وجذبه لحياتك
✨ سحب طاقي لهدف مالي
✨ تنظيفات اكسس + نوايا مالية

ملاحظة: هناك هدية للمشتركين تُقدم لأول مرة.`,
    descEn: `Deep energy meeting that connects to the spiritual energy of money: aura/chakra charging with money frequency, energetic pull for a financial goal, Access clearings + a first-time gift.`,
    originalPriceJod: 28,
    discountPriceJod: null,
    telegramLink: 'https://t.me/+HMoiXd_v2TsxNzU0',
    order: 23,
  },
  {
    id: 'r-369-keys',
    kind: 'recorded',
    icon: '🔑',
    titleAr: 'جلسة مفاتيح 369',
    titleEn: '369 Keys Session',
    descAr: `🌟 ستتعلم أسرار ومفاتيح الكود الكن 369 وكيف تفعّله في حياتك من خلال التمارين.
🌟 جلسة طاقية بتقنيات عديدة: ثيتا، ريكي، اكسس، أكواد ورموز كنة خاصة.

ستشهد سحر الكون، التجليات العظيمة، الفتوحات، الوفرة اللامحدودة، الصحة، الشباب، الجمال، الجاذبية، تحسين العلاقات، جذب شريك الحياة، النصر، تقوية الحدس والبصيرة.`,
    descEn: `Learn the secrets of the cosmic 369 code and activate it via Theta, Reiki, Access, and special cosmic codes for unlimited abundance, beauty, relationships, intuition.`,
    originalPriceJod: 28,
    discountPriceJod: null,
    telegramLink: 'https://t.me/+QdknRi2wYrs3MWY8',
    order: 24,
  },
  {
    id: 'r-sacred-masculine',
    kind: 'recorded',
    icon: '🤴',
    titleAr: 'جلسات تفعيل الذكورة المقدسة (للرجال)',
    titleEn: 'Sacred Masculine Activation Sessions (Men)',
    descAr: `جلستان مع صورة مشحونة بكل نوايا الجلسات وشرح تفصيلي في القناة:

🔸 الجلسة الأولى: جلسة داوود 👨
🔸 الجلسة الثانية: وعي الملك 🤴

تعمل على: تفعيل طاقة الذكورة المقدسة المخفية، موازنة طاقتي الذكورة والأنوثة، تطهير الهالة والتحصين، تعديل الشيفرة الوراثية، تفعيل اسم الله القيوم لقوامة رجولتك، حكمة الأنبياء داوود ومحمد وسليمان عليهم السلام، التمتع بملك سليمان، معرفة رسالتك الروحية، موازنة هرمونات الذكورة، زيادة الخصوبة، قوة الشخصية والكاريزما، مغناطيس لجذب الثروة.`,
    descEn: `Two sessions for men: Dawood (David) session + King Consciousness. Activates sacred masculine, balances hormones, increases fertility, develops charisma, financial magnetism.`,
    originalPriceJod: 79,
    discountPriceJod: 53,
    telegramLink: 'https://t.me/+TjDKjA9fh8QzNjk0',
    order: 25,
  },

  // ============== الجلسات الخاصة الفردية (15) ==============
  {
    id: 'i-deep-digging',
    kind: 'individual-online',
    icon: '🔍',
    titleAr: 'جلسة التنقيب العميق – جذور المعتقدات',
    titleEn: 'Deep Excavation – Belief Roots Session',
    descAr: `هل تشعر أن هناك شيء خفي يعيقك؟ تعمل على نفسك ويتكرر نفس النمط؟ السبب غالباً في الجذور العميقة داخلك.

ما هو التنقيب العميق في الثيتا هيلينغ؟
الدخول إلى جذر المعتقدات المخزنة منذ الطفولة، الصدمات، التجارب، والموروث العائلي وتحريرها من المصدر.

خلال جلسة لمدة ساعتين عبر Zoom:
✔️ كشف المعتقدات الخفية في موضوعك (المال، العلاقات، الزواج، الثقة، الجسد، التوسع)
✔️ تحرير البرامج اللاواعية (الخوف، الاستحقاق المنخفض، التضحية، الذنب، التعلق، التدمير الذاتي)
✔️ استبدالها ببرامج جديدة داعمة
✔️ تغيير ملموس بعد الجلسة مباشرة

🎁 هدية مجانية: جلسة تجسيد الأماني + تذكر المستقبل.

📍 المدة: ساعتين • أونلاين Zoom • مخصصة لحالتك`,
    descEn: `2-hour Theta Healing Zoom session diving into the root of subconscious limiting beliefs across money, love, marriage, confidence, body, expansion. Includes a free Manifestation + Future Memory bonus session.`,
    originalPriceJod: 284,
    discountPriceJod: null,
    telegramLink: '',
    order: 26,
  },
  {
    id: 'i-ancestors-comm',
    kind: 'individual-online',
    icon: '👴',
    titleAr: 'جلسة التواصل مع الأسلاف',
    titleEn: 'Connecting With Ancestors Session',
    descAr: `جلسة بتقنية الثيتا هيلنج. نسأل الله أن يمكّنا من التواصل مع الأسلاف بخصوص موضوع عالق (زواج، مال، صحة، إنجاب) سببه وراثي مخزن في DNA متوارث من أحد الأجداد.

نتواصل مع السلف الذي عنده نفس المشكلة لنعرف:
- جذر المشكلة وكيف حصلت وكيف نحلها
- نصائح لحياتنا
- قطع أي عقود وعهود ومواثيق مع هذا السلف
- قطع أي روابط جينية وتاريخية متصلة بالموضوع
- الفضائل التي يمكن تعلمها وغرسها في خلايا أجسادك

كله يتم بالمستوى السابع للوجود مستوى الحب اللامشروط.

⏰ مدة الجلسة 45 دقيقة`,
    descEn: `45-min Theta session connecting to a specific ancestor carrying an inherited problem (marriage, money, health, fertility) — finding the root, breaking contracts, severing genetic ties, planting their virtues.`,
    originalPriceJod: 142,
    discountPriceJod: null,
    telegramLink: '',
    order: 27,
  },
  {
    id: 'i-intuitive-diagnosis',
    kind: 'individual-online',
    icon: '👁️',
    titleAr: 'جلسة التشخيص الحدسي',
    titleEn: 'Intuitive Diagnosis Session',
    descAr: `قراءة حدسية scan لجسدك، هالتك، خلاياك وDNA والأعضاء، وكشف عن كل الأمراض والمعتقدات والمشاعر والبلوكات اللي عاملة تعطيلات في حياتك.

- قراءة حدسية كاملة لكل شيء فيك
- تشافي وتحرير صدمة في نهاية الجلسة
- قراءة حدسية للقدرات الحدسية عندك وتفعيلها
- قراءة حدسية للرموز الخيميائية في مجالك الكمي وتفعيلها

الجلسة مباشرة معي ويتم تسجيلها.`,
    descEn: `A full intuitive scan of body, aura, cells, DNA, organs — uncovering diseases, blocks, beliefs and emotions, ending with trauma release and intuitive abilities activation. Recorded live session.`,
    originalPriceJod: 177,
    discountPriceJod: null,
    telegramLink: '',
    order: 28,
  },
  {
    id: 'i-akashic-records',
    kind: 'individual-online',
    icon: '📜',
    titleAr: 'جلسة سجلات الأكاشا',
    titleEn: 'Akashic Records Session',
    descAr: `جلسة روحية ندخل فيها إلى مكتبتك الروحية التي تحوي كل ما تعرفه روحك وذاكرتك الروحية: الماضي والحاضر والمستقبل وكل الحيوات السابقة.

- تفكيك الشيفرات المبهمة عن حياتك
- تحرير العقود والعهود مع أشخاص أو كيانات أو حيوات سابقة
- طرح حتى 7 أسئلة (إضافة أسئلة بسعر مختلف ووقت إضافي)
- قراءة السجلات لمعرفة الأجوبة
- معرفة الحلول والعلاج بما يتطلبه الإرشاد

⏰ مدة الجلسة ساعة ونصف`,
    descEn: `90-min spiritual journey into your Akashic library: decode life mysteries, release contracts with people/entities/past lives, ask up to 7 questions, receive guidance and healing.`,
    originalPriceJod: 213,
    discountPriceJod: null,
    telegramLink: '',
    order: 29,
  },
  {
    id: 'i-marriage-facilitation',
    kind: 'individual-online',
    icon: '💍',
    titleAr: 'جلسة تيسير الزواج',
    titleEn: 'Marriage Facilitation Session',
    descAr: `جلسة مباشرة معي على Zoom لمدة ساعة ونصف.

ماذا سنعمل عليه:
- تخليص كيانات اللي عاملين معها عقود زواج بدون وعي
- تغيير الجينات التي تحمل ذاكرة الألم والمعاناة حول الزواج والرجل والمرأة
- فك عقود وعهود الزواج من حيوات سابقة ومع الأجداد والأسلاف
- تيسر ترددات الزواج مع المجال الكمي الكن
- استقبال عروض زواج فخمة
- فك بلوك وعقد الزواج
- غرس مشاعر ومعتقدات جديدة للزواج السعيد الواعي المقدس`,
    descEn: `90-min Zoom session: clear unconscious marriage contracts with entities, modify pain-carrying marriage genes, release ancestral and past-life vows, attune to receive elevated marriage proposals.`,
    originalPriceJod: 315,
    discountPriceJod: null,
    telegramLink: '',
    order: 30,
  },
  {
    id: 'i-money-facilitation',
    kind: 'individual-online',
    icon: '💸',
    titleAr: 'جلسة تيسير المال 💰',
    titleEn: 'Money Facilitation Session',
    descAr: `جلسة مباشرة معي على Zoom لمدة ساعة ونصف.

ماذا سنعمل عليه:
- تخليص الكانات التي تسيطر على جسدك وتغلق مصادر استقبال المال
- تغيير الجينات التي تحمل كارمات الفقر والشح والندرة
- فك عقود وعهود الفقر من حيوات سابقة ومع الأجداد والأسلاف
- تيسير ترددات المال والثراء مع المجال الكمي الكن
- استقبال تدفقات مالية من كل مكان بيسر وسهولة
- فك بلوك وعقد المال والثراء
- غرس مشاعر ومعتقدات جديدة عن المال والثراء والاستقبال السهل`,
    descEn: `90-min Zoom session to clear money-blocking entities, rewrite poverty/scarcity genes, release ancestral and past-life poverty vows, open you to easy and abundant cosmic money flows.`,
    originalPriceJod: 315,
    discountPriceJod: null,
    telegramLink: '',
    order: 31,
  },
  {
    id: 'i-body-whispers',
    kind: 'individual-online',
    icon: '🌿',
    titleAr: 'جلسة همسات الجسد',
    titleEn: 'Body Whispers Session',
    descAr: `جلسة طاقية نحاكي فيها الجسد ونسمع همساته ونتصل من خلال الجسد بالأرض، ليصبح تواصل قوي وعميق بين جسدك والأرض، ونبدأ في تيسير الجسد وفتح الهمسات لنبدأ في مرحلة التشافي والتيسير.

تقنية جميلة جدا ونتائجها سريعة لأنها تحاكي الجسد. يمكنا اختيار أي موضوع وتطبيق التقنية عليه.

⏰ مدة الجلسة ساعة • أون لاين أو حضوري`,
    descEn: `1-hour energy session listening to body whispers and connecting deeply with the Earth via the body. Fast-acting technique that can be applied to any specific topic. Online or in-person.`,
    originalPriceJod: 177,
    discountPriceJod: null,
    telegramLink: '',
    order: 32,
  },
  {
    id: 'i-dna-formation',
    kind: 'individual-online',
    icon: '🧬',
    titleAr: 'جلسات تكوين DNA',
    titleEn: 'DNA Formation Sessions',
    descAr: `4 جلسات (واحدة مسجلة والباقي مباشر).

يتم فيها فك أقفال وأختام DNA، وحل الطاقات السلبية والظلامية (سحر، حسد، عين، كيانات).
إعادة ذاكرة DNA للذاكرة الأصلية وإعادة تنشيط وتشافي DNA.

عند تشافي الحمض النووي، يتم في نفس الوقت تشافي 7 أجيال للوراء و7 للأمام.

تشافي للأمراض والمشاعر والمعتقدات والصدمات والكارمات والعهود المخزنة في DNA.
بعد العلاج: تحسن في الصحة، العلاقات، المال، تجديد الشباب والحيوية والجمال.

سيتم تحديد الجلسات المباشرة مع ماستر ضحى فور الحجز.`,
    descEn: `4 sessions (1 recorded + 3 live): unlocking DNA seals, clearing dark energies (magic, evil eye, entities), restoring DNA's original memory. Healing reaches 7 generations back and 7 forward.`,
    originalPriceJod: 390,
    discountPriceJod: null,
    telegramLink: '',
    order: 33,
  },
  {
    id: 'i-genes-change',
    kind: 'individual-online',
    icon: '🧪',
    titleAr: 'جلسة تغيير الجينات',
    titleEn: 'Gene-Changing Session',
    descAr: `جلسة بتقنية خاصة بضحى. أعمل فيها على الخريطة الجينية لتغيير الجينات التي تحمل ذاكرة الألم والمعاناة والصدمات وكل ما يتعلق بالموضوع الذي تواجهه.

- إذابة الجينات القديمة
- خلق جينات جديدة بهذه التقنية المختلفة
- العمل على الروابط العصبية لجهازك العصبي

نتائجها سريعة لأن السر هو الجينات.

⏰ مدة الجلسة ساعة • مباشرة + تسجيل`,
    descEn: `1-hour live (recorded) session using Doha's signature technique: dissolving old pain-carrying genes, creating new genes for your chosen issue, and reworking your neural pathways. Fast results.`,
    originalPriceJod: 213,
    discountPriceJod: null,
    telegramLink: '',
    order: 34,
  },
  {
    id: 'i-who-am-i',
    kind: 'individual-online',
    icon: '✨',
    titleAr: 'جلسة من أنا (رحلة في اكتشاف الذات)',
    titleEn: 'Who Am I — Self Discovery Journey',
    descAr: `نداء لكل روح حابة تكتشف ذاتها أكثر، تغوص في أعماق الروح لتعرف حقيقتها وكنوزها، وتلتقي بنسختها العليا وتسمح لها بقيادة حياتك.

جلسة عميقة نغوص فيها في أعماق روحك ومكتبة روحك:
- الكشف عن ذاتك العليا والحقيقية
- اكتشاف هباتك الروحية وقدراتك وإمكانياتك ورسالتك وشغفك
- تقرير روحي كامل عن نفسك العليا

💥 ملاحظة: هذه ليست جلسة أكاشا، بل جلسة من بُعد آخر. هي فقط لمن تختار روحه الولادة.

⏰ مدة الجلسة ساعة • مباشرة عبر Zoom`,
    descEn: `1-hour Zoom session diving into the depths of your soul library to discover your higher self, gifts, mission, passion. NOT an Akashic session — from a different dimension.`,
    originalPriceJod: 213,
    discountPriceJod: null,
    telegramLink: '',
    order: 35,
  },
  {
    id: 'i-entities-release',
    kind: 'individual-online',
    icon: '🛡️',
    titleAr: 'جلسة تخليص الكانات',
    titleEn: 'Entities Release Session',
    descAr: `نحرر فيها كل الأرواح التائهة والمتمردة والجن والشياطين، كل الهيئات الروحية التي تتلاعب في حياتك، وتسيطر على أعمالك وزواجك وبيتك.

مهم لكل شخص لأن الكانات تعيق الكثير من أمور حياتنا.
هناك كيانات الأجساد التي تتحكم في اختياراتنا (ما نأكل، نلبس، نوع علاقاتنا) بدون وعي منا.
وهناك كيانات تعقد معنا عقود وعهود زواج لتبقى في حياتنا.

تتم بتقنية الثيتا هيلينك واكسس كونشيسنيس.

⏰ مدة الجلسة ساعة • مباشرة + تسجيل`,
    descEn: `1-hour live (recorded) session releasing wandering souls, jinn, demons, and entities controlling your body, choices, marriage and home. Uses Theta Healing and Access Consciousness.`,
    originalPriceJod: 248,
    discountPriceJod: null,
    telegramLink: '',
    order: 36,
  },
  {
    id: 'i-past-lives',
    kind: 'individual-online',
    icon: '🕰️',
    titleAr: 'جلسة التواصل مع الحيوات السابقة واستعادة القدرات والثروات',
    titleEn: 'Past Lives — Reclaim Skills & Wealth Session',
    descAr: `بتقنية الثيتا هيلينك، نعود إلى حيواتنا السابقة التي كنا فيها أثرياء وكان لدينا خبرات ومهارات وقدرات وإمكانيات في النجاح والثروات.

نتعرف على هذه النسخ ونستعيد منها:
- الأموال
- الخبرات والمهارات
- الحقوق
- كل ما كنا عليه من ثراء ونجاح وحكمة

⏰ مدة الجلسة 45 دقيقة • مباشرة + تسجيل`,
    descEn: `45-min Theta session traveling to past lives where you were wealthy/skilled — reclaiming your money, expertise, rights, success and wisdom from those versions.`,
    originalPriceJod: 142,
    discountPriceJod: null,
    telegramLink: '',
    order: 37,
  },
  {
    id: 'i-manifest-wishes',
    kind: 'individual-online',
    icon: '🌟',
    titleAr: 'جلسة تجسيد الأماني',
    titleEn: 'Wish Manifestation Session',
    descAr: `نعمل في هذه الجلسة على تجسيد أهدافك بعد:
- الكشف عن جذور المعتقدات التي تعيق التجسيد
- تحرير المشاعر المخزنة في الجسد المشاعري التي تعيق التجسيد
- البدء بالتجسيد والتجلي مع السحب الطاقي للأهداف

تتم بتقنية الثيتا هيلينك واكسس كونشيسنيس.

⏰ مدة الجلسة ساعة • مباشرة + تسجيل`,
    descEn: `1-hour live (recorded) session: uncovering hidden manifestation blocks, releasing trapped emotions, then anchoring goals via energetic pull. Theta + Access Consciousness.`,
    originalPriceJod: 213,
    discountPriceJod: null,
    telegramLink: '',
    order: 38,
  },
  {
    id: 'i-access-bars',
    kind: 'individual-online',
    icon: '🧠',
    titleAr: 'جلسة اكسس بارز',
    titleEn: 'Access Bars Session',
    descAr: `مسارات الوعي يتم من خلالها تفكيك المعتقدات والصدمات المخزنة في مسارات الوعي لتبدأ حياتنا بالتغيير نحو الأفضل.

تقنية تعتمد على لمس 32 نقطة محددة في الرأس برفق، تساعد في "تفريغ" الشحنات الكهرومغناطيسية للأفكار والمشاعر المخزنة.

أهم فوائدها:
• هدوء ذهني عميق وإيقاف الثرثرة الفكرية
• تقليل التوتر والقلق
• تحسين جودة النوم
• زيادة التركيز والوضوح
• تفريغ المشاعر السلبية والمعتقدات المقيدة
• تعزيز الطاقة الحيوية

تشبه عملية "فورمات" أو إعادة ضبط لمصنع العقل.

📍 الجلسة حضوري فقط في الأردن
⏰ مدة الجلسة ساعة إلى ساعة ونصف`,
    descEn: `1 to 1.5 hr session — gentle touching of 32 head points to discharge stored beliefs and traumas. Like a "factory reset" for the mind. IN-PERSON ONLY in Jordan.`,
    originalPriceJod: 200,
    discountPriceJod: null,
    telegramLink: '',
    order: 39,
  },
  {
    id: 'i-big-five',
    kind: 'individual-online',
    icon: '🔓',
    titleAr: 'جلسة فك الخمسة الكبار',
    titleEn: 'The Big Five Release Session',
    descAr: `"الخمسة الكبار" خمسة هياكل طاقية نستخدمها لنبني واقعنا المحدود ونتمسك بالدراما:
1. الخوارزميات (Algorithms): الأنماط المتكررة الآلية
2. الأدوار (Roles): الشخصيات (الضحية، المنقذ، المثالي)
3. التعريفات (Definitions): كيف تعرّف نفسك والآخرين
4. النظم (Systems): القواعد التي تتبعها
5. الهياكل (Structures): البناء الصلب الذي تضعه حول حياتك

فوائد الجلسة:
• إنهاء الأنماط المتكررة (مالية، عاطفية)
• الخروج من القيادة الآلية
• تفكيك الدراما
• استعادة الذات الحقيقية
• توسيع الاحتمالات

عملية جسدية (Body Process) تحتاج لتلامس طاقي.

📍 الجلسة حضوري فقط في الأردن
⏰ مدة الجلسة ساعة`,
    descEn: `1-hour body-process session dismantling the 5 energetic structures (algorithms, roles, definitions, systems, structures) that lock you in repeating patterns. IN-PERSON ONLY in Jordan.`,
    originalPriceJod: 250,
    discountPriceJod: null,
    telegramLink: '',
    order: 40,
  },
];
