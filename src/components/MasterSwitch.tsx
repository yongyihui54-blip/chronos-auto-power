import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { Power } from 'lucide-react';
import { useScheduleStore } from '@/store/scheduleStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';
import { formatCountdown, formatNextRun, nextRunAcross } from '@/lib/utils';
import { Toggle } from './Toggle';

/**
 * 总开关卡片 —— 整个 APP 的视觉锚点。
 * 启用时强调色光晕、下次执行预览、实时倒计时。
 */
export function MasterSwitch() {
  const schedules = useScheduleStore((s) => s.schedules);
  const master = useSettingsStore((s) => s.masterEnabled);
  const setMaster = useSettingsStore((s) => s.setMaster);
  const push = useToastStore((s) => s.push);

  const enabledSchedules = schedules.filter((s) => s.enabled);

  const next = useMemo(
    () => (master ? nextRunAcross(enabledSchedules) : null),
    [enabledSchedules, master],
  );

  // 找到 next 对应的计划与规则，用于文案
  const nextSchedule = next
    ? enabledSchedules.find((s) => s.id === next.scheduleId)
    : null;
  const nextRule =
    nextSchedule && next
      ? nextSchedule.rules.find((r) => r.id === next.ruleId)
      : null;

  const toggle = async () => {
    const v = !master;
    setMaster(v);
    push(v ? '已开启定时模式' : '已关闭定时模式', v ? 'success' : 'info');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18 }}
      className="glass relative overflow-hidden rounded-2.5xl p-6 shadow-glass-lg"
    >
      {/* 启用时的光晕 */}
      <AnimatePresence>
        {master && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl"
            style={{
              background:
                'radial-gradient(closest-side, rgb(var(--accent) / 0.55), transparent)',
            }}
          />
        )}
      </AnimatePresence>

      <div className="relative flex items-center justify-between gap-6">
        {/* 左：状态信息 */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Power
              className={`h-4 w-4 ${master ? 'text-accent' : 'text-ink/40'}`}
              strokeWidth={2.6}
            />
            <h2 className="font-display text-base font-semibold text-ink">
              定时模式
            </h2>
            <StatusPill on={master} />
          </div>

          <AnimatePresence mode="wait">
            {master && next && nextRule ? (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-3"
              >
                <p className="text-[12px] text-ink/50">下次执行</p>
                <p className="tabular mt-0.5 text-2xl font-semibold text-ink">
                  {formatNextRun(next.at, nextRule.action)}
                </p>
                <CountdownBadge target={next.at} />
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="mt-3"
              >
                <p className="text-[13px] text-ink/55">
                  {master
                    ? enabledSchedules.length > 0
                      ? '已开启，但没有启用的计划。'
                      : '已开启，请在下方添加计划。'
                    : '已关闭。开启后将按计划自动执行开关机。'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 右：大开关 */}
        <Toggle checked={master} onChange={toggle} size="lg" />
      </div>
    </motion.div>
  );
}

function StatusPill({ on }: { on: boolean }) {
  return (
    <span
      className={
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ' +
        (on
          ? 'bg-accent/15 text-accent'
          : 'bg-ink/8 text-ink/50')
      }
    >
      <motion.span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: 'currentColor' }}
        animate={on ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
        transition={on ? { duration: 2, repeat: Infinity } : undefined}
      />
      {on ? '运行中' : '已停用'}
    </span>
  );
}

function CountdownBadge({ target }: { target: Date }) {
  // 每分钟刷新一次倒计时
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-medium text-accent">
      <span className="h-1 w-1 rounded-full bg-accent" />
      {formatCountdown(target)}
    </span>
  );
}
