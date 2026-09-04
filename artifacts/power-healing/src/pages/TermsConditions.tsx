import { Link } from 'wouter';
import { useApp } from '@/lib/store';
import { MasahaLogo } from '@/components/icons';

export default function TermsConditions() {
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
              <h1 className="text-white text-3xl font-black mb-2">الشروط والأحكام</h1>
              <p className="text-[rgba(255,255,255,0.45)] text-sm mb-10">آخر تحديث: مايو 2026</p>

              <section className="mb-8">
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">١. القبول بالشروط</h2>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed">
                  باستخدامك لمنصة ضحى هيلينج والتسجيل في أي من كورساتها أو ورشاتها، فإنك توافق توافقاً تاماً على الشروط والأحكام التالية. إذا كنت لا توافق على هذه الشروط، يُرجى عدم الاستمرار في استخدام المنصة.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">٢. الحسابات الشخصية</h2>
                <div className="bg-[rgba(255,80,80,0.08)] border border-[rgba(255,80,80,0.25)] rounded-xl p-4 mb-4">
                  <p className="text-[#ffb0b0] font-bold text-sm">
                    ⚠️ تنبيه مهم: الحساب شخصي وغير قابل للمشاركة
                  </p>
                </div>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed mb-3">
                  الحساب الذي تنشئينه على المنصة هو حساب شخصي بالكامل ومخصص لك أنت فقط. <strong className="text-white">يُمنع منعاً باتاً مشاركة بيانات الدخول مع أي شخص آخر</strong>، سواء أكان فرداً أم مجموعة، بصرف النظر عن العلاقة بينكما.
                </p>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed">
                  كل محتوى تحصلين عليه من خلال المنصة — من جلسات مسجلة أو كورسات أو ورشات — هو مُرخَّص لك وحدك للاستخدام الشخصي، وليس للتوزيع أو المشاركة.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">٣. حظر التسجيل وإعادة البيع</h2>
                <div className="bg-[rgba(255,80,80,0.08)] border border-[rgba(255,80,80,0.25)] rounded-xl p-4 mb-4">
                  <p className="text-[#ffb0b0] font-bold text-sm">
                    🚫 هذه الأفعال مخالفة قانونية وتعرضك للحظر الفوري
                  </p>
                </div>
                <ul className="list-disc list-inside text-[rgba(255,255,255,0.8)] space-y-3 leading-relaxed">
                  <li><strong className="text-white">تسجيل أي محتوى</strong> من الكورسات أو الجلسات أو الورشات، سواء كان مرئياً أو صوتياً، بأي أداة أو تقنية كانت</li>
                  <li><strong className="text-white">إعادة بيع المحتوى</strong> أو توزيعه أو مشاركته مع أطراف أخرى، سواء بمقابل مادي أو مجاناً</li>
                  <li><strong className="text-white">مشاركة بيانات الدخول</strong> (البريد الإلكتروني وكلمة المرور) مع أي شخص آخر</li>
                  <li><strong className="text-white">نشر أي جزء من المحتوى</strong> على منصات التواصل الاجتماعي أو أي منصة أخرى</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">٤. عواقب المخالفات</h2>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed">
                  في حال ثبوت أي مخالفة للبنود أعلاه، يحق لنا اتخاذ الإجراءات التالية فوراً وبدون إنذار مسبق:
                </p>
                <ul className="list-disc list-inside text-[rgba(255,255,255,0.75)] space-y-2 mt-3 leading-relaxed">
                  <li>إيقاف الحساب نهائياً وحظره من المنصة</li>
                  <li>اتخاذ الإجراءات القانونية اللازمة بموجب قوانين الملكة الفكرية المعمول بها</li>
                  <li>المطالبة بالتعويض عن الأضرار الناجمة عن المخالفة</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">٥. الملكة الفكرية</h2>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed">
                  جميع المحتويات المتاحة على المنصة — من فيديوهات وصوتيات ومواد مكتوبة وأساليب تدريس — هي ملكة فكرية خالصة لضحى ملكاوي ومحمية بموجب قوانين حقوق النشر الدولية. لا يجوز استخدامها أو إعادة إنتاجها بأي شكل كان دون إذن خطي مسبق.
                </p>
              </section>

              <section>
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">٦. التعديلات على الشروط</h2>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed">
                  نحتفظ بحق تعديل هذه الشروط في أي وقت. سيتم إخطارك بأي تعديلات جوهرية عبر البريد الإلكتروني المسجل. استمرارك في استخدام المنصة بعد نشر التعديلات يُعدّ قبولاً ضمنياً بها.
                </p>
              </section>
            </div>
          ) : (
            <div dir="ltr">
              <h1 className="text-white text-3xl font-black mb-2">Terms & Conditions</h1>
              <p className="text-[rgba(255,255,255,0.45)] text-sm mb-10">Last updated: May 2026</p>

              <section className="mb-8">
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">1. Acceptance of Terms</h2>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed">
                  By using the Doha Healing platform and registering for any course or workshop, you fully agree to the following terms and conditions. If you do not agree, please discontinue use of the platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">2. Personal Accounts</h2>
                <div className="bg-[rgba(255,80,80,0.08)] border border-[rgba(255,80,80,0.25)] rounded-xl p-4 mb-4">
                  <p className="text-[#ffb0b0] font-bold text-sm">
                    ⚠️ Important: Accounts are strictly personal and non-transferable
                  </p>
                </div>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed">
                  Your account is strictly personal and intended for your use only. <strong className="text-white">Sharing login credentials with any other person is strictly prohibited</strong>, regardless of relationship or circumstance.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">3. Prohibited Activities</h2>
                <div className="bg-[rgba(255,80,80,0.08)] border border-[rgba(255,80,80,0.25)] rounded-xl p-4 mb-4">
                  <p className="text-[#ffb0b0] font-bold text-sm">
                    🚫 The following are illegal and result in immediate permanent ban
                  </p>
                </div>
                <ul className="list-disc list-inside text-[rgba(255,255,255,0.8)] space-y-3 leading-relaxed">
                  <li><strong className="text-white">Recording any content</strong> from courses, sessions, or workshops — audio or video — using any tool or technology</li>
                  <li><strong className="text-white">Reselling, distributing, or sharing content</strong> with others, whether for profit or for free</li>
                  <li><strong className="text-white">Sharing login credentials</strong> with any other person</li>
                  <li><strong className="text-white">Publishing any portion of content</strong> on social media or any other platform</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">4. Consequences of Violations</h2>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed">
                  Upon confirmed violation of the above terms, we reserve the right to take the following actions immediately and without prior warning:
                </p>
                <ul className="list-disc list-inside text-[rgba(255,255,255,0.75)] space-y-2 mt-3 leading-relaxed">
                  <li>Permanently suspend and ban the account</li>
                  <li>Pursue legal action under applicable intellectual property laws</li>
                  <li>Claim compensation for damages resulting from the violation</li>
                </ul>
              </section>

              <section>
                <h2 className="text-[hsl(var(--g300))] text-lg font-bold mb-3">5. Intellectual Property</h2>
                <p className="text-[rgba(255,255,255,0.8)] leading-relaxed">
                  All content on the platform — videos, audio, written materials, and teaching methodologies — is the exclusive intellectual property of Doha Malkawi and is protected under international copyright laws. It may not be used or reproduced in any form without prior written permission.
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
