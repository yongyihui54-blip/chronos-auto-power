import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  nativeImage,
  shell,
  Tray,
} from 'electron';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const execFileAsync = promisify(execFile);

type ActionType =
  | 'powerOn'
  | 'shutdown'
  | 'restart'
  | 'sleep'
  | 'hibernate'
  | 'lock'
  | 'logoff';

type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface Rule {
  id: string;
  action: ActionType;
  time: string;
  weekdays: Weekday[];
}

interface Schedule {
  id: string;
  enabled: boolean;
  name: string;
  rules: Rule[];
  createdAt: number;
}

interface AppSettings {
  masterEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  minimizeToTray: boolean;
  launchAtLogin: boolean;
}

interface SchedulingPayload {
  masterEnabled: boolean;
  schedules: Schedule[];
  settings: AppSettings;
}

interface WakeTaskRecord {
  key: string;
  taskName: string;
  taskPath: string;
  scheduleId: string;
  ruleId: string;
}

interface BackendStore {
  snapshot?: SchedulingPayload;
  wakeTasks?: WakeTaskRecord[];
  minimizeToTray?: boolean;
  launchAtLogin?: boolean;
}

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

interface OrdinaryOccurrence {
  schedule: Schedule;
  rule: Rule;
  at: Date;
}

const ACTION_LABEL: Record<ActionType, string> = {
  powerOn: '开机',
  shutdown: '关机',
  restart: '重启',
  sleep: '睡眠',
  hibernate: '休眠',
  lock: '锁屏',
  logoff: '注销',
};

const POWERSHELL = 'powershell.exe';
const TASK_PATH = '\\Chronos\\';
const REMINDER_LEAD_MS = 30_000;

const defaultSettings: AppSettings = {
  masterEnabled: false,
  theme: 'system',
  minimizeToTray: true,
  launchAtLogin: false,
};

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let minimizeToTray = true;
let launchAtLogin = false;
let currentSnapshot: SchedulingPayload = {
  masterEnabled: false,
  schedules: [],
  settings: defaultSettings,
};
let wakeTasks: WakeTaskRecord[] = [];
let reminderTimer: ReturnType<typeof setTimeout> | null = null;
let executionTimer: ReturnType<typeof setTimeout> | null = null;
let pendingExecution: PendingExecutionEvent | null = null;

const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 880,
    height: 680,
    minWidth: 600,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0f172a',
    roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.once('ready-to-show', () => {
    if (!process.argv.includes('--wake-task')) {
      mainWindow?.show();
    }
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting && minimizeToTray) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: 'deny' };
  });

  const devUrl = process.env['ELECTRON_RENDERER_URL'];
  if (devUrl) {
    void mainWindow.loadURL(devUrl);
  } else {
    void mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

function createTray() {
  if (tray) return;

  const trayIconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'build/tray.png')
    : path.join(__dirname, '../build/tray.png');
  const icon = nativeImage
    .createFromPath(trayIconPath)
    .resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('Chronos 定时开关机');
  tray.on('click', showMainWindow);
  refreshTrayMenu();
}

