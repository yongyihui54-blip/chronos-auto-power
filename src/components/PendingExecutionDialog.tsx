import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Clock3, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  cancelPendingExecution,
  onPendingCleared,
  onPendingExecution,
  runPendingExecutionNow,
  type PendingExecutionEvent,
} from '@/lib/mock';
import { useToastStore } from '@/store/toastStore';

export function PendingExecutionDialog() {
  const [pending, setPending] = useState<PendingExecutionEvent | null>(null);
  const [now, setNow] = useState(Date.now());
  const push = useToastStore((s) => s.push);

  useEffect(() => {
    const offPending = onPendingExecution((event) => {
      setPending(event);
      setNow(Date.now());
    });
    const offCleared = onPendingCleared((event) => {
      setPending((current) => (current?.id === event.id ? null : current));
      if (event.reason === 'cancelled') {
        push('已取消本次执行', 'info');
      }
      if (event.reason === 'skipped' && event.message) {
        push(event.message, 'error');
      }
    });

    return () => {
      offPending();
      offCleared();
    };
  }, [push]);

  useEffect(() => {
    if (!pending) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [pending]);

  const remainingMs = pending
    ? Math.max(0, new Date(pending.scheduledAt).getTime() - now)
    : 0;
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const scheduledTime = useMemo(() => {
    if (!pending) return '';
    return new Date(pending.scheduledAt).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }, [pending]);

  const cancel = async () => {
    if (!pending) return;
    try {
      await cancelPendingExecution(pending.id);
    } catch (error) {
      push(error instanceof Error ? error.message : '取消失败', 'error');
    }
  };

  const runNow = async () => {
    if (!pending) return;
    try {
      await runPendingExecutionNow(pending.id);
    } catch (error) {
      push(error instanceof Error ? error.message : '立即执行失败', 'error');
    }
  };

  return (
    <AnimatePresence>
      {pending && (
        <motion.div
          className="fixed inset-0 z-[60] grid place-items-center p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/35 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="glass relative w-full max-w-[340px] rounded-2xl p-5 shadow-glass-lg"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-500/12 text-red-500">
                <AlertTriangle className="h-5 w-5" strokeWidth={2.4} />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-ink">
                  {scheduledTime} 将{pending.actionLabel}
                </p>
                <p className="mt-1 truncate text-[12px] text-ink/50">
                  {pending.scheduleName}
                </p>
              </div>
            </div>

            <div className="my-5 grid place-items-center">
              <div className="grid h-24 w-24 place-items-center rounded-full border border-red-500/20 bg-red-500/8">
                <div className="text-center">
                  <p className="tabular text-3xl font-semibold text-red-500">
                    {remainingSeconds}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-red-500/75">秒</p>
                </div>
              </div>
            </div>

            <div className="mb-4 flex items-center justify-center gap-1.5 text-[12px] text-ink/50">
              <Clock3 className="h-3.5 w-3.5" />
              <span>到点自动执行</span>
            </div>

            <div className="grid grid-cols-[1fr_1fr] gap-2">
              <button
                type="button"
                onClick={cancel}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-[13px] font-medium text-ink/60 transition-colors hover:bg-ink/8 hover:text-ink"
              >
                <X className="h-3.5 w-3.5" />
                取消本次
              </button>
              <button
                type="button"
                onClick={runNow}
                className="rounded-xl bg-red-500 px-4 py-2 text-[13px] font-semibold text-white shadow-[0_12px_30px_rgba(239,68,68,0.24)] transition-colors hover:bg-red-400"
              >
                立即执行
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
