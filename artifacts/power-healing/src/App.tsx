import { useEffect, useState } from "react";
import hero1 from "./assets/hero1.png";
import hero2 from "./assets/hero2.png";
import hero3 from "./assets/hero3.png";
import aboutImg from "./assets/about.png";

const slides = [
  {
    image: hero1,
    badge: "مساحة الشفاء",
    title: "استعد توازنك،",
    title2: "وانعم بالسلام الحقيقي.",
    subtitle:
      "مساحة هادئة وآمنة للشفاء بالطاقة، واستعادة العافية الجسدية والروحية. مع ضحى، تبدأ رحلتك نحو نسخة أكثر انسجاماً من نفسك.",
  },
  {
    image: hero2,
    badge: "الشفاء بالطاقة",
    title: "أطلق طاقتك الداخلية،",
    title2: "وانسجم مع كونك.",
    subtitle:
      "من خلال تقنيات الريكي وتوازن الشاكرات، نساعدك على إزالة الانسدادات وتدفق الطاقة الحيوية بشكل طبيعي.",
  },
  {
    image: hero3,
    badge: "رحلة التحول",
    title: "ابدأ رحلة التحول،",
    title2: "نحو نسختك الأفضل.",
    subtitle:
      "أكثر من ١٢٠٠ جلسة شفاء ناجحة. جلسات فردية وجماعية وعن بُعد. تجربة تحوّلية حقيقية بقيادة ضحى.",
  },
];

const testimonials = [
  {
    name: "سارة العمري",
    location: "عمّان، الأردن",
    text: 'وصلتُ إلى ضحى وأنا في قمة الإرهاق والانقطاع عن نفسي. بعد ثلاث جلسات فقط، شعرت كأن شيئاً ما انفتح من الداخل — هدوء لم أعرفه من سنوات. هذه التجربة غيّرت مساري.',
    initials: "س",
  },
  {
    name: "كريم حداد",
    location: "بيروت، لبنان",
    text: "كنتُ متشككاً في البداية، لكن الجلسة الأولى أقنعتني. ضحى يمتلك حضوراً استثنائياً وقدرة نادرة على الإنصات والإحساس بما يحتاجه الشخص دون أن يتكلم. أنصح به بشدة.",
    initials: "ك",
  },
  {
    name: "نور الشمري",
    location: "الرياض، المملكة العربية السعودية",
    text: "حضرتُ ورشة صحوة الشاكرات وخرجتُ بفهم جديد كلياً لجسدي وطاقتي. الأدوات التي تعلمتها لا تزال ترافقني يومياً. شكراً ضحى على هذا العطاء.",
    initials: "ن",
  },
  {
    name: "ليلى إبراهيم",
    location: "دبي، الإمارات",
    text: "الجلسة عن بُعد كانت تجربة مذهلة — لم أتوقع أن أشعر بهذا العمق عبر الشاشة. ضحى يخلق مساحة من الأمان والاحتواء بشكل يصعب وصفه بالكلمات.",
    initials: "ل",
  },
];

