export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'telegram'
  | 'whatsapp'
  | 'youtube'
  | 'tiktok'
  | 'x'
  | 'linkedin'
  | 'snapchat'
  | 'website'
  | 'custom';

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  labelAr: string;
  labelEn: string;
  destination: string;
  order: number;
  active: boolean;
}

export const SOCIAL_PLATFORM_OPTIONS: Array<{
  value: SocialPlatform;
  labelAr: string;
  labelEn: string;
}> = [
  { value: 'instagram', labelAr: 'إنستغرام', labelEn: 'Instagram' },
  { value: 'facebook', labelAr: 'فيسبوك', labelEn: 'Facebook' },
  { value: 'telegram', labelAr: 'تيليجرام', labelEn: 'Telegram' },
  { value: 'whatsapp', labelAr: 'واتساب', labelEn: 'WhatsApp' },
  { value: 'youtube', labelAr: 'يوتيوب', labelEn: 'YouTube' },
  { value: 'tiktok', labelAr: 'تيك توك', labelEn: 'TikTok' },
  { value: 'x', labelAr: 'إكس (تويتر)', labelEn: 'X (Twitter)' },
  { value: 'linkedin', labelAr: 'لينكدإن', labelEn: 'LinkedIn' },
  { value: 'snapchat', labelAr: 'سناب شات', labelEn: 'Snapchat' },
  { value: 'website', labelAr: 'الموقع الإلكتروني', labelEn: 'Website' },
  { value: 'custom', labelAr: 'منصة أخرى', labelEn: 'Other Platform' },
];

export const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'contact-instagram',
    platform: 'instagram',
    labelAr: 'إنستغرام',
    labelEn: 'Instagram',
    destination: 'https://www.instagram.com/doham528?igsh=OWQ0ODVjZmgzN2Qx',
    order: 0,
    active: true,
  },
  {
    id: 'contact-telegram',
    platform: 'telegram',
    labelAr: 'تيليجرام',
    labelEn: 'Telegram',
    destination: 'https://t.me/dohamalkawi528',
    order: 1,
    active: true,
  },
  {
    id: 'contact-whatsapp',
    platform: 'whatsapp',
    labelAr: 'واتساب',
    labelEn: 'WhatsApp',
    destination: 'https://wa.me/qr/MZLIT6ZFXNXQA1',
    order: 2,
    active: true,
  },
];

const SOCIAL_PLATFORMS = new Set<SocialPlatform>(SOCIAL_PLATFORM_OPTIONS.map((option) => option.value));

const PLATFORM_HOSTS: Partial<Record<SocialPlatform, string[]>> = {
  instagram: ['instagram.com'],
  facebook: ['facebook.com', 'fb.com'],
  youtube: ['youtube.com', 'youtu.be'],
  tiktok: ['tiktok.com'],
  x: ['x.com', 'twitter.com'],
  linkedin: ['linkedin.com'],
  snapchat: ['snapchat.com'],
};

export function isSocialPlatform(value: unknown): value is SocialPlatform {
  return typeof value === 'string' && SOCIAL_PLATFORMS.has(value as SocialPlatform);
}

export function platformDefaults(platform: SocialPlatform) {
  return SOCIAL_PLATFORM_OPTIONS.find((option) => option.value === platform)
    ?? SOCIAL_PLATFORM_OPTIONS[SOCIAL_PLATFORM_OPTIONS.length - 1];
}

export function newSocialLinkTemplate(order: number): SocialLink {
  const defaults = platformDefaults('instagram');
  return {
    id: `social-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    platform: 'instagram',
    labelAr: defaults.labelAr,
    labelEn: defaults.labelEn,
    destination: '',
    order,
    active: true,
  };
}

function parseHttpsUrl(rawValue: string): URL | null {
  const candidate = /^https?:\/\//i.test(rawValue) ? rawValue : `https://${rawValue}`;
  try {
    const url = new URL(candidate);
    if (url.username || url.password) return null;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    url.protocol = 'https:';
    return url;
  } catch {
    return null;
  }
}

function matchesHost(hostname: string, allowedHosts: string[]) {
  const normalizedHost = hostname.toLowerCase().replace(/^www\./, '');
  return allowedHosts.some((host) => normalizedHost === host || normalizedHost.endsWith(`.${host}`));
}

function normalizeWhatsAppDigits(rawValue: string): string | null {
  let digits = rawValue.replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  return /^[1-9]\d{6,14}$/.test(digits) ? digits : null;
}

export function normalizeSocialDestination(platform: SocialPlatform, rawDestination: string): string | null {
  const value = rawDestination.trim();
  if (!value || !isSocialPlatform(platform)) return null;

  if (platform === 'whatsapp' && !/^https?:\/\//i.test(value)) {
    if (!/^[+\d\s().-]+$/.test(value)) return null;
    const digits = normalizeWhatsAppDigits(value);
    return digits ? `https://wa.me/${digits}` : null;
  }

  if (platform === 'telegram' && !/^https?:\/\//i.test(value)) {
    const username = value.replace(/^@/, '').trim();
    return /^[a-zA-Z0-9_]{5,32}$/.test(username) ? `https://t.me/${username}` : null;
  }

  const url = parseHttpsUrl(value);
  if (!url) return null;

  if (platform === 'whatsapp') {
    if (!matchesHost(url.hostname, ['wa.me', 'whatsapp.com'])) return null;
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts[0]?.toLowerCase() === 'qr' && /^[a-zA-Z0-9_-]{6,100}$/.test(pathParts[1] ?? '')) {
      return `https://wa.me/qr/${pathParts[1]}`;
    }
    const pathDigits = url.pathname.replace(/\D/g, '');
    const queryDigits = (url.searchParams.get('phone') ?? '').replace(/\D/g, '');
    const digits = normalizeWhatsAppDigits(pathDigits || queryDigits);
    return digits ? `https://wa.me/${digits}` : null;
  }

  if (platform === 'telegram') {
    if (!matchesHost(url.hostname, ['t.me', 'telegram.me'])) return null;
    const destination = url.pathname.split('/').filter(Boolean)[0] ?? '';
    return /^[a-zA-Z0-9_+\-]{5,}$/.test(destination) ? `https://t.me/${destination}` : null;
  }

  const allowedHosts = PLATFORM_HOSTS[platform];
  if (allowedHosts && !matchesHost(url.hostname, allowedHosts)) return null;
  return url.toString();
}

export function sanitizeSocialLinks(value: unknown): SocialLink[] {
  if (!Array.isArray(value)) return [];

  return value.slice(0, 5).flatMap((entry, index) => {
    if (!entry || typeof entry !== 'object') return [];
    const candidate = entry as Partial<SocialLink>;
    if (
      typeof candidate.id !== 'string'
      || !candidate.id.trim()
      || !isSocialPlatform(candidate.platform)
      || typeof candidate.labelAr !== 'string'
      || typeof candidate.labelEn !== 'string'
      || typeof candidate.destination !== 'string'
    ) return [];

    return [{
      id: candidate.id.trim(),
      platform: candidate.platform,
      labelAr: candidate.labelAr.trim(),
      labelEn: candidate.labelEn.trim(),
      destination: candidate.destination.trim(),
      order: Number.isFinite(candidate.order) ? Number(candidate.order) : index,
      active: candidate.active !== false,
    }];
  }).sort((a, b) => a.order - b.order);
}

export function socialLinksOrDefaults(value: unknown): SocialLink[] {
  return value === undefined
    ? DEFAULT_SOCIAL_LINKS.map((link) => ({ ...link }))
    : sanitizeSocialLinks(value);
}
