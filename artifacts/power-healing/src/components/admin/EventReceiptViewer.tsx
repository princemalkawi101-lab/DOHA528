import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';

export function EventReceiptViewer({ receipt, name }: { receipt: string; name: string }) {
  // Never navigate to a top-level data: URL; mobile browsers block that.
  // The private receipt stays in the authenticated page and in the dialog.
  return <Dialog>
    <DialogTrigger asChild>
      <button type="button" className="shrink-0 text-start text-sm text-[hsl(var(--g300))] underline" aria-label={`عرض إيصال CliQ — ${name}`}>
        <img src={receipt} alt="" className="mb-2 h-32 w-32 rounded-lg bg-white object-contain" loading="lazy" />
        عرض إيصال CliQ
      </button>
    </DialogTrigger>
    <DialogContent className="max-h-[92dvh] w-[calc(100%-2rem)] max-w-4xl overflow-y-auto border-white/20 bg-[#1e0e38] text-white" dir="rtl">
      <DialogTitle className="ps-6">إيصال CliQ — {name}</DialogTitle>
      <DialogDescription className="text-white/70">يمكنك تكبير الصورة على جهازك أو تنزيل نسخة للمراجعة.</DialogDescription>
      <img src={receipt} alt={`صورة إيصال CliQ — ${name}`} className="max-h-[70dvh] w-full rounded-lg bg-white object-contain" data-testid="event-receipt-full" />
      <a href={receipt} download="cliq-receipt.jpg" className="rounded-lg bg-emerald-700 px-4 py-2 text-center font-bold text-white">تنزيل صورة الوصل</a>
    </DialogContent>
  </Dialog>;
}
