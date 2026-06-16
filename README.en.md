<p align="center">
  <img src="build/tray.png" alt="Chronos" width="80" height="80" />
</p>

<h1 align="center">Chronos · Smart Auto Power Scheduler</h1>

<p align="center">
  Give your PC its own rhythm — scheduled shutdown, restart, hibernate, lock screen, and wake. Fully automated.
</p>

<p align="center">
  English · <a href="./README.md">简体中文</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-31-47848f?logo=electron&logoColor=white" alt="Electron" />
  <img src="https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178c6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-3-06b6d4?logo=tailwindcss&logoColor=white" alt="Tailwind" />
  <img src="https://img.shields.io/badge/Windows-10%2F11-0078d6?logo=windows&logoColor=white" alt="Windows" />
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License" />
</p>

---

## What is this

**Chronos** is a Windows desktop app that lets you set power schedules for your PC — just like setting an alarm. It automatically runs shutdown, power-on, restart, hibernate, lock, logoff, or sleep at the times you specify, on the days you choose.

For example: **auto power-on at 8 AM on weekdays, auto shutdown at 11 PM** — set it once, and it runs every day.

Every action fires precisely at the scheduled time. Real power commands are executed by Windows system utilities, and wake-up is handled by the native Task Scheduler.

---

## Use Cases

- **Office workers**: auto power-on each morning, auto shutdown after work, flexible weekend schedules
- **Download rigs / media servers**: auto shutdown late at night to save power, wake up in the morning
- **Parental controls**: set allowed usage windows for children's computers
- **Scheduled restarts**: auto restart overnight to keep the system stable

---

## Features

- 🎛️ **Master switch**: one-click enable/disable all schedules, with live countdown and next-run preview
- 📋 **Composite plans**: create multiple plans, each with multiple rules (different actions at different times)
- 📅 **Week timeline**: 7-column grid showing all scheduled actions, with gentle conflict hints
- ⚡ **Quick actions**: instantly run shutdown, restart, sleep, and more — no waiting for a schedule
- 🔔 **Pre-execution reminder**: 30-second countdown dialog before each action, with cancel or run-now options
- 🎨 **Light / dark themes**: follow your system or pick manually, with a glassmorphism card aesthetic
- 📌 **System tray**: minimize to tray, run silently in the background
- 🚀 **Launch at login**: start hidden on boot
- 🔒 **Single-instance lock**: re-launching focuses the existing window

### Power Actions

| Action | Implementation |
|--------|----------------|
| Shutdown | `shutdown.exe /s /t 0` |
| Restart | `shutdown.exe /r /t 0` |
| Power on / Wake | Windows Task Scheduler `WakeToRun` (requires BIOS/UEFI RTC wake) |
| Sleep | PowerShell invoking `SetSuspendState` |
| Hibernate | `shutdown.exe /h` |
| Lock | `rundll32.exe user32.dll,LockWorkStation` |
| Logoff | `shutdown.exe /l` |

---

## Quick Start

**Prerequisites**: [Node.js](https://nodejs.org) 18+

```bash
# Install dependencies
npm install

# Frontend-only preview (browser, fastest, no Electron backend)
npm run dev

# Electron desktop dev (full features with real power/task-scheduler backend)
npm run electron:dev

# Build NSIS installer
npm run build
```

Build artifacts in `release/`:
- `Chronos Setup 0.1.0.exe` — NSIS installer (~77 MB)
- `win-unpacked/` — portable version, run `Chronos.exe` directly

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Desktop Shell | Electron 31 |
| Renderer | React 18 + TypeScript 5 |
| Build | Vite 5 (vite-plugin-electron) |
| State | Zustand (persist middleware) |
| Styling | Tailwind CSS 3 + CSS-var dual theme |
| Motion | Framer Motion |
| Icons | lucide-react |

---

## Project Structure

```
src/                          # Renderer process
├── App.tsx                   # App shell / layout
├── main.tsx                  # Entry point
├── index.css                 # Styles & theme tokens
├── components/               # UI components
│   ├── MasterSwitch.tsx      # Global schedule toggle
│   ├── ScheduleList.tsx      # Plan list
│   ├── ScheduleEditor.tsx    # Plan editor
│   ├── WeekTimeline.tsx      # Weekly timeline view
│   ├── QuickActions.tsx      # Instant actions
│   ├── SettingsPanel.tsx     # Settings
│   ├── PendingExecutionDialog.tsx  # Countdown dialog
│   └── ...
├── store/                    # State (Zustand)
├── lib/                      # Utilities & IPC bridge
└── types/                    # TypeScript types

electron/                     # Main process
├── main.ts                   # Window / tray / IPC / power / scheduler
└── preload.ts                # Secure IPC bridge

build/
├── installer.nsh             # Custom NSIS script
└── tray.png                  # Tray icon
```

---

## Notes

- **Windows 10/11 only** — power actions on non-Windows platforms will error
- **Power-on / Wake** requires motherboard BIOS/UEFI RTC wake support; fully unplugged machines cannot be woken
- The app is unsigned, so the first launch may trigger a Windows SmartScreen warning — click "Run anyway"
- No admin privileges are required to run the app

---

## License

[MIT](./LICENSE) © 2026 Chronos
