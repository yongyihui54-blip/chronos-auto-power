import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Rule, Schedule } from '@/types';
import { uid } from '@/lib/utils';

interface ScheduleInput {
  name: string;
  enabled: boolean;
  rules: Rule[];
}

interface ScheduleState {
  schedules: Schedule[];
  addSchedule: (s: ScheduleInput) => void;
  updateSchedule: (id: string, patch: Partial<Omit<Schedule, 'id' | 'createdAt'>>) => void;
  removeSchedule: (id: string) => void;
  toggleSchedule: (id: string) => void;
  disableAllSchedules: () => void;
  // 规则级操作（编辑器动态增删改规则行）
  addRule: (scheduleId: string, rule: Rule) => void;
  updateRule: (scheduleId: string, ruleId: string, patch: Partial<Omit<Rule, 'id'>>) => void;
  removeRule: (scheduleId: string, ruleId: string) => void;
}

/** 首次进入预置示例计划，演示「组合」能力 */
const seedSchedules: Schedule[] = [
  {
    id: 'seed-workday',
    enabled: true,
    name: '工作日节律',
    rules: [
      { id: 'seed-1', action: 'powerOn', time: '08:00', weekdays: [1, 2, 3, 4, 5] },
      { id: 'seed-2', action: 'shutdown', time: '23:30', weekdays: [1, 2, 3, 4, 5] },
      { id: 'seed-3', action: 'sleep', time: '13:00', weekdays: [6, 7] },
    ],
    createdAt: Date.now() - 200000,
  },
  {
    id: 'seed-weekend',
    enabled: false,
    name: '周末深夜模式',
    rules: [
      { id: 'seed-4', action: 'shutdown', time: '01:30', weekdays: [6, 7] },
    ],
    createdAt: Date.now() - 100000,
  },
];

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set) => ({
      schedules: seedSchedules,
      addSchedule: (s) =>
        set((state) => ({
          schedules: [
            { ...s, id: uid(), createdAt: Date.now() },
            ...state.schedules,
          ],
        })),
      updateSchedule: (id, patch) =>
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? { ...s, ...patch } : s,
          ),
        })),
      removeSchedule: (id) =>
        set((state) => ({
          schedules: state.schedules.filter((s) => s.id !== id),
        })),
      toggleSchedule: (id) =>
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? { ...s, enabled: !s.enabled } : s,
          ),
        })),
      disableAllSchedules: () =>
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.enabled ? { ...s, enabled: false } : s,
          ),
        })),
      addRule: (scheduleId, rule) =>
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === scheduleId
              ? { ...s, rules: [...s.rules, rule] }
              : s,
          ),
        })),
      updateRule: (scheduleId, ruleId, patch) =>
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === scheduleId
              ? {
                  ...s,
                  rules: s.rules.map((r) =>
                    r.id === ruleId ? { ...r, ...patch } : r,
                  ),
                }
              : s,
          ),
        })),
      removeRule: (scheduleId, ruleId) =>
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === scheduleId
              ? { ...s, rules: s.rules.filter((r) => r.id !== ruleId) }
              : s,
          ),
        })),
    }),
    // v2 key：避免反序列化到旧的「单规则」结构报错
    { name: 'chronos-schedules-v2' },
  ),
);
