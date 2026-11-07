const KEY = 'power-healing-event-guest';
const HISTORY_KEY = 'power-healing-event-booking-sessions';
const validToken = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

export function savedBookingSessions(): string[] {
  try {
    const entries: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(entries) ? entries.filter(validToken) : [];
  } catch { return []; }
}

// Retain the old capability so a new booking never loses access to its receipt,
// approval status, payment recovery, or VIP upgrade.
export function selectBookingSession(token?: string): void {
  const current = guestAuthorization().slice(6);
  const history = [...new Set([...savedBookingSessions(), current])];
  if (token && !history.includes(token)) throw new Error('الحجز السابق غير موجود في هذا المتصفح.');
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  const next = token || Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
  localStorage.setItem(KEY, next);
}

export function guestAuthorization(): string {
  try {
    let token = localStorage.getItem(KEY);
    if (!token || !/^[a-f0-9]{64}$/.test(token)) {
      token = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(KEY, token);
    }
    return `Guest ${token}`;
  } catch {
    throw new Error('لإكمال الحجز بدون حساب، يرجى السماح بتخزين بيانات الموقع في المتصفح ثم إعادة المحاولة.');
  }
}
