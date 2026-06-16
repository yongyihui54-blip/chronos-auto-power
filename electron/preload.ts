import { contextBridge, ipcRenderer } from 'electron';

type ActionType =
  | 'powerOn'
  | 'shutdown'
  | 'restart'
  | 'sleep'
  | 'hibernate'
  | 'lock'
  | 'logoff';

interface BackendResult {
  ok: boolean;
  message?: string;
  code?: string;
}

interface PendingExecutionEvent {
  id: string;
  scheduleId: string;
  ruleId: string;
  scheduleName: string;
  action: ActionType;
  actionLabel: string;
  scheduledAt: string;
  remainingMs: number;
}

interface PendingClearedEvent {
  id: string;
  reason: 'cancelled' | 'executed' | 'skipped';
  message?: string;
}

const api = {
  minimize: () => ipcRenderer.send('window:minimize'),
  toggleMaximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  executeAction: (action: ActionType) => ipcRenderer.invoke('power:execute', action) as Promise<BackendResult>,
  syncScheduling: (payload: unknown) => ipcRenderer.invoke('schedule:sync', payload) as Promise<BackendResult>,
  cancelPendingExecution: (id: string) =>
    ipcRenderer.invoke('schedule:cancel-pending', id) as Promise<BackendResult>,
  runPendingExecutionNow: (id: string) =>
    ipcRenderer.invoke('schedule:run-pending-now', id) as Promise<BackendResult>,
  setLaunchAtLogin: (enabled: boolean) =>
    ipcRenderer.invoke('settings:launch-at-login', enabled) as Promise<BackendResult>,
  setMinimizeToTray: (enabled: boolean) =>
    ipcRenderer.invoke('settings:minimize-to-tray', enabled) as Promise<BackendResult>,
  onPendingExecution: (callback: (event: PendingExecutionEvent) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: PendingExecutionEvent) => callback(payload);
    ipcRenderer.on('schedule:pending-execution', listener);
    return () => ipcRenderer.removeListener('schedule:pending-execution', listener);
  },
  onPendingCleared: (callback: (event: PendingClearedEvent) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, payload: PendingClearedEvent) => callback(payload);
    ipcRenderer.on('schedule:pending-cleared', listener);
    return () => ipcRenderer.removeListener('schedule:pending-cleared', listener);
  },
};

contextBridge.exposeInMainWorld('chronos', api);

export type ChronosApi = typeof api;
