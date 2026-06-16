import type { ActionType, AppSettings, Schedule } from '@/types';

export interface BackendResult {
  ok: boolean;
  message?: string;
  code?: string;
}

export interface SchedulingSyncPayload {
  masterEnabled: boolean;
  schedules: Schedule[];
  settings: AppSettings;
}

export interface PendingExecutionEvent {
  id: string;
  scheduleId: string;
  ruleId: string;
  scheduleName: string;
  action: ActionType;
  actionLabel: string;
  scheduledAt: string;
  remainingMs: number;
}

export interface PendingClearedEvent {
  id: string;
  reason: 'cancelled' | 'executed' | 'skipped';
  message?: string;
}

export interface ChronosWindow {
  chronos?: {
    minimize: () => void;
    toggleMaximize: () => void;
    close: () => void;
    executeAction?: (action: ActionType) => Promise<BackendResult>;
    syncScheduling?: (payload: SchedulingSyncPayload) => Promise<BackendResult>;
    cancelPendingExecution?: (id: string) => Promise<BackendResult>;
    runPendingExecutionNow?: (id: string) => Promise<BackendResult>;
    setLaunchAtLogin?: (enabled: boolean) => Promise<BackendResult>;
    setMinimizeToTray?: (enabled: boolean) => Promise<BackendResult>;
    onPendingExecution?: (callback: (event: PendingExecutionEvent) => void) => () => void;
    onPendingCleared?: (callback: (event: PendingClearedEvent) => void) => () => void;
  };
}

declare global {
  interface Window extends ChronosWindow {}
}

function assertOk(result: BackendResult | undefined, fallback: string) {
  if (!result) return;
  if (!result.ok) {
    throw new Error(result.message || fallback);
  }
}

export async function executeAction(action: ActionType): Promise<void> {
  const api = win().chronos;
  if (api?.executeAction) {
    assertOk(await api.executeAction(action), '执行系统动作失败');
    return;
  }

  console.info(`[mock] 执行电源动作: ${action}`);
  await new Promise((resolve) => setTimeout(resolve, 120));
}

export async function syncScheduling(payload: SchedulingSyncPayload): Promise<void> {
  const api = win().chronos;
  if (api?.syncScheduling) {
    assertOk(await api.syncScheduling(payload), '同步计划失败');
    return;
  }

  console.info(
    `[mock] 调度${payload.masterEnabled ? '已启用' : '已停用'}，计划 ${payload.schedules.length} 个`,
  );
}

export async function setLaunchAtLogin(enabled: boolean): Promise<void> {
  const api = win().chronos;
  if (api?.setLaunchAtLogin) {
    assertOk(await api.setLaunchAtLogin(enabled), '设置开机自启动失败');
  }
}

export async function setMinimizeToTray(enabled: boolean): Promise<void> {
  const api = win().chronos;
  if (api?.setMinimizeToTray) {
    assertOk(await api.setMinimizeToTray(enabled), '设置托盘驻留失败');
  }
}

export async function cancelPendingExecution(id: string): Promise<void> {
  const api = win().chronos;
  if (api?.cancelPendingExecution) {
    assertOk(await api.cancelPendingExecution(id), '取消本次执行失败');
  }
}

export async function runPendingExecutionNow(id: string): Promise<void> {
  const api = win().chronos;
  if (api?.runPendingExecutionNow) {
    assertOk(await api.runPendingExecutionNow(id), '立即执行失败');
  }
}

export function onPendingExecution(callback: (event: PendingExecutionEvent) => void) {
  return win().chronos?.onPendingExecution?.(callback) ?? (() => undefined);
}

export function onPendingCleared(callback: (event: PendingClearedEvent) => void) {
  return win().chronos?.onPendingCleared?.(callback) ?? (() => undefined);
}

export function win(): ChronosWindow {
  return window;
}
