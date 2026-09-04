import { Link } from 'wouter';
import { useApp } from '@/lib/store';
import { MasahaLogo } from '@/components/icons';

export default function PrivacyPolicy() {
  const { lang } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a0a2e] via-[#2a1444] to-[#1a0a2e] pt-[68px]">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex justify-center mb-10">
          <MasahaLogo width={104} height={104} />
        </div>

        <div className="bg-[rgba(30,14,56,0.75)] border border-[rgba(212,160,23,0.25)] rounded-2xl p-8 md:p-12">
          {lang === 'ar' ? (
            <div dir="rtl">
              <h1 className="text-white text-3xl font-black mb-2">سياسة الخصوصية</h1>
              <p className="text-[rgba(255,255,255,0.45)] text-sm mb-10">آخر تحديث: مايو 2026</p>

              <section className="mb-8">
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">١. المعلومات التي نجمعها</h2>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed">
                  نجمع المعلومات التي تقدمينها طوعاً عند إنشاء حساب على منصتنا، بما في ذلك الاسم الكامل وعنوان البريد الإلكتروني ورقم الهاتف. نقوم أيضاً بجمع بيانات استخدام المنصة بشكل مجهول لتحسين تجربتك.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">٢. كيف نستخدم معلوماتك</h2>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed mb-3">
                  تُستخدم المعلومات التي نجمعها للأغراض التالية حصراً:
                </p>
                <ul className="list-disc list-inside text-[rgba(255,255,255,0.75)] space-y-2 leading-relaxed">
                  <li>تفعيل حسابك وإدارة اشتراكاتك في الكورسات والدورات</li>
                  <li>التواصل معك بشأن طلباتك وحجوزاتك</li>
                  <li>إرسال تحديثات وإشعارات تتعلق بخدماتنا</li>
                  <li>تحسين جودة المحتوى والخدمات المقدمة</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">٣. حماية بياناتك الشخصية</h2>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed">
                  نأخذ حماية بياناتك الشخصية بجدية بالغة. جميع بياناتك — بما فيها اسمك وعنوان بريدك الإلكتروني — مشفّرة ومحمية بأحدث تقنيات التشفير المعتمدة عالمياً (Firebase Authentication + Firestore Security Rules). <strong className="text-white">نحن لا نبيع بياناتك ولا نشاركها مع أي طرف ثالث تحت أي ظرف</strong>، ولا نستخدمها لأي غرض تجاري خارج نطاق الخدمات التي اشتركت بها.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">٤. مشاركة المعلومات</h2>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed">
                  لا يتم مشاركة معلوماتك الشخصية مع أي جهة خارجية، باستثناء:
                </p>
                <ul className="list-disc list-inside text-[rgba(255,255,255,0.75)] space-y-2 mt-3 leading-relaxed">
                  <li>مزودي الخدمات التقنية الضروريين لتشغيل المنصة (مثل Firebase من Google)، وهم مُلزمون باتفاقيات سرية صارمة</li>
                  <li>عند وجود متطلب قانوني صريح من الجهات المختصة</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">٥. ملفات تعريف الارتباط (Cookies)</h2>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed">
                  نستخدم ملفات تعريف الارتباط لحفظ تفضيلاتك (اللغة، العملة، سلة المشتريات) وللحفاظ على جلسة تسجيل الدخول. يمكنك تعطيلها من إعدادات متصفحك، لكن ذلك قد يؤثر على بعض وظائف المنصة.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">٦. حقوقك</h2>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed">
                  يحق لك في أي وقت: الاطلاع على بياناتك الشخصية المخزنة، طلب تصحيحها أو حذفها، أو سحب موافقتك على معالجتها. للتواصل بشأن ذلك، راسلينا على تلجرام أو إنستغرام.
                </p>
              </section>

              <section>
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">٧. التواصل معنا</h2>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed">
                  إذا كان لديك أي استفسار حول سياسة الخصوصية، يمكنك التواصل معنا عبر قنوات التواصل الرسمية المذكورة في أسفل الصفحة الرئيسية.
                </p>
              </section>
            </div>
          ) : (
            <div dir="ltr">
              <h1 className="text-white text-3xl font-black mb-2">Privacy Policy</h1>
              <p className="text-[rgba(255,255,255,0.45)] text-sm mb-10">Last updated: May 2026</p>

              <section className="mb-8">
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">1. Information We Collect</h2>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed">
                  We collect information you voluntarily provide when creating an account on our platform, including your full name, email address, and phone number. We also collect anonymous usage data to improve your experience.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">2. How We Use Your Information</h2>
                <ul className="list-disc list-inside text-[rgba(255,255,255,0.75)] space-y-2 leading-relaxed">
                  <li>Activating your account and managing your course/workshop subscriptions</li>
                  <li>Communicating about your orders and bookings</li>
                  <li>Sending service-related updates and notifications</li>
                  <li>Improving content quality and services</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">3. Data Security</h2>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed">
                  We take your personal data security seriously. All your data — including your name and email — is encrypted and protected using industry-standard technologies (Firebase Authentication + Firestore Security Rules). <strong className="text-white">We never sell or share your data with any third party under any circumstances</strong>, and we do not use it for any commercial purpose outside the services you subscribed to.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">4. Data Sharing</h2>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed">
                  Your personal information is not shared with any external parties, except for technical service providers necessary to operate the platform (e.g., Firebase by Google), who are bound by strict confidentiality agreements, or when legally required by competent authorities.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">5. Cookies</h2>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed">
                  We use cookies to save your preferences (language, currency, shopping cart) and maintain your login session. You can disable them in your browser settings, though this may affect some platform features.
                </p>
              </section>

              <section>
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">6. Your Rights</h2>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed">
                  You may at any time request to view, correct, or delete your stored personal data, or withdraw your consent to its processing. Please contact us via our official social channels listed at the bottom of the homepage.
                </p>
              </section>
            </div>
          )}
        </div>

        <div className="text-center mt-8">
          <Link href="/" className="inline-block text-[rgba(255,255,255,0.5)] text-sm hover:text-[hsl(var(--g300))] transition-colors">
            ← {lang === 'ar' ? 'العودة إلى الرئيسية' : 'Back to Home'}
          </Link>
        </div>
      </div>
    </div>
  );
}
