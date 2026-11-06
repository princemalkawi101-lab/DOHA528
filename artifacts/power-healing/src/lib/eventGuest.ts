const KEY = 'power-healing-event-guest';

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
