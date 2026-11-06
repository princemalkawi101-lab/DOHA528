import type { EventRegistration } from './eventRegistrations';

export type EventExportSelection = 'approved-standard' | 'verified-vip' | 'pending-cliq';

export function selectEventExportEntries(
  entries: readonly EventRegistration[],
  selection: EventExportSelection,
): EventRegistration[] {
  switch (selection) {
    case 'approved-standard':
      return entries.filter((entry) => entry.status === 'approved'
        && (entry.membershipStatus === 'Standard' || entry.membershipStatus == null));
    case 'verified-vip':
      // Only the server's verified membership flag grants VIP membership.
      // VIP payment does not approve a pending/rejected base ticket.
      return entries.filter((entry) => entry.membershipStatus === 'VIP Member');
    case 'pending-cliq':
      return entries.filter((entry) => entry.status === 'pending' && entry.paymentMethod === 'cliq');
    default:
      throw new Error('Unknown event export selection');
  }
}

function csvCell(value: string | undefined): string {
  const text = value ?? '';
  // Quoting alone does not prevent spreadsheet formulas. Check past leading
  // whitespace/control characters, including tabs, newlines, and Unicode spaces.
  const safe = /^[\s\u0000-\u001f\u007f]*[=+\-@]/u.test(text)
    || /^[\t\r\n]/u.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildEventRegistrationCsv(
  entries: readonly EventRegistration[],
  selection: EventExportSelection,
): string {
  const rows = [
    ['Registration reference', 'Name', 'Phone', 'Email', 'Attendance', 'Base ticket status', 'Membership status'],
    ...selectEventExportEntries(entries, selection).map((entry) => [
      entry.id, entry.name, entry.phone, entry.email, entry.attendance,
      entry.status, entry.membershipStatus ?? 'Standard',
    ]),
  ];
  // UTF-8 BOM keeps Arabic readable when the CSV is opened in Excel.
  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

export function downloadEventRegistrationCsv(
  entries: readonly EventRegistration[],
  selection: EventExportSelection,
): void {
  const blob = new Blob([buildEventRegistrationCsv(entries, selection)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `event-${selection}-${new Date().toISOString().slice(0, 10)}.csv`;
  try {
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    // Give the browser time to begin downloading before releasing the URL.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
