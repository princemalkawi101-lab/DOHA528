import { MapPin, Video, Crown, ArrowLeft } from 'lucide-react';
import './EventExperienceSection.css';

const vipItems = [
  '🎥 البرنامج مسجل لتتمكن من العودة إلى التجربة في أي وقت.',
  '🎁 كراسة الامتنان هدية خاصة لك.',
  '💫 لقاء Zoom مباشر مع ضحى لمدة ساعة كاملة، مخصص للأسئلة والأجوبة.',
  '🤍 الانضمام إلى جروب خاص لمتابعة التجربة والتواصل',
  'سيبليمنال النجاح .',
];

export default function EventExperienceSection({ onVipOffer }: { onVipOffer?: () => void }) {
  return (
    <section className="evx" aria-labelledby="evx-title" data-testid="section-experience-choice">
      <h2 id="evx-title" className="evx-title">اختر تجربتك في النجاح التجسيد</h2>
      <div className="evx-grid">
        <a href="#register" className="evx-card" data-testid="link-experience-in-person">
          <span className="evx-card-top"><MapPin aria-hidden="true" />الحضور الحضوري | الأردن</span>
          <strong className="evx-price">25 دينار أردني</strong>
          <p>تجربة حضورية مكثفة لمدة 3 ساعات، نفتح فيها معًا احتمالات جديدة للوعي والنجاح والتجسيد.</p>
          <ArrowLeft className="evx-arrow" aria-hidden="true" />
        </a>
        <a href="#register" className="evx-card evx-card-online" data-testid="link-experience-online">
          <span className="evx-card-top"><Video aria-hidden="true" />الحضور أون لاين</span>
          <strong className="evx-price" dir="ltr">30$</strong>
          <p>عِش التجربة من أي مكان في العالم، وكن جزءًا من رحلة الانتقال من عالم الروح إلى عالم المادة.</p>
          <ArrowLeft className="evx-arrow" aria-hidden="true" />
        </a>
      </div>
      <blockquote className="evx-quote">«لا تنهِ التجربة عند انتهاء الورشة… اجعل النجاح رحلة مستمرة.»</blockquote>
      <article className="evx-vip" data-testid="card-vip">
        <i className="evx-vip-ring" aria-hidden="true" />
        <span className="evx-vip-badge"><Crown aria-hidden="true" />✨ مقعد VIP</span>
        <h3>تجربة أعمق مع ضحى</h3>
        <p className="evx-vip-lead">لمن يرغب في التوسع أكثر، واستكمال رحلة النجاح والتجسيد بعد الورشة.</p>
        <p className="evx-vip-label">مقعد VIP يتضمن:</p>
        <ul className="evx-vip-list">
          {vipItems.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
        <p className="evx-vip-close">مساحة إضافية لك، لتفتح احتمالات أوسع وتمنح تجربتك فرصة للاستمرار.</p>
        <div className="evx-vip-action">
          <div>
            <button type="button" className="evx-vip-btn" disabled={!onVipOffer} onClick={onVipOffer} aria-describedby="evx-vip-note" data-testid="button-vip-book">احجز مقعد VIP الآن</button>
            <small id="evx-vip-note" className="evx-vip-note">ترقية اختيارية بعد تسجيل التذكرة الأساسية</small>
          </div>
          <span className="evx-vip-price" data-testid="text-vip-price">السعر <bdi dir="ltr">49$</bdi></span>
        </div>
      </article>
    </section>
  );
}
