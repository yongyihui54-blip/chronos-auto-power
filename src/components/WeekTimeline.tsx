import { motion } from 'framer-motion';
import { AlertTriangle, CalendarDays, Plus } from 'lucide-react';
import { useScheduleStore } from '@/store/scheduleStore';
import { ACTION_LIST, ACTION_META, WEEKDAY_META } from '@/lib/constants';
import { findConflictingRuleIds, rulesOnDay, cn } from '@/lib/utils';
import type { Rule, Schedule, Weekday } from '@/types';
import { ActionIcon } from './ActionIcon';

interface WeekTimelineProps {
  onOpenEditor?: (schedule?: Schedule) => void;
  onSelectRule?: (rule: Rule, schedule: Schedule) => void;
}

/**
 * 周时间编排视图：周一→周日 七列网格。
 * 每列展示当天所有启用计划的规则节点，按时间排序。
 * 同一时刻存在多个动作时显示柔和冲突提示。
 */
export function WeekTimeline({ onOpenEditor, onSelectRule }: WeekTimelineProps) {
  const schedules = useScheduleStore((s) => s.schedules);
  const conflicts = findConflictingRuleIds(schedules);

  const today = new Date();
  const todayDow = ((today.getDay() + 6) % 7 + 1) as Weekday;

  const hasAny = schedules.some((s) => s.enabled && s.rules.length > 0);

  return (
    <section className="glass rounded-2.5xl p-4 shadow-glass">
      {/* 头部 */}
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-accent" strokeWidth={2.4} />
          <h3 className="font-display text-[13px] font-semibold tracking-wide text-ink/80">
            本周时间编排
          </h3>
          <span className="text-[11px] text-ink/40">
            同一时刻多动作将提示冲突
          </span>
        </div>
        {onOpenEditor && (
          <button
            onClick={() => onOpenEditor()}
            className="group flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-accent transition-colors hover:bg-accent/10"
          >
            <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" strokeWidth={2.6} />
            添加规则
          </button>
        )}
      </div>

      {/* 图例 */}
      <div className="mb-3 flex flex-wrap items-center gap-x-3.5 gap-y-1.5 px-1">
        {ACTION_LIST.map((m) => (
          <span key={m.key} className="inline-flex items-center gap-1.5 text-[11px] text-ink/55">
            <span
              className="h-2 w-2 rounded-full"
              style={{ background: `hsl(${m.hue} 80% 58%)` }}
            />
            {m.label}
          </span>
        ))}
      </div>

      {/* 七列网格 */}
      {hasAny ? (
        <div className="grid grid-cols-7 gap-2">
          {WEEKDAY_META.map(({ key, short, full }, i) => (
            <DayColumn
              key={key}
              day={key}
              short={short}
              full={full}
              isToday={key === todayDow}
              items={rulesOnDay(schedules, key)}
              conflicts={conflicts}
              onSelect={onSelectRule}
              delay={i * 0.04}
            />
          ))}
        </div>
      ) : (
        <div className="grid place-items-center py-10 text-[13px] text-ink/45">
          还没有可执行的规则，先启用一个计划或新建规则吧。
        </div>
      )}
    </section>
  );
}

/* ---------------- 单列 ---------------- */
function DayColumn({
  day: _day,
  short,
  full,
  isToday,
  items,
  conflicts,
  onSelect,
  delay,
}: {
  day: Weekday;
  short: string;
  full: string;
  isToday: boolean;
  items: { rule: Rule; schedule: Schedule }[];
  conflicts: Set<string>;
  onSelect?: (rule: Rule, schedule: Schedule) => void;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        'flex min-h-[180px] flex-col rounded-2xl border p-2.5 transition-colors',
        isToday
          ? 'border-accent/40 bg-accent/[0.06]'
          : 'border-ink/8 glass-soft',
      )}
    >
      {/* 列头 */}
      <div className="mb-2.5 flex items-baseline justify-between border-b border-ink/8 pb-2">
        <div className="flex items-baseline gap-1.5">
          <span className="font-display text-[15px] font-bold text-ink">{short}</span>
          <span className="text-[10px] text-ink/40">{full}</span>
        </div>
        {isToday && (
          <span className="rounded-full bg-accent/15 px-1.5 py-px text-[9px] font-semibold text-accent">
            今天
          </span>
        )}
      </div>

      {/* 节点 */}
      <div className="flex flex-1 flex-col gap-1.5">
        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-[11px] text-ink/25">
            —
          </div>
        ) : (
          items.map(({ rule, schedule }, idx) => (
            <TimelineNode
              key={`${schedule.id}-${rule.id}`}
              rule={rule}
              schedule={schedule}
              isConflict={conflicts.has(rule.id)}
              onClick={() => onSelect?.(rule, schedule)}
              delay={delay + idx * 0.03}
            />
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-2 border-t border-ink/8 pt-1.5 text-center text-[9px] text-ink/35">
          {items.length} 项
        </div>
      )}
    </motion.div>
  );
}

/* ---------------- 单个节点 ---------------- */
function TimelineNode({
  rule,
  schedule,
  isConflict,
  onClick,
  delay,
}: {
  rule: Rule;
  schedule: Schedule;
  isConflict: boolean;
  onClick: () => void;
  delay: number;
}) {
  const meta = ACTION_META[rule.action];
  const disabled = !schedule.enabled;

  return (
    <motion.button
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.25 }}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      title={`${schedule.name} · ${formatRulePreview(rule)}`}
      className={cn(
        'group relative flex items-center gap-2 rounded-xl border px-2 py-1.5 text-left transition-colors',
        disabled && 'opacity-45',
        isConflict
          ? 'border-amber-400/50 bg-amber-400/10'
          : 'border-transparent hover:border-ink/15',
      )}
      style={
        isConflict
          ? undefined
          : { background: `hsl(${meta.hue} 80% 58% / 0.12)` }
      }
    >
      {/* 动作色点 */}
      <span
        className="grid h-5 w-5 shrink-0 place-items-center rounded-lg text-white"
        style={{ background: `hsl(${meta.hue} 80% 58%)` }}
      >
        <ActionIcon name={meta.icon} className="h-3 w-3" strokeWidth={2.6} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="tabular block text-[12px] font-semibold leading-tight text-ink">
          {rule.time}
        </span>
        <span className="block truncate text-[10px] leading-tight text-ink/50">
          {meta.short}
        </span>
      </span>

      {isConflict && (
        <motion.span
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-amber-400/80 text-white"
        >
          <AlertTriangle className="h-2.5 w-2.5" strokeWidth={3} />
        </motion.span>
      )}
    </motion.button>
  );
}

function formatRulePreview(rule: Rule): string {
  const meta = ACTION_META[rule.action];
  return `${meta.label} ${rule.time}`;
}
