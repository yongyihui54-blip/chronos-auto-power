import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { useScheduleStore } from '@/store/scheduleStore';
import { useToastStore } from '@/store/toastStore';
import { ACTION_META, WEEKDAY_META } from '@/lib/constants';
import { cn, formatRule, uid } from '@/lib/utils';
import type { ActionType, Rule, Schedule, Weekday } from '@/types';
import { ActionPicker } from './ActionPicker';
import { TimePicker } from './TimePicker';
import { WeekdayPicker } from './WeekdayPicker';

interface ScheduleEditorProps {
  schedule: Schedule | null; // null = 新建
  open: boolean;
  targetRuleId?: string | null;
  onClose: () => void;
}

/** 新建一条默认规则 */
function newRule(): Rule {
  return {
    id: uid(),
    action: 'shutdown',
    time: '23:00',
    weekdays: [1, 2, 3, 4, 5],
  };
}

function initialRules(schedule: Schedule | null): Rule[] {
  return schedule?.rules.length ? schedule.rules : [newRule()];
}

function initialName(schedule: Schedule | null): string {
  return schedule?.name ?? '';
}

export function ScheduleEditor({ schedule, open, targetRuleId, onClose }: ScheduleEditorProps) {
  const add = useScheduleStore((s) => s.addSchedule);
  const update = useScheduleStore((s) => s.updateSchedule);
  const push = useToastStore((s) => s.push);

  const [name, setName] = useState(() => initialName(schedule));
  const [rules, setRules] = useState<Rule[]>(() => initialRules(schedule));
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const ruleRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const targetRuleReady = !targetRuleId || rules.some((rule) => rule.id === targetRuleId);

  // 打开时同步
  useLayoutEffect(() => {
    if (!open) return;
    if (schedule) {
      setName(schedule.name);
      setRules(initialRules(schedule));
    } else {
      setName(initialName(schedule));
      setRules(initialRules(schedule));
    }
  }, [open, schedule]);

  useEffect(() => {
    if (!open || !targetRuleReady) return;

    const frame = window.requestAnimationFrame(() => {
      const scroller = bodyRef.current;
      if (!scroller) return;

      if (!targetRuleId) {
        scroller.scrollTop = 0;
        return;
      }

      const target = ruleRefs.current[targetRuleId];
      if (!target) return;

      const scrollTop =
        target.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top +
        scroller.scrollTop -
        8;

      scroller.scrollTo({ top: Math.max(0, scrollTop), behavior: 'auto' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, targetRuleId, targetRuleReady, schedule?.id]);

  // 规则操作（本地 state，保存时一次性写回 store）
  const patchRule = (ruleId: string, patch: Partial<Omit<Rule, 'id'>>) =>
    setRules((rs) => rs.map((r) => (r.id === ruleId ? { ...r, ...patch } : r)));
  const removeRule = (ruleId: string) =>
    setRules((rs) => (rs.length > 1 ? rs.filter((r) => r.id !== ruleId) : rs));
  const addRule = () => setRules((rs) => [...rs, newRule()]);

  const save = () => {
    const trimmed = name.trim();
    const finalName = trimmed || defaultName(rules);

    if (schedule) {
      update(schedule.id, { name: finalName, rules });
      push('计划已更新', 'success');
    } else {
      add({ enabled: true, name: finalName, rules });
      push('组合计划已创建', 'success');
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 grid place-items-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 背景遮罩 */}
          <motion.div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            className="glass relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-3xl shadow-glass-lg"
          >
            {/* 标题 */}
            <div className="flex items-center justify-between px-6 pt-5">
              <div>
                <h3 className="font-display text-lg font-semibold text-ink">
                  {schedule ? '编辑组合计划' : '新建组合计划'}
                </h3>
                <p className="mt-0.5 text-[11px] text-ink/45">
                  一个计划可包含多条规则，整体启停
                </p>
              </div>
              <button
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-lg text-ink/45 transition-colors hover:bg-ink/10 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* 可滚动主体 */}
            <div ref={bodyRef} className="scrollbar-none mt-4 flex-1 overflow-y-auto px-6 pb-64">
              {/* 名称 */}
              <Field label="计划名称">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={defaultName(rules)}
                  className="selectable glass-soft w-full rounded-xl px-3.5 py-2.5 text-[13px] text-ink outline-none transition-shadow placeholder:text-ink/35 focus:shadow-glow"
                />
              </Field>

              {/* 规则列表 */}
              <div className="mb-2 mt-4 flex items-center justify-between">
                <label className="text-[12px] font-medium text-ink/55">
                  规则（{rules.length}）
                </label>
                <span className="text-[11px] text-ink/40">至少保留 1 条</span>
              </div>

              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {rules.map((rule, i) => (
                    <RuleEditorRow
                      key={rule.id}
                      index={i}
                      rule={rule}
                      removable={rules.length > 1}
                      elementRef={(node) => {
                        ruleRefs.current[rule.id] = node;
                      }}
                      onPatch={(p) => patchRule(rule.id, p)}
                      onRemove={() => removeRule(rule.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>

              {/* 添加规则 */}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={addRule}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-ink/15 py-2.5 text-[12px] font-medium text-ink/45 transition-colors hover:border-accent/50 hover:text-accent"
              >
                <motion.span
                  className="grid place-items-center"
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
                </motion.span>
                添加规则
              </motion.button>

              {/* 预览 */}
              <div className="glass-soft my-2 mt-4 rounded-xl px-3.5 py-2.5">
                <span className="text-[11px] text-ink/45">效果预览</span>
                <ul className="mt-1.5 space-y-1">
                  {rules.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-baseline gap-2 text-[13px] font-medium text-ink"
                    >
                      <span className="text-accent">•</span>
                      <span>{formatRule(r)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* 底部操作（固定） */}
            <div className="flex items-center justify-end gap-2.5 border-t border-ink/8 px-6 py-4">
              <button
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-[13px] font-medium text-ink/60 transition-colors hover:bg-ink/8 hover:text-ink"
              >
                取消
              </button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={save}
                className="bg-gradient-accent rounded-xl px-5 py-2 text-[13px] font-semibold text-white shadow-glow"
              >
                {schedule ? '保存修改' : '创建计划'}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** 单条规则编辑行 */
function RuleEditorRow({
  rule,
  index,
  removable,
  elementRef,
  onPatch,
  onRemove,
}: {
  rule: Rule;
  index: number;
  removable: boolean;
  elementRef?: (node: HTMLDivElement | null) => void;
  onPatch: (p: Partial<Omit<Rule, 'id'>>) => void;
  onRemove: () => void;
}) {
  return (
    <motion.div
      ref={elementRef}
      data-rule-id={rule.id}
      layout
      initial={{ opacity: 0, y: -8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="overflow-visible rounded-xl border border-ink/8 bg-ink/[0.02] p-3"
    >
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[11px] font-medium text-ink/40">
          规则 {index + 1}
        </span>
        <button
          onClick={onRemove}
          disabled={!removable}
          aria-label="删除规则"
          className={cn(
            'grid h-6 w-6 place-items-center rounded-md transition-colors',
            removable
              ? 'text-ink/40 hover:bg-red-500/10 hover:text-red-500'
              : 'cursor-not-allowed text-ink/20',
          )}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 动作 */}
      <div className="mb-2.5">
        <ActionPicker
          value={rule.action}
          onChange={(a: ActionType) => onPatch({ action: a })}
        />
      </div>

      {/* 时间 */}
      <div className="mb-2.5">
        <TimePicker value={rule.time} onChange={(t) => onPatch({ time: t })} />
      </div>

      {/* 星期 */}
      <WeekdayPicker
        value={rule.weekdays}
        onChange={(w: Weekday[]) => onPatch({ weekdays: w })}
      />
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[12px] font-medium text-ink/55">
        {label}
      </label>
      {children}
    </div>
  );
}

/** 名称缺省时自动生成，如 "关机 · 工作日 23:00 等 2 条" */
function defaultName(rules: Rule[]): string {
  if (rules.length === 0) return '新计划';
  const first = rules[0];
  const days =
    first.weekdays.length === 0 || first.weekdays.length === 7
      ? '每天'
      : first.weekdays
          .slice()
          .sort((a, b) => a - b)
          .map((d) => WEEKDAY_META.find((w) => w.key === d)!.short)
          .join('');
  const suffix = rules.length > 1 ? ` 等 ${rules.length} 条` : '';
  return `${ACTION_META[first.action].label} · ${days} ${first.time}${suffix}`;
}
