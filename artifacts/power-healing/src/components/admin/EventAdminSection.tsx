import type { ReactNode } from 'react';

export function EventAdminSection({ title, children, open = false, id }: {
  title: string; children: ReactNode; open?: boolean; id: string;
}) {
  return <details open={open} className="group mb-5 overflow-hidden rounded-2xl border border-amber-300/20 bg-[rgba(30,14,56,0.75)]" data-testid={id}>
    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 font-black text-white marker:hidden [&::-webkit-details-marker]:hidden">
      <h2 className="text-base sm:text-lg">{title}</h2>
      <span aria-hidden="true" className="shrink-0 text-xl text-amber-200 transition-transform group-open:rotate-180">⌄</span>
    </summary>
    <div className="border-t border-white/10 p-4 sm:p-6">{children}</div>
  </details>;
}
