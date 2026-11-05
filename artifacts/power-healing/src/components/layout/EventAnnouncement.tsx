import { Link } from 'wouter';
import { useEffect, useState } from 'react';
import { fetchSiteSettings } from '@/lib/siteSettings';

export function EventAnnouncement() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    fetchSiteSettings().then((settings) => {
      setVisible(settings.event?.enabled !== false && settings.event?.announcementEnabled === true);
    });
  }, []);
  if (!visible) return null;
  return (
    <Link href="/event" className="mt-[68px] flex items-center justify-center gap-2 bg-gradient-to-r from-[#d4a017] via-[#f2cf76] to-[#d4a017] px-4 py-2 text-center text-sm font-black text-[#103b2c] transition-opacity hover:opacity-90">
      تجسيد النجاح في عمّان · السبت 21 نوفمبر · احجزي مقعدك
      <span aria-hidden>←</span>
    </Link>
  );
}
