import type { ActionType, Weekday } from '@/types';

/** 动作元数据：图标名、文案、用于卡片色彩点缀的色系 */
export interface ActionMeta {
  key: ActionType;
  label: string;
  /** 简短文案，用于时间轴节点等紧凑场景 */
  short: string;
  icon: 'powerOn' | 'power' | 'refresh' | 'moon' | 'snowflake' | 'lock' | 'logout';
  /** 0-360，用于卡片角标的色相点缀 */
  hue: number;
  tone: string;
  /** 是否需要「系统计划托管」（开机依赖 RTC 唤醒） */
  systemHosted?: boolean;
}

export const ACTION_META: Record<ActionType, ActionMeta> = {
  powerOn: {
    key: 'powerOn',
    label: '开机',
    short: '开机',
    icon: 'powerOn',
    hue: 150,
    tone: '托管',
    systemHosted: true,
  },
  shutdown: { key: 'shutdown', label: '关机', short: '关机', icon: 'power', hue: 248, tone: '危险' },
  restart: { key: 'restart', label: '重启', short: '重启', icon: 'refresh', hue: 200, tone: '常规' },
  sleep: { key: 'sleep', label: '睡眠', short: '睡眠', icon: 'moon', hue: 230, tone: '柔和' },
  hibernate: { key: 'hibernate', label: '休眠', short: '休眠', icon: 'snowflake', hue: 190, tone: '柔和' },
  lock: { key: 'lock', label: '锁屏', short: '锁屏', icon: 'lock', hue: 270, tone: '常规' },
  logoff: { key: 'logoff', label: '注销', short: '注销', icon: 'logout', hue: 30, tone: '常规' },
};

export const ACTION_LIST: ActionMeta[] = Object.values(ACTION_META);

/** 星期元数据 */
export interface WeekdayMeta {
  key: Weekday;
  short: string; // 一 二
  full: string; // 周一
}

export const WEEKDAY_META: WeekdayMeta[] = [
  { key: 1, short: '一', full: '周一' },
  { key: 2, short: '二', full: '周二' },
  { key: 3, short: '三', full: '周三' },
  { key: 4, short: '四', full: '周四' },
  { key: 5, short: '五', full: '周五' },
  { key: 6, short: '六', full: '周六' },
  { key: 7, short: '日', full: '周日' },
];

export const WEEKDAY_LABEL: Record<Weekday, string> = WEEKDAY_META.reduce(
  (acc, m) => {
    acc[m.key] = m.full;
    return acc;
  },
  {} as Record<Weekday, string>,
);
