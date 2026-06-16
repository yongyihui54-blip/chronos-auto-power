<p align="center">
  <strong>Chronos</strong> · Auto Power Scheduler for Windows
</p>

<p align="center">
  English · <a href="./README.md">简体中文</a>
</p>

---

# Chronos · Auto Power On/Off Desktop App

A desktop app for scheduling your PC's power on/off, built with **Electron + React + Vite + TypeScript**.
The renderer handles plan & rule orchestration, while the main process wires up real **Windows power commands**
and the **Task Scheduler** — so shutdown / restart / sleep / hibernate / lock / logoff actually take effect,
and "power on / wake" is owned by the Windows Task Scheduler (`WakeToRun`).

> Windows-only build. Shutdown / restart / hibernate / lock / logoff / sleep are done via system commands;
> "Power on" relies on the BIOS/UEFI RTC-wake capability and is triggered by the Task Scheduler when the time comes.

---

## ✨ Features

### Scheduling & Execution (real backend)
- **Global "Scheduling Mode" master switch** (`MasterSwitch`): accent glow + next-run preview + live countdown when enabled.
- **Multiple composite plans**: card grid (`ScheduleList` / `ScheduleCard`) — select, toggle whole groups, edit, delete, hover-lift + context menu.
- **Week timeline view** (`WeekTimeline`): 7-column Mon→Sun grid, action nodes sorted by time;
  **soft conflict hint** when multiple actions share the same slot; click a node to jump to its editor; today's column is highlighted.
- **Composite plan editor** (`ScheduleEditor`): modal with dynamic rule rows (add/remove), action picker, 24h time, weekday picker, live preview.
- **Rule editor controls**: `ActionPicker` / `TimePicker` / `WeekdayPicker`, all with interaction animations.
- **Pre-execution reminder**: a countdown dialog (`PendingExecutionDialog`) pops up 30s before the action — **cancel this run** or **run now**.
- **Sync = apply**: plan/setting changes are pushed to the main process instantly, recomputing the next run and refreshing system tasks.

### Power actions
| Action | Implementation |
|--------|----------------|
| `shutdown` | `shutdown.exe /s /t 0` |
| `restart` | `shutdown.exe /r /t 0` |
| `hibernate` | `shutdown.exe /h` |
| `lock` | `rundll32.exe user32.dll,LockWorkStation` |
| `logoff` | `shutdown.exe /l` |
| `sleep` | PowerShell calling `powrprof.dll`'s `SetSuspendState` |
| `powerOn` | **Hosted by Task Scheduler**: `-WakeToRun`; fully powered-off machines need BIOS/UEFI RTC wake |

### UX & Theming
- **Theme**: light / dark / follow-system (`ThemeToggle` + `useTheme`), persisted to localStorage, smooth color transition.
- **Motion**: enter / hover / drag animations powered by framer-motion; respects `prefers-reduced-motion` globally.
- **System tray**: stays in tray, minimize-to-tray is configurable; right-click menu shows status, single click restores the window.
- **Launch at login**: optional, starts hidden with `--background` after login.
- **Single-instance lock**: relaunch focuses the existing window; wake-task second instances never steal focus.
- **Toast notifications** + **custom title bar** (frameless window controls) + **time-rings background** (`TimeRingsBackground`).
- **Quick actions** panel (run a power action immediately).
- **Persistence**: renderer via zustand `persist` (`chronos-schedules-v2` / `chronos-settings`);
  main process state saved to `userData/chronos-backend.json` (plan snapshot, wake-task records, tray/autostart settings).
- Seeded example plans (workday 08:00 power-on + 23:30 shutdown + weekend nap, weekend late-night mode).

---

## 🚀 Run & Build

