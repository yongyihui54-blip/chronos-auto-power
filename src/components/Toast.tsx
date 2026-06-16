import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';
import type { ToastItem } from '@/types';

const ICON = {
  success: CheckCircle2,
  info: Info,
  error: XCircle,
} as const;

const TONE = {
  success: 'text-emerald-500',
  info: 'text-sky-500',
  error: 'text-red-500',
} as const;

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const Icon = ICON[toast.tone];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="glass shadow-glass-lg pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-2xl px-4 py-2.5"
    >
      <Icon className={`h-4 w-4 shrink-0 ${TONE[toast.tone]}`} strokeWidth={2.4} />
      <span className="text-[13px] font-medium text-ink">{toast.message}</span>
      <button
        onClick={onClose}
        className="ml-1 grid h-5 w-5 place-items-center rounded-md text-ink/40 transition-colors hover:bg-ink/10 hover:text-ink"
      >
        <X className="h-3 w-3" />
      </button>
    </motion.div>
  );
}
