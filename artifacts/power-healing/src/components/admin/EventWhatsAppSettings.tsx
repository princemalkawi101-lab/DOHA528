import { useCallback, useEffect, useState } from 'react';
import type { EventWhatsAppSettings as Settings } from '@workspace/api-client-react';
import { eventRequest } from '@/lib/eventRegistrations';

export function EventWhatsAppSettings() {
  const [draft, setDraft] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true); setError(''); setSaved(false);
    try {
      const result = await eventRequest<{ whatsapp: Settings }>({ action: 'get-private-email-settings' }, { signal });
      if (!signal?.aborted) setDraft(result.whatsapp);
    } catch (cause) {
      if (!signal?.aborted) setError(cause instanceof Error ? cause.message : 'تعذّر تحميل إعدادات واتساب.');
    } finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);
  const patch = (values: Partial<Settings>) => {
    setDraft(current => current ? { ...current, ...values } : current);
    setSaved(false); setError('');
  };
  const save = async () => {
    if (!draft || busy) return;
    setBusy(true); setError(''); setSaved(false);
    try {
      const result = await eventRequest<{ whatsapp: Settings }>({ action: 'save-private-email-settings', whatsapp: draft });
      setDraft(result.whatsapp); setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذّر حفظ إعدادات واتساب.');
    } finally { setBusy(false); }
  };
  return <section className="mt-6 min-w-0 break-words border-t border-white/15 pt-5" data-testid="event-whatsapp-settings" aria-labelledby="event-whatsapp-title">
    <h3 id="event-whatsapp-title" className="font-bold text-white">دعوة واتساب الخاصة للحضور الحضوري</h3>
    <p className="mt-2 text-sm text-white/70">هذه الإعدادات خاصة ولا تظهر لزوار الموقع. تصل الدعوة في إيميل الحضوري فقط بعد قبول الوصل، ولا تُرسل للأونلاين. حفظ التعديل لا يعيد إرسال الرسائل السابقة.</p>
    {loading ? <p role="status" className="mt-3 text-white">جارٍ تحميل إعدادات واتساب…</p> : draft && <fieldset disabled={busy} className="mt-4 grid min-w-0 gap-4">
      <label className="flex items-center gap-2 text-sm text-white">
        <input type="checkbox" checked={draft.enabled} onChange={event => patch({ enabled: event.target.checked })} data-testid="checkbox-event-whatsapp-enabled" />
        إضافة دعوة واتساب إلى رسائل تأكيد الحضور الحضوري
      </label>
      <label className="text-sm text-white">رابط قناة أو دعوة مجموعة واتساب
        <input type="url" dir="ltr" className="adm-input" value={draft.url} maxLength={2048} placeholder="https://whatsapp.com/channel/…" onChange={event => patch({ url: event.target.value })} data-testid="input-event-whatsapp-url" />
      </label>
      <label className="text-sm text-white">نص الدعوة في الإيميل
        <textarea className="adm-input" rows={3} maxLength={1200} value={draft.invitation} onChange={event => patch({ invitation: event.target.value })} data-testid="input-event-whatsapp-invitation" />
      </label>
      <label className="text-sm text-white">نص زر الانضمام
        <input className="adm-input" maxLength={80} value={draft.buttonLabel} onChange={event => patch({ buttonLabel: event.target.value })} data-testid="input-event-whatsapp-label" />
      </label>
      <button type="button" onClick={save} className="rounded-lg bg-emerald-700 px-4 py-2 font-bold text-white disabled:opacity-50" data-testid="button-save-event-whatsapp">{busy ? 'جارٍ الحفظ…' : 'حفظ دعوة واتساب الخاصة'}</button>
    </fieldset>}
    {saved && <p role="status" className="mt-3 text-emerald-200" data-testid="event-whatsapp-saved">تم حفظ دعوة واتساب الخاصة. ستُستخدم في رسائل تأكيد الحضور الحضوري القادمة فقط.</p>}
    {error && <p role="alert" className="mt-3 text-red-200">{error}</p>}
    <button type="button" disabled={loading || busy} onClick={() => {
      if (!draft || window.confirm('إعادة التحميل ستستبدل التعديلات غير المحفوظة. هل تريد المتابعة؟')) void load();
    }} className="mt-3 text-sm text-amber-200 underline disabled:opacity-50" data-testid="button-reload-event-whatsapp">إعادة تحميل الإعدادات المحفوظة</button>
  </section>;
}