Requires [Node.js](https://nodejs.org) (18+ recommended), then:

```bash
npm install        # skip if node_modules exists

# 1) Frontend-only preview (browser, fastest, no Electron main process)
npm run dev
# open http://localhost:5173

# 2) Electron desktop dev (main process + real power/task-scheduler backend)
npm run electron:dev

# 3) Type check
npm run lint

# 4) Build the installer (frontend build + electron-builder NSIS)
npm run build
```

Build artifacts live in `release/`:
- `Chronos Setup 0.1.0.exe` — NSIS installer (~77 MB)
- `Chronos Setup 0.1.0.exe.blockmap` — incremental update index
- `win-unpacked/` — unpacked directory (run `Chronos.exe` directly)

### Runtime permissions & dependencies
- Power actions run via system commands; the app itself **needs no admin privileges** to run.
- "Power on / wake" tasks are registered under the current user in the Task Scheduler's `\Chronos\` path
  (`LogonType Interactive`, `RunLevel Limited`); the `build/installer.nsh` cleans up all tasks under that path on uninstall.
- For debugging, run the main process with `CHRONOS_DRY_RUN=true` — power commands are printed as `[dry-run]` instead of executing.

---

## 🧱 Tech Stack

| Layer | Tech |
|-------|------|
| Desktop shell | Electron 31 |
| Renderer | React 18 + TypeScript 5 |
| Build | Vite 5 (vite-plugin-electron) |
| State | Zustand (persist middleware) |
| Styling | Tailwind CSS 3 + CSS-var dual theme (glassmorphism) |
| Motion | Framer Motion |
| Icons | lucide-react |
| System | Windows `shutdown.exe` / `rundll32.exe` / PowerShell + `powrprof.dll` / Task Scheduler |

---

## 📁 Project Structure

```
src/
├─ main.tsx                  # Renderer entry
├─ App.tsx                   # App composition: master / plans / week / quick / settings
├─ index.css                 # Tailwind + design tokens (light/dark via CSS vars)
├─ types/index.ts            # Domain model: ActionType / Rule / Schedule / ThemeMode
├─ lib/
│  ├─ constants.ts           # Action metadata (incl. system-hosted powerOn) / weekday metadata
│  ├─ utils.ts               # Conflict detection / next-run calc / countdown / text formatting
│  ├─ mock.ts                # IPC bridge: real backend if window.chronos present, else mock
│  └─ useTheme.ts            # Theme sync to <html> + prefers-color-scheme listener
├─ store/
│  ├─ scheduleStore.ts       # Plan/rule CRUD (persisted)
│  ├─ settingsStore.ts       # App settings (persisted)
│  └─ toastStore.ts          # Toast queue
└─ components/
   ├─ WeekTimeline.tsx       # Week timeline grid (7 cols + conflict hints)
   ├─ ActionIcon.tsx         # Centralized action→lucide-icon map
   ├─ PendingExecutionDialog.tsx  # 30s pre-execution countdown modal
   ├─ MasterSwitch / ScheduleList / ScheduleCard / ScheduleEditor
   ├─ ActionPicker / TimePicker / WeekdayPicker / QuickActions
   ├─ SettingsPanel / ThemeToggle / TitleBar / Toast / Toggle / TimeRingsBackground
electron/                    # Main process + preload (real backend)
├─ main.ts                   # Window / tray / IPC / power actions / task scheduler / persistence
└─ preload.ts                # contextBridge exposing window.chronos.* secure API
build/
├─ installer.nsh             # Custom NSIS: clean up \Chronos\ tasks on uninstall
└─ tray.png                  # Tray icon (also packaged as extraResource)
```

---

## 🔌 Renderer ↔ Main Process IPC

The renderer always calls through `src/lib/mock.ts`, which routes to the real IPC via `window.chronos.*`
(injected by preload's `contextBridge`). In browser-preview mode there's no `window.chronos`, so it falls back to a mock — handy for pure-frontend debugging.

| Renderer call | Main channel | Purpose |
|---------------|--------------|---------|
| `executeAction(action)` | `power:execute` | Run shutdown/restart/sleep/hibernate/lock/logoff |
| `syncScheduling(payload)` | `schedule:sync` | Sync plan snapshot: recompute schedule, refresh wake tasks, persist |
| `cancelPendingExecution(id)` | `schedule:cancel-pending` | Cancel the current countdown |
| `runPendingExecutionNow(id)` | `schedule:run-pending-now` | Run the pending action now |
| `setLaunchAtLogin(bool)` | `settings:launch-at-login` | Toggle launch-at-login |
| `setMinimizeToTray(bool)` | `settings:minimize-to-tray` | Toggle minimize-to-tray |
| `minimize / toggleMaximize / close` | `window:*` | Frameless window controls |
| `onPendingExecution(cb)` | `schedule:pending-execution` (event) | Push 30s-prior countdown event |
| `onPendingCleared(cb)` | `schedule:pending-cleared` (event) | Push cancelled / executed / skipped result |

### Main-process scheduling
- Once "Scheduling Mode" is on, the main process computes the nearest upcoming run across all enabled plans & non-`powerOn` rules,
  sets a reminder timer (30s lead) and an execution timer; when the countdown dialog's time hits zero, the system action runs.
- `powerOn` rules never enter the in-process timer — they're **registered as Windows Task Scheduler tasks**
  (`-Weekly -DaysOfWeek … -At … -WakeToRun`) with `Chronos.exe --wake-task --schedule-id … --rule-id …` as the action,
  waking the system at the scheduled time. When the main process detects `--wake-task`, it doesn't steal window focus.
- On plan changes, obsolete tasks are unregistered and new ones registered by diff, keeping the system side in sync with the frontend.

---

## 🎨 Design Notes

- **Minimal, premium, interactive**: softens the "utility" feel without going overboard sci-fi; time-rings background + glassmorphism cards.
- Layout top-to-bottom: master switch → plan list → week timeline → quick actions → settings.
- The accent (indigo→violet signature gradient) runs through glows, buttons, and timeline nodes.
- Light/dark themes driven by CSS vars, smooth transitions; motion respects `prefers-reduced-motion`.

---

## ⚠️ Platform & Limitations

- This version supports **Windows only**; the main process explicitly errors on power actions when `process.platform !== 'win32'`.
- "Power on / wake" depends on the Task Scheduler + the motherboard's **BIOS/UEFI RTC wake** support;
  if the hardware disables wake or the machine is fully powered off (unplugged), the wake task won't fire.
- The app is unsigned, so the first run may trigger a Windows SmartScreen warning — choose "Run anyway".

---

## 📄 License

[MIT](./LICENSE)