const faqs = [
  {
    q: "هل الشفاء بالطاقة علمي ومثبت؟",
    a: "نعم، تشير الأبحاث العلمية الحديثة إلى أن تقنيات مثل الريكي والتأمل لها تأثيرات موثقة على الجهاز العصبي والصحة النفسية والجسدية. آلاف الدراسات تثبت فاعليتها في تخفيف التوتر، تحسين النوم، وتعزيز المناعة.",
  },
  {
    q: "كم عدد الجلسات التي أحتاجها لأرى نتائج؟",
    a: "يختلف ذلك من شخص لآخر، لكن كثير من العملاء يشعرون بتحسن ملموس بعد الجلسة الأولى. للتغيير العميق والمستدام، نوصي بثلاث جلسات على الأقل لمعالجة الجذور العميقة.",
  },
  {
    q: "هل يمكنني حجز جلسة عن بُعد وأنا خارج الأردن؟",
    a: "بالتأكيد! الشفاء لا يعرف حدوداً جغرافية. نستقبل عملاء من أكثر من ١٨ دولة عبر جلسات مرئية مباشرة فعّالة تماماً كالجلسات الحضورية.",
  },
  {
    q: "ما الذي يجب أن أتوقعه في جلستي الأولى؟",
    a: "ستبدأ بمحادثة تعريفية نفهم فيها احتياجاتك وأهدافك. ثم تدخل في حالة استرخاء عميق بينما نعمل على مستوى الطاقة. معظم العملاء يشعرون بدفء وهدوء عميق خلال الجلسة.",
  },
  {
    q: "هل هناك تعارض بين الشفاء بالطاقة والعلاج الطبي؟",
    a: "لا تعارض على الإطلاق. الشفاء بالطاقة علاج تكميلي يعمل جنباً إلى جنب مع العلاج الطبي التقليدي ولا يحل محله. نحرص دائماً على التوافق مع خطة علاجك الطبية.",
  },
  {
    q: "ما هي سياسة الإلغاء والاسترداد؟",
    a: "يمكن إلغاء الجلسة أو إعادة جدولتها مجاناً قبل ٢٤ ساعة من الموعد. في حالة الإلغاء المتأخر، يُطبق رسم بسيط. للاستفسار عن الاسترداد، يرجى التواصل معنا مباشرة.",
  },
];

