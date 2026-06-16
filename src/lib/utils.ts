import type { ActionType, NextRun, Rule, Schedule, Weekday } from '@/types';
import { ACTION_META, WEEKDAY_LABEL } from './constants';

/** 生成短 id */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** 把 "HH:MM" 拆成数字 */
export function parseTime(time: string): { h: number; m: number } {
  const [h, m] = time.split(':').map(Number);
  return { h: h || 0, m: m || 0 };
}

/** 把星期数组渲染成人类可读串：[1,2,3,4,5] -> "周一至周五" */
export function formatWeekdays(weekdays: Weekday[]): string {
  if (weekdays.length === 0 || weekdays.length === 7) return '每天';

  const set = new Set(weekdays);

  // 工作日 / 周末整段
  const weekdaysAll = [1, 2, 3, 4, 5].every((d) => set.has(d as Weekday));
  const weekendAll = [6, 7].every((d) => set.has(d as Weekday));
  if (weekdaysAll && set.size === 5) return '工作日';
  if (weekendAll && set.size === 2) return '周末';

  // 连续段
  const sorted = [...set].sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const cur = sorted[i];
    if (cur === prev + 1) {
      prev = cur;
      continue;
    }
    ranges.push(formatRange(start, prev));
    start = cur;
    prev = cur;
  }
  ranges.push(formatRange(start, prev));
  return ranges.join('、');
}

function formatRange(a: Weekday, b: Weekday): string {
  if (a === b) return WEEKDAY_LABEL[a];
  return `${WEEKDAY_LABEL[a]}至${WEEKDAY_LABEL[b]}`;
}

/** 渲染单条规则文案：{动作} · {星期} {时间}，如 "关机 · 周一至周五 23:30" */
export function formatRule(rule: Rule): string {
  return `${ACTION_META[rule.action].label} · ${formatWeekdays(rule.weekdays)} ${rule.time}`;
}

/** 计算某条规则下一次触发的绝对时间 */
export function nextRunOf(rule: Rule, from: Date = new Date()): Date | null {
  const { h, m } = parseTime(rule.time);
  const days: Weekday[] =
    rule.weekdays.length === 0 ? [1, 2, 3, 4, 5, 6, 7] : rule.weekdays;

  for (let i = 0; i < 8; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    d.setHours(h, m, 0, 0);
    // JS: 周日=0 ... 周六=6 → 转为 1..7
    const dow = (d.getDay() + 6) % 7 + 1;
    if (!days.includes(dow as Weekday)) continue;
    if (d.getTime() > from.getTime()) return d;
  }
  return null;
}

/**
 * 在所有启用计划的所有规则中找到最近的一条。
 * 规则在其所属 schedule.enabled 时才参与计算。
 */
export function nextRunAcross(schedules: Schedule[], from: Date = new Date()): NextRun | null {
  let best: NextRun | null = null;
  for (const s of schedules) {
    if (!s.enabled) continue;
    for (const rule of s.rules) {
      const at = nextRunOf(rule, from);
      if (!at) continue;
      if (!best || at.getTime() < best.at.getTime()) {
        const meta = ACTION_META[rule.action];
        best = {
          scheduleId: s.id,
          ruleId: rule.id,
          at,
          label: `${meta.label} · ${formatWeekdays(rule.weekdays)} ${rule.time}`,
        };
      }
    }
  }
  return best;
}

/** 把 Date 渲染成 "周一 23:00" 这样的展示串 */
export function formatNextRun(d: Date, action: ActionType): string {
  const dow = (d.getDay() + 6) % 7 + 1;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${WEEKDAY_LABEL[dow as Weekday]} ${hh}:${mm} ${ACTION_META[action].label}`;
}

/** 友好倒计时："3 小时 12 分后" */
export function formatCountdown(target: Date, from: Date = new Date()): string {
  const diff = target.getTime() - from.getTime();
  if (diff <= 0) return '即将执行';
  const min = Math.floor(diff / 60000);
  const days = Math.floor(min / 1440);
  const hours = Math.floor((min % 1440) / 60);
  const mins = min % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days} 天`);
  if (hours > 0) parts.push(`${hours} 小时`);
  if (mins > 0 && days === 0) parts.push(`${mins} 分`);
  return parts.length ? `${parts.join(' ')}后` : '不到 1 分钟';
}

/** 统计一个计划集合里的规则总数 */
export function countRules(schedules: Schedule[]): number {
  return schedules.reduce((acc, s) => acc + s.rules.length, 0);
}

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 计算跨计划冲突：同一星期、同一时刻、存在多个电源动作视为冲突。
 * 返回冲突规则 id 集合，用于时间轴柔和警告状态。
 */
export function findConflictingRuleIds(schedules: Schedule[]): Set<string> {
  const set = new Set<string>();
  const active = schedules.filter((s) => s.enabled);

  for (let i = 0; i < active.length; i++) {
    for (const a of active[i].rules) {
      for (let j = i; j < active.length; j++) {
        for (const b of active[j].rules) {
          if (a.id === b.id) continue;
          if (a.time !== b.time) continue;
          if (!a.weekdays.some((d) => b.weekdays.includes(d))) continue;
          set.add(a.id);
          set.add(b.id);
        }
      }
    }
  }
  return set;
}

/** 某星期下、某计划集合的全部规则（已按时间排序） */
export function rulesOnDay(schedules: Schedule[], day: Weekday) {
  const items: { rule: Rule; schedule: Schedule }[] = [];
  for (const s of schedules) {
    if (!s.enabled) continue;
    for (const r of s.rules) {
      if (r.weekdays.length === 0 || r.weekdays.includes(day)) {
        items.push({ rule: r, schedule: s });
      }
    }
  }
  return items.sort((a, b) => a.rule.time.localeCompare(b.rule.time));
}
