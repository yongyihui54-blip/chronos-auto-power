import { AnimatePresence, motion } from 'framer-motion';
import { Lock, LogOut, Moon, Power, RefreshCw, Snowflake, ZapOff } from 'lucide-react';
import { useState } from 'react';
import { useScheduleStore } from '@/store/scheduleStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';
import { executeAction } from '@/lib/mock';
import { ACTION_META } from '@/lib/constants';
import type { ActionType } from '@/types';

const QUICK: { action: ActionType; Icon: typeof Power }[] = [
  { action: 'shutdown', Icon: Power },
  { action: 'restart', Icon: RefreshCw },
  { action: 'sleep', Icon: Moon },
  { action: 'hibernate', Icon: Snowflake },
  { action: 'lock', Icon: Lock },
  { action: 'logoff', Icon: LogOut },
];

type PendingAction = ActionType | 'disableAll';

export function QuickActions() {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const push = useToastStore((s) => s.push);
  const master = useSettingsStore((s) => s.masterEnabled);
  const setMaster = useSettingsStore((s) => s.setMaster);
  const disableAllSchedules = useScheduleStore((s) => s.disableAllSchedules);
  const hasEnabledSchedules = useScheduleStore((s) =>
    s.schedules.some((schedule) => schedule.enabled),
  );

  const confirmText =
    pendingAction === 'disableAll'
      ? '是否要停用所有计划'
      : pendingAction
        ? `是否要发起${ACTION_META[pendingAction].label}`
        : '';

  const confirmPendingAction = async () => {
    if (!pendingAction) return;

    try {
      if (pendingAction === 'disableAll') {
        disableAllSchedules();
        setMaster(false);
        push('已停用全部定时计划', 'info');
      } else {
        await executeAction(pendingAction);
        push(`已发起：${ACTION_META[pendingAction].label}`, 'info');
      }
    } catch (error) {
      push(error instanceof Error ? error.message : '操作失败', 'error');
    }

    setPendingAction(null);
  };

  return (
    <>
      <section className="glass rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-[13px] font-semibold tracking-wide text-ink/80">
            快速操作
          </h3>
          <span className="text-[11px] text-ink/40">立即执行</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {QUICK.map(({ action, Icon }, i) => (
            <QuickButton
              key={action}
              label={ACTION_META[action].label}
              Icon={Icon}
              index={i}
              onClick={() => setPendingAction(action)}
            />
          ))}
          <QuickButton
            label="全部停用"
            Icon={ZapOff}
            index={QUICK.length}
            danger
            disabled={!master && !hasEnabledSchedules}
            onClick={() => setPendingAction('disableAll')}
          />
        </div>
      </section>

      <AnimatePresence>
        {pendingAction && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              aria-label="关闭确认"
              className="absolute inset-0 bg-black/25 backdrop-blur-sm"
              onClick={() => setPendingAction(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 6 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="glass relative w-full max-w-[280px] rounded-2xl p-5 shadow-glass-lg"
            >
              <p className="text-center text-[15px] font-semibold text-ink">
                {confirmText}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPendingAction(null)}
                  className="rounded-xl px-4 py-2 text-[13px] font-medium text-ink/60 transition-colors hover:bg-ink/8 hover:text-ink"
                >
                  否
                </button>
                <button
                  type="button"
                  onClick={confirmPendingAction}
                  className="rounded-xl bg-red-500 px-4 py-2 text-[13px] font-semibold text-white shadow-[0_12px_30px_rgba(239,68,68,0.24)] transition-colors hover:bg-red-400"
                >
                  是
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function QuickButton({
  label,
  Icon,
  index,
  onClick,
  danger,
  disabled,
}: {
  label: string;
  Icon: typeof Power;
  index: number;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      whileHover={!disabled ? { y: -2 } : undefined}
      whileTap={!disabled ? { scale: 0.95 } : undefined}
      onClick={onClick}
      disabled={disabled}
      className={
        'flex flex-col items-center gap-1.5 rounded-xl border py-3 transition-all ' +
        (disabled
          ? 'border-transparent text-ink/25'
          : danger
            ? 'border-red-500/20 bg-red-500/8 text-red-500 hover:bg-red-500/14'
            : 'border-ink/8 glass-soft text-ink/70 hover:text-accent')
      }
    >
      <Icon className="h-4 w-4" strokeWidth={2.4} />
      <span className="text-[11px] font-medium">{label}</span>
    </motion.button>
  );
}