export default function App() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        setIsTransitioning(false);
      }, 600);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => {
    if (index === currentSlide) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsTransitioning(false);
    }, 400);
  };

  const slide = slides[currentSlide];

  return (
    <div className="app" dir="rtl">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">مساحة الشفاء</span>
          </div>
          <div className="nav-links">
            <a href="#about">من أنا</a>
            <a href="#services">الخدمات</a>
            <a href="#testimonials">آراء العملاء</a>
            <a href="#blog">المدونة</a>
            <a href="#faq">الأسئلة الشائعة</a>
            <a href="#book" className="nav-btn">احجز جلستك</a>
          </div>
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
        {mobileMenuOpen && (
          <div className="mobile-menu">
            <a href="#about" onClick={() => setMobileMenuOpen(false)}>من أنا</a>
            <a href="#services" onClick={() => setMobileMenuOpen(false)}>الخدمات</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)}>آراء العملاء</a>
            <a href="#blog" onClick={() => setMobileMenuOpen(false)}>المدونة</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>الأسئلة الشائعة</a>
            <a href="#book" className="nav-btn" onClick={() => setMobileMenuOpen(false)}>احجز جلستك</a>
          </div>
        )}
      </nav>

      {/* HERO SLIDER */}
      <section className="hero">
        <div
          className={`hero-bg ${isTransitioning ? "fade-out" : "fade-in"}`}
          style={{ backgroundImage: `url(${slide.image})` }}
        />
        <div className="hero-overlay" />
        <div className={`hero-content ${isTransitioning ? "slide-out" : "slide-in"}`}>
          <span className="hero-badge">{slide.badge}</span>
          <h1 className="hero-title">
            {slide.title}
            <br />
            <span className="hero-title-gold">{slide.title2}</span>
          </h1>
          <p className="hero-subtitle">{slide.subtitle}</p>
          <div className="hero-actions">
            <a href="#book" className="btn-primary">احجز جلستك الأولى</a>
            <a href="#services" className="btn-outline">تعرّف على الخدمات</a>
          </div>
        </div>
        <div className="slider-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`dot ${i === currentSlide ? "active" : ""}`}
              onClick={() => goToSlide(i)}
            />
          ))}
        </div>
        <div className="slider-arrows">
          <button
            className="arrow"
            onClick={() => goToSlide((currentSlide - 1 + slides.length) % slides.length)}
          >&#8250;</button>
          <button
            className="arrow"
            onClick={() => goToSlide((currentSlide + 1) % slides.length)}
          >&#8249;</button>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="stats-bar">
        <div className="stat">
          <span className="stat-number">+١٢٠٠</span>
          <span className="stat-label">جلسة شفاء</span>
        </div>
        <div className="stat-divider" />
        <div className="stat">
          <span className="stat-number">١٥+</span>
          <span className="stat-label">سنة خبرة</span>
        </div>
        <div className="stat-divider" />
        <div className="stat">
          <span className="stat-number">١٨</span>
          <span className="stat-label">دولة حول العالم</span>
        </div>
        <div className="stat-divider" />
        <div className="stat">
          <span className="stat-number">٤</span>
          <span className="stat-label">شهادات معتمدة</span>
        </div>
      </section>

      {/* ABOUT */}
      <section className="about" id="about">
        <div className="about-container">
          <div className="about-image-wrap">
            <img src={aboutImg} alt="ضحى" className="about-img" />
            <div className="about-badge-float">معالج طاقة معتمد</div>
          </div>
          <div className="about-content">
            <span className="section-label">من أنا</span>
            <h2 className="section-title">ضحى — معالج الطاقة والمرشد الروحي</h2>
            <p className="about-text">
              بدأت رحلتي مع الشفاء بالطاقة منذ أكثر من خمس عشرة سنة، بعد أن عشت تجربة تحوّل شخصية عميقة غيّرت نظرتي للحياة كلياً. أدركتُ حينها أن الجسم البشري يحمل في داخله قدرة هائلة على الشفاء الذاتي — كل ما يحتاجه هو المساحة الصحيحة والدعم المناسب.
            </p>
            <p className="about-text">
              اليوم، أرافق عملاءً من مختلف أنحاء العالم في رحلاتهم نحو التوازن والسلام الداخلي. أجمع في ممارستي بين أعمق تقاليد الشفاء الشرقية والمستجدات العلمية في علم الأعصاب وعلم الطاقة الحيوية.
            </p>
            <div className="certs">
              <h4 className="certs-title">حاصل على شهادات معتمدة في:</h4>
              <ul className="certs-list">
                <li>✦ الريكي — الدرجة الثالثة (Master)</li>
                <li>✦ توازن الشاكرات والطاقة الحيوية</li>
                <li>✦ التأمل العلاجي والوعي الكامل (Mindfulness)</li>
                <li>✦ العلاج بالصوت والترددات</li>
              </ul>
            </div>
            <a href="#book" className="btn-primary">ابدأ رحلتك معي</a>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="services" id="services">
        <div className="section-header">
          <span className="section-label">ما نقدمه</span>
          <h2 className="section-title">خدمات الشفاء</h2>
          <p className="section-desc">
            كل خدمة مصممة لتلبية احتياجك تحديداً — سواء كنت تبحث عن شفاء فردي عميق أو تجربة جماعية تحوّلية.
          </p>
        </div>
        <div className="services-grid">
          {[
            {
              icon: "✧",
              title: "جلسات الشفاء الفردية",
              desc: "جلسات خاصة مخصصة بالكامل لك، تُدار بعناية واهتمام فائقين. نستهدف فيها إزالة الانسدادات الطاقية، وتوازن الشاكرات، وتنشيط قدرة الجسم الطبيعية على الشفاء.",
            },
            {
              icon: "◈",
              title: "ورش العمل الجماعية",
              desc: "تجمعات شفائية دافئة بقيادة ضحى، تجمع المشاركين في رحلة مشتركة نحو الوعي والتحرر. بيئة آمنة تتيح لك الاستكشاف والنمو بصحبة آخرين على الطريق ذاته.",
            },
            {
              icon: "◉",
              title: "المحاضرات والتعليم",
              desc: "محاضرات تثقيفية تجمع بين العلم والروحانية — تشرح آليات عمل الطاقة في الجسم وتمنحك أدوات عملية لتطبيقها في حياتك اليومية.",
            },
            {
              icon: "✦",
              title: "جلسات عن بُعد",
              desc: "الشفاء لا يعرف حدوداً جغرافية. جلساتنا عن بُعد فعّالة تماماً كالجلسات الحضورية، وتتيح لك الوصول إلى التجربة الكاملة من أي مكان في العالم.",
            },
          ].map((s, i) => (
            <div key={i} className="service-card">
              <div className="service-icon">{s.icon}</div>
              <h3 className="service-title">{s.title}</h3>
              <p className="service-desc">{s.desc}</p>
              <a href="#book" className="service-link">احجز الآن ←</a>
            </div>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="testimonials" id="testimonials">
        <div className="section-header">
          <span className="section-label">آراء العملاء</span>
          <h2 className="section-title">ماذا قالوا عن تجربتهم</h2>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <div key={i} className="testimonial-card">
              <div className="quote-mark">"</div>
              <p className="testimonial-text">{t.text}</p>
              <div className="testimonial-author">
                <div className="author-avatar">{t.initials}</div>
                <div className="author-info">
                  <strong>{t.name}</strong>
                  <span>{t.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BLOG */}
      <section className="blog" id="blog">
        <div className="section-header">
          <span className="section-label">المدونة</span>
          <h2 className="section-title">أفكار ومقالات في الشفاء</h2>
        </div>
        <div className="blog-grid">
          {[
            {
              cat: "شفاء بالطاقة",
              date: "مارس ٢٠٢٦",
              title: "الشاكرات السبع: دليلك العملي للتوازن اليومي",
              desc: "الشاكرات ليست مجرد مفهوم روحي — إنها مراكز طاقة حقيقية في جسمك يمكنك تعلّم قراءتها والتعامل معها.",
            },
            {
              cat: "علم الجهاز العصبي",
              date: "فبراير ٢٠٢٦",
              title: "لماذا التنفس هو أقوى أداة شفاء تملكها",
              desc: "العلم يُثبت ما عرفه الشرق منذ آلاف السنين: أنماط التنفس تؤثر مباشرةً على جهازك العصبي وحالتك الطاقية.",
            },
            {
              cat: "الصحة العاطفية",
              date: "يناير ٢٠٢٦",
              title: "الفرق بين الحزن الصحي والحمل الطاقي الثقيل",
              desc: "ليس كل ألم مرض، وليس كل حزن يحتاج إلى إزالة. أحياناً الحزن رسالة من الجسم والروح.",
            },
          ].map((b, i) => (
            <div key={i} className="blog-card">
              <div className="blog-card-top">
                <span className="blog-cat">{b.cat}</span>
                <span className="blog-date">{b.date}</span>
              </div>
              <h3 className="blog-title">{b.title}</h3>
              <p className="blog-desc">{b.desc}</p>
              <a href="#blog" className="service-link">اقرأ المقال ←</a>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="faq" id="faq">
        <div className="section-header">
          <span className="section-label">الأسئلة الشائعة</span>
          <h2 className="section-title">ما الذي تريد معرفته؟</h2>
          <p className="section-desc">إجابات على أكثر الأسئلة شيوعاً حول الشفاء بالطاقة وكيفية البدء في رحلتك.</p>
        </div>
        <div className="faq-list">
          {faqs.map((f, i) => (
            <div key={i} className={`faq-item ${openFaq === i ? "open" : ""}`}>
              <button className="faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                <span>{f.q}</span>
                <span className="faq-icon">{openFaq === i ? "−" : "+"}</span>
              </button>
              {openFaq === i && <div className="faq-answer">{f.a}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta" id="book">
        <div className="cta-content">
          <h2 className="cta-title">هل أنت مستعد للبدء؟</h2>
          <p className="cta-desc">
            لا تتردد في التواصل معنا لأي سؤال، أو احجز جلستك الأولى مباشرةً. نحن هنا لنرافقك في كل خطوة.
          </p>
          <div className="cta-actions">
            <a href="mailto:info@raad-wellness.com" className="btn-primary">احجز جلستك</a>
            <a href="mailto:info@raad-wellness.com" className="btn-outline-light">تواصل معنا</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">مساحة الشفاء</span>
          </div>
          <p className="footer-copy">جميع الحقوق محفوظة © ٢٠٢٦ — ضحى للشفاء بالطاقة</p>
        </div>
      </footer>
    </div>
  );
}
