import type { EventRegistration } from './eventRegistrations';

export function arrivalDate(entry: EventRegistration): Date | null {
  const value = entry.arrivedAt;
  const date = typeof value === 'string' ? new Date(value) : value?.toDate?.();
  return date && Number.isFinite(date.getTime()) ? date : null;
}

export function searchEventRegistrations(entries: readonly EventRegistration[], search: string): EventRegistration[] {
  const term = search.trim().toLocaleLowerCase();
  if (!term) return [...entries];
  const phoneTerm = term.replace(/[\s()+.-]/g, '');
  return entries.filter((entry) =>
    [entry.id, entry.name, entry.phone, entry.email ?? ''].some((value) => value.toLocaleLowerCase().includes(term))
    || (phoneTerm.length > 0 && entry.phone.replace(/[\s()+.-]/g, '').includes(phoneTerm)));
}