function refreshTrayMenu() {
  if (!tray) return;

  const menu = Menu.buildFromTemplate([
    {
      label: '显示 Chronos',
      click: showMainWindow,
    },
    {
      label: currentSnapshot.masterEnabled ? '定时模式：运行中' : '定时模式：已停用',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(menu);
}

function showMainWindow() {
  if (!mainWindow) {
    createWindow();
  }

  if (mainWindow?.isMinimized()) {
    mainWindow.restore();
  }
  mainWindow?.show();
  mainWindow?.focus();
}

function getStorePath() {
  return path.join(app.getPath('userData'), 'chronos-backend.json');
}

async function loadBackendStore() {
  try {
    const raw = await fs.readFile(getStorePath(), 'utf8');
    const store = JSON.parse(raw) as BackendStore;
    if (store.snapshot) {
      currentSnapshot = store.snapshot;
    }
    wakeTasks = store.wakeTasks ?? [];
    minimizeToTray = store.minimizeToTray ?? store.snapshot?.settings.minimizeToTray ?? true;
    launchAtLogin = store.launchAtLogin ?? store.snapshot?.settings.launchAtLogin ?? false;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.warn('Chronos backend store load failed:', error);
    }
  }
}

async function saveBackendStore() {
  const store: BackendStore = {
    snapshot: currentSnapshot,
    wakeTasks,
    minimizeToTray,
    launchAtLogin,
  };

  await fs.mkdir(path.dirname(getStorePath()), { recursive: true });
  await fs.writeFile(getStorePath(), `${JSON.stringify(store, null, 2)}\n`, 'utf8');
}

function toResult(error: unknown, fallback = '操作失败'): BackendResult {
  if (error instanceof Error) {
    return { ok: false, message: error.message || fallback };
  }
  return { ok: false, message: fallback };
}

async function runPowerShell(script: string) {
  const encoded = Buffer.from(script, 'utf16le').toString('base64');
  await execFileAsync(
    POWERSHELL,
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', encoded],
    { windowsHide: true },
  );
}

async function runCommand(file: string, args: string[]) {
  if (process.env['CHRONOS_DRY_RUN'] === 'true') {
    console.info('[dry-run]', file, args.join(' '));
    return;
  }

  await execFileAsync(file, args, { windowsHide: true });
}

async function executeAction(action: ActionType) {
  if (process.platform !== 'win32') {
    throw new Error('当前版本只支持 Windows 系统动作。');
  }

  switch (action) {
    case 'shutdown':
      await runCommand('shutdown.exe', ['/s', '/t', '0']);
      return;
    case 'restart':
      await runCommand('shutdown.exe', ['/r', '/t', '0']);
      return;
    case 'hibernate':
      await runCommand('shutdown.exe', ['/h']);
      return;
    case 'lock':
      await runCommand('rundll32.exe', ['user32.dll,LockWorkStation']);
      return;
    case 'logoff':
      await runCommand('shutdown.exe', ['/l']);
      return;
    case 'sleep':
      await runPowerShell(
        [
          "$ErrorActionPreference = 'Stop'",
          "Add-Type -Name PowrProf -Namespace ChronosNative -MemberDefinition '[DllImport(\"powrprof.dll\", SetLastError=true)] public static extern bool SetSuspendState(bool hibernate, bool forceCritical, bool disableWakeEvent);'",
          'if (-not [ChronosNative.PowrProf]::SetSuspendState($false, $false, $false)) { exit 1 }',
        ].join('\n'),
      );
      return;
    case 'powerOn':
      throw new Error('开机/唤醒规则由 Windows 任务计划程序托管，不能立即执行。');
    default:
      throw new Error('未知系统动作。');
  }
}

function parseTime(time: string) {
  const [h, m] = time.split(':').map(Number);
  return {
    h: Number.isFinite(h) ? h : 0,
    m: Number.isFinite(m) ? m : 0,
  };
}

function weekdaysFor(rule: Rule): Weekday[] {
  return rule.weekdays.length === 0 ? [1, 2, 3, 4, 5, 6, 7] : rule.weekdays;
}

function nextRunOf(rule: Rule, from = new Date()): Date | null {
  const { h, m } = parseTime(rule.time);
  const days = weekdaysFor(rule);

  for (let i = 0; i < 8; i += 1) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    d.setHours(h, m, 0, 0);
    const dow = ((d.getDay() + 6) % 7 + 1) as Weekday;
    if (!days.includes(dow)) continue;
    if (d.getTime() > from.getTime()) return d;
  }

  return null;
}

function nextOrdinaryOccurrence(from = new Date()): OrdinaryOccurrence | null {
  if (!currentSnapshot.masterEnabled) return null;

  let best: OrdinaryOccurrence | null = null;
  for (const schedule of currentSnapshot.schedules) {
    if (!schedule.enabled) continue;
    for (const rule of schedule.rules) {
      if (rule.action === 'powerOn') continue;
      const at = nextRunOf(rule, from);
      if (!at) continue;
      if (!best || at.getTime() < best.at.getTime()) {
        best = { schedule, rule, at };
      }
    }
  }

  return best;
}

function occurrenceId(occurrence: OrdinaryOccurrence) {
  return `${occurrence.schedule.id}:${occurrence.rule.id}:${occurrence.at.toISOString()}`;
}

function clearOrdinaryTimers() {
  if (reminderTimer) {
    clearTimeout(reminderTimer);
    reminderTimer = null;
  }
  if (executionTimer) {
    clearTimeout(executionTimer);
    executionTimer = null;
  }
  pendingExecution = null;
}

function scheduleOrdinaryTimers(from = new Date()) {
  clearOrdinaryTimers();

  const occurrence = nextOrdinaryOccurrence(from);
  if (!occurrence) return;

  const now = Date.now();
  const scheduledAtMs = occurrence.at.getTime();
  const reminderAtMs = scheduledAtMs - REMINDER_LEAD_MS;

  if (scheduledAtMs <= now) {
    scheduleOrdinaryTimers(new Date(now + 1000));
    return;
  }

  const showReminder = () => {
    const remainingMs = Math.max(0, scheduledAtMs - Date.now());
    pendingExecution = {
      id: occurrenceId(occurrence),
      scheduleId: occurrence.schedule.id,
      ruleId: occurrence.rule.id,
      scheduleName: occurrence.schedule.name,
      action: occurrence.rule.action,
      actionLabel: ACTION_LABEL[occurrence.rule.action],
      scheduledAt: occurrence.at.toISOString(),
      remainingMs,
    };

    showMainWindow();
    sendPendingExecution();

    executionTimer = setTimeout(() => {
      void runPendingExecution(pendingExecution?.id);
    }, remainingMs);
  };

  reminderTimer = setTimeout(showReminder, Math.max(0, reminderAtMs - now));
}

function sendPendingExecution() {
  if (!pendingExecution || !mainWindow) return;
  mainWindow.webContents.send('schedule:pending-execution', pendingExecution);
}

function sendPendingCleared(id: string, reason: 'cancelled' | 'executed' | 'skipped', message?: string) {
  mainWindow?.webContents.send('schedule:pending-cleared', { id, reason, message });
}

async function runPendingExecution(id?: string | null) {
  if (!pendingExecution) return;
  if (id && id !== pendingExecution.id) return;

  const event = pendingExecution;
  clearOrdinaryTimers();

  try {
    await executeAction(event.action);
    sendPendingCleared(event.id, 'executed');
  } catch (error) {
    const message = error instanceof Error ? error.message : '执行系统动作失败。';
    sendPendingCleared(event.id, 'skipped', message);
  } finally {
    scheduleOrdinaryTimers(new Date(Date.now() + 1000));
  }
}

function cancelPendingExecution(id: string) {
  if (!pendingExecution || pendingExecution.id !== id) return false;

  const scheduledAt = new Date(pendingExecution.scheduledAt);
  clearOrdinaryTimers();
  sendPendingCleared(id, 'cancelled');
  scheduleOrdinaryTimers(new Date(scheduledAt.getTime() + 1000));
  return true;
}

function psQuote(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function sanitizeTaskName(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 80);
}

function taskKey(scheduleId: string, ruleId: string) {
  return `${scheduleId}:${ruleId}`;
}

function weekdayNames(rule: Rule) {
  const names: Record<Weekday, string> = {
    1: 'Monday',
    2: 'Tuesday',
    3: 'Wednesday',
    4: 'Thursday',
    5: 'Friday',
    6: 'Saturday',
    7: 'Sunday',
  };
  return weekdaysFor(rule).map((day) => names[day]).join(',');
}

function buildWakeTaskRecord(schedule: Schedule, rule: Rule): WakeTaskRecord {
  const key = taskKey(schedule.id, rule.id);
  return {
    key,
    taskName: `Wake-${sanitizeTaskName(schedule.id)}-${sanitizeTaskName(rule.id)}`,
    taskPath: TASK_PATH,
    scheduleId: schedule.id,
    ruleId: rule.id,
  };
}

function appCommandPath() {
  return app.isPackaged ? process.execPath : process.execPath;
}

function appCommandArguments(record: WakeTaskRecord) {
  if (app.isPackaged) {
    return `--wake-task --schedule-id ${record.scheduleId} --rule-id ${record.ruleId}`;
  }

  return [
    process.argv.slice(1).map((arg) => `"${arg.replace(/"/g, '\\"')}"`).join(' '),
    '--wake-task',
    `--schedule-id ${record.scheduleId}`,
    `--rule-id ${record.ruleId}`,
  ]
    .filter(Boolean)
    .join(' ');
}

async function registerWakeTask(record: WakeTaskRecord, schedule: Schedule, rule: Rule) {
  if (process.platform !== 'win32') return;

  const script = [
    "$ErrorActionPreference = 'Stop'",
    '$service = New-Object -ComObject Schedule.Service',
    '$service.Connect()',
    "$root = $service.GetFolder('\\')",
    "try { $root.GetFolder('Chronos') | Out-Null } catch { $root.CreateFolder('Chronos') | Out-Null }",
    `$action = New-ScheduledTaskAction -Execute ${psQuote(appCommandPath())} -Argument ${psQuote(appCommandArguments(record))}`,
    `$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek ${weekdayNames(rule)} -At ${psQuote(rule.time)}`,
    '$settings = New-ScheduledTaskSettingsSet -WakeToRun -StartWhenAvailable -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries',
    '$principal = New-ScheduledTaskPrincipal -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) -LogonType Interactive -RunLevel Limited',
    [
      'Register-ScheduledTask',
      `-TaskPath ${psQuote(record.taskPath)}`,
      `-TaskName ${psQuote(record.taskName)}`,
      '-Action $action',
      '-Trigger $trigger',
      '-Settings $settings',
      '-Principal $principal',
      `-Description ${psQuote(`Chronos 唤醒任务：${schedule.name}`)}`,
      '-Force',
      '| Out-Null',
    ].join(' '),
  ].join('\n');

  await runPowerShell(script);
}

async function unregisterWakeTask(record: WakeTaskRecord) {
  if (process.platform !== 'win32') return;

  await runPowerShell(
    [
      "$ErrorActionPreference = 'SilentlyContinue'",
      `Unregister-ScheduledTask -TaskPath ${psQuote(record.taskPath)} -TaskName ${psQuote(record.taskName)} -Confirm:$false`,
    ].join('\n'),
  );
}

function desiredWakeTasks() {
  const desired = new Map<string, { record: WakeTaskRecord; schedule: Schedule; rule: Rule }>();
  if (!currentSnapshot.masterEnabled) return desired;

  for (const schedule of currentSnapshot.schedules) {
    if (!schedule.enabled) continue;
    for (const rule of schedule.rules) {
      if (rule.action !== 'powerOn') continue;
      const record = buildWakeTaskRecord(schedule, rule);
      desired.set(record.key, { record, schedule, rule });
    }
  }

  return desired;
}

async function syncWakeTasks() {
  if (process.platform !== 'win32') return;

  const desired = desiredWakeTasks();
  const desiredKeys = new Set(desired.keys());
  const obsolete = wakeTasks.filter((task) => !desiredKeys.has(task.key));

  for (const task of obsolete) {
    await unregisterWakeTask(task);
  }

  const nextTasks: WakeTaskRecord[] = [];
  for (const item of desired.values()) {
    await registerWakeTask(item.record, item.schedule, item.rule);
    nextTasks.push(item.record);
  }

  wakeTasks = nextTasks;
}

async function applyScheduling(payload: SchedulingPayload): Promise<BackendResult> {
  try {
    currentSnapshot = payload;
    minimizeToTray = payload.settings.minimizeToTray;
    launchAtLogin = payload.settings.launchAtLogin;
    app.setLoginItemSettings({
      openAtLogin: launchAtLogin,
      openAsHidden: true,
      args: ['--background'],
    });

    await syncWakeTasks();
    await saveBackendStore();
    scheduleOrdinaryTimers();
    refreshTrayMenu();
    return { ok: true };
  } catch (error) {
    return toResult(error, '同步计划失败');
  }
}

function registerIpcHandlers() {
  ipcMain.on('window:minimize', () => mainWindow?.minimize());
  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.on('window:close', () => mainWindow?.close());

  ipcMain.handle('power:execute', async (_event, action: ActionType): Promise<BackendResult> => {
    try {
      await executeAction(action);
      return { ok: true };
    } catch (error) {
      return toResult(error, '执行系统动作失败');
    }
  });

  ipcMain.handle(
    'schedule:sync',
    async (_event, payload: SchedulingPayload): Promise<BackendResult> => applyScheduling(payload),
  );

  ipcMain.handle('schedule:cancel-pending', (_event, id: string): BackendResult => {
    const cancelled = cancelPendingExecution(id);
    return cancelled ? { ok: true } : { ok: false, message: '当前没有可取消的任务。' };
  });

  ipcMain.handle('schedule:run-pending-now', async (_event, id: string): Promise<BackendResult> => {
    try {
      await runPendingExecution(id);
      return { ok: true };
    } catch (error) {
      return toResult(error, '执行系统动作失败');
    }
  });

  ipcMain.handle('settings:launch-at-login', async (_event, enabled: boolean): Promise<BackendResult> => {
    try {
      launchAtLogin = enabled;
      app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: true,
        args: ['--background'],
      });
      await saveBackendStore();
      return { ok: true };
    } catch (error) {
      return toResult(error, '设置开机自启动失败');
    }
  });

  ipcMain.handle('settings:minimize-to-tray', async (_event, enabled: boolean): Promise<BackendResult> => {
    try {
      minimizeToTray = enabled;
      await saveBackendStore();
      return { ok: true };
    } catch (error) {
      return toResult(error, '设置托盘驻留失败');
    }
  });
}

app.on('second-instance', (_event, commandLine) => {
  if (commandLine.includes('--wake-task')) return;
  showMainWindow();
});

app.whenReady().then(async () => {
  await loadBackendStore();
  registerIpcHandlers();
  createWindow();
  createTray();
  scheduleOrdinaryTimers();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
    showMainWindow();
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (process.platform === 'darwin') return;
  if (!minimizeToTray || isQuitting) app.quit();
});
