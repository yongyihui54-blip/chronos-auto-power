// 核心数据模型

/** 电源动作类型 */
export type ActionType =
  | 'powerOn' // 开机（系统计划托管：依赖 BIOS/UEFI 唤醒，由后端通过系统计划任务实现）
  | 'shutdown' // 关机
  | 'restart' // 重启
  | 'sleep' // 睡眠
  | 'hibernate' // 休眠
  | 'lock' // 锁屏
  | 'logoff'; // 注销
// 注：「开机」前端按「系统计划托管」呈现，完全断电后的启动依赖 RTC/BIOS 唤醒设置，
// 后端阶段通过系统计划任务（Windows 任务计划程序 / launchd / systemd）实现。

/** 星期（周一=1 ... 周日=7） */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** 单条规则：一个动作 + 一个时间 + 一组星期 */
export interface Rule {
  id: string;
  action: ActionType;
  /** "HH:MM"，24 小时制 */
  time: string;
  /** 启用的星期；为空表示每天执行 */
  weekdays: Weekday[];
}

/** 组合计划：多条规则打包，整计划启停 */
export interface Schedule {
  id: string;
  /** 总开关，控制整组规则 */
  enabled: boolean;
  name: string;
  /** 计划包含的规则集合 */
  rules: Rule[];
  createdAt: number;
}

/** 应用设置 */
export interface AppSettings {
  masterEnabled: boolean;
  theme: ThemeMode;
  minimizeToTray: boolean;
  launchAtLogin: boolean;
}

export type ThemeMode = 'light' | 'dark' | 'system';

/** Toast 通知 */
export interface ToastItem {
  id: string;
  message: string;
  tone: 'success' | 'info' | 'error';
}

/** 下一次执行的预计算结果 */
export interface NextRun {
  scheduleId: string;
  ruleId: string;
  /** ISO 时间字符串 */
  at: Date;
  label: string;
}
