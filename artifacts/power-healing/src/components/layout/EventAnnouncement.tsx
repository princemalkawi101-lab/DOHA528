import { Link } from 'wouter';
import { useEffect, useState } from 'react';
import { DEFAULT_EVENT_SETTINGS, subscribeSiteSettings } from '@/lib/siteSettings';

export function EventAnnouncement() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    return subscribeSiteSettings((settings) => {
      const event = { ...DEFAULT_EVENT_SETTINGS, ...settings.event };
      setVisible(event.enabled && event.announcementEnabled);
    }, (error) => {
      console.error('Could not load the event announcement settings', error);
      setVisible(false);
    });
  }, []);
  if (!visible) return null;
  return (
    <aside dir="rtl" aria-label="إعلان ورشة تجسيد النجاح" data-testid="event-announcement" className="mt-[68px] border-b border-[#d4a017]/50 bg-gradient-to-r from-[#d4a017] via-[#f2cf76] to-[#d4a017] px-5 py-4 text-[#103b2c]">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-right">
        <div>
          <p className="text-lg font-black">ورشة تجسيد النجاح مع Master Doha Malkawi</p>
          <p className="mt-1 text-sm font-bold">عمّان · زيزفون · السبت 21 نوفمبر 2026</p>
        </div>
        <Link href="/event" className="inline-flex shrink-0 items-center justify-center gap-3 rounded-lg bg-[#103b2c] px-6 py-3 text-sm font-black text-[#fff9eb] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#103b2c]" data-testid="link-event-announcement">
          أريد حجز مكاني <span aria-hidden>←</span>
        </Link>
      </div>
    </aside>
  );
}
