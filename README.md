<p align="center">
  <strong>Chronos</strong> · 自动定时开关机桌面应用
</p>

<p align="center">
  <a href="./README.en.md">English</a> · 简体中文
</p>

---

# Chronos · 定时开关机桌面应用

电脑定时开关机的桌面应用，基于 **Electron + React + Vite + TypeScript** 构建。
前端负责计划与规则的编排交互，主进程接入 **Windows 系统电源命令** 与 **任务计划程序**，
让开关机/重启/睡眠/休眠/锁屏/注销真正生效，「开机/唤醒」由 Windows 任务计划程序托管（`WakeToRun`）。

> 当前为 Windows 平台版本。关机/重启/休眠/锁屏/注销/睡眠通过系统命令实现；
> 「开机」在完全断电后依赖 BIOS/UEFI 的 RTC 唤醒能力，由任务计划程序在到点时唤醒系统。

---

## ✨ 功能特性

### 调度与执行（真实后端）
- **全局「定时模式」总闸**（`MasterSwitch`）：启用时强调色光晕 + 下次执行预览 + 实时倒计时。
- **多个组合计划**：卡片列表（`ScheduleList` / `ScheduleCard`），支持选中、整组启停、编辑、删除，hover 浮起 + 菜单。
- **周时间编排视图**（`WeekTimeline`）：周一→周日七列网格，按时间排序展示当天所有启用计划的规则节点；
  **同一时刻存在多个动作时显示柔和冲突提示**；点击节点跳转到对应计划编辑器；高亮「今天」列。
- **组合计划编辑器**（`ScheduleEditor`）：弹层式，支持多条规则的增删改，含动作选择、24h 时间、星期选择、效果预览。
- **规则编辑控件**：`ActionPicker` / `TimePicker` / `WeekdayPicker`，均带交互动效。
- **执行前提醒**：到点前 30 秒弹出倒计时对话框（`PendingExecutionDialog`），可**取消本次**或**立即执行**。
- **同步即生效**：计划/设置变更会即时通过 IPC 同步到主进程，重新计算下一次执行并刷新系统任务。

### 电源动作
| 动作 | 实现方式 |
|------|----------|
| `shutdown` 关机 | `shutdown.exe /s /t 0` |
| `restart` 重启 | `shutdown.exe /r /t 0` |
| `hibernate` 休眠 | `shutdown.exe /h` |
| `lock` 锁屏 | `rundll32.exe user32.dll,LockWorkStation` |
| `logoff` 注销 | `shutdown.exe /l` |
| `sleep` 睡眠 | PowerShell 调 `powrprof.dll` 的 `SetSuspendState` |
| `powerOn` 开机 | **系统计划托管**：任务计划程序 `-WakeToRun`，完全断电需 BIOS/UEFI RTC 唤醒 |

### 体验与主题
- **主题**：浅色 / 深色 / 跟随系统（`ThemeToggle` + `useTheme`），持久化到 localStorage，切换颜色平滑过渡。
- **动效**：framer-motion 驱动的进入/hover/拖拽动画；全局尊重 `prefers-reduced-motion`，自动降级。
- **系统托盘**：驻留托盘，最小化到托盘可配置；右键菜单显示运行状态，单击还原窗口。
- **开机自启动**：可选，登录后以 `--background` 隐藏启动。
- **单实例锁**：重复启动会聚焦到已有窗口；唤醒任务触发的二次实例不会抢焦点。
- **Toast 通知** + **自定义标题栏**（无边框窗口控制）+ **时间环背景**（`TimeRingsBackground`）。
- **快速操作**面板（立即执行电源动作）。
- **数据持久化**：前端 zustand persist（`chronos-schedules-v2` / `chronos-settings`）；
  主进程状态持久化到 `userData/chronos-backend.json`（含计划快照、唤醒任务记录、托盘/自启设置）。
- 预置示例计划（工作日早八开机 + 晚十一点半关机 + 周末午睡、周末深夜模式）。

---

## 🚀 运行与打包

需要 [Node.js](https://nodejs.org)（建议 18+），随后：

```bash
npm install        # 若 node_modules 已存在可跳过

# 1) 纯前端预览（浏览器，最快，不启动 Electron 主进程）
npm run dev
# 打开 http://localhost:5173

# 2) Electron 桌面开发（启动主进程 + 真实电源/任务计划后端）
npm run electron:dev

# 3) 类型检查
npm run lint

# 4) 打包安装程序（前端构建 + electron-builder NSIS）
npm run build
```

打包产物位于 `release/`：
- `Chronos Setup 0.1.0.exe` —— NSIS 安装包（约 77 MB）
- `Chronos Setup 0.1.0.exe.blockmap` —— 增量更新索引
- `win-unpacked/` —— 免安装解包目录（可直接运行 `Chronos.exe`）

### 运行时权限与依赖
- 关机/重启/休眠等动作本身由系统命令执行，应用本身**不需要管理员权限**即可运行。
- 「开机/唤醒」任务以**当前用户**身份注册到任务计划程序的 `\Chronos\` 路径下（`LogonType Interactive`、`RunLevel Limited`），
  卸载时由 `build/installer.nsh` 自动清理该路径下的全部任务。
- 调试时可用 `CHRONOS_DRY_RUN=true` 跑主进程，电源命令会以 `[dry-run]` 打印而不真正执行。

---

## 🧱 技术栈

| 层 | 技术 |
|----|------|
| 桌面壳 | Electron 31 |
| 渲染层 | React 18 + TypeScript 5 |
| 构建 | Vite 5（vite-plugin-electron） |
| 状态 | Zustand（persist 中间件） |
| 样式 | Tailwind CSS 3 + CSS 变量双主题（玻璃拟态） |
| 动效 | Framer Motion |
| 图标 | lucide-react |
| 系统 | Windows `shutdown.exe` / `rundll32.exe` / PowerShell + `powrprof.dll` / 任务计划程序 |

---

## 📁 目录结构

```
src/
├─ main.tsx                  # 渲染层入口
├─ App.tsx                   # 应用编排：总闸 / 计划列表 / 周编排 / 快速操作 / 设置
├─ index.css                 # Tailwind + 设计令牌（浅/深双主题，CSS 变量）
├─ types/index.ts            # 领域模型 ActionType / Rule / Schedule / ThemeMode
├─ lib/
│  ├─ constants.ts           # 动作元信息（含 powerOn 系统托管）/ 星期元信息
│  ├─ utils.ts               # 冲突检测 / 下次执行计算 / 倒计时 / 文案格式化
│  ├─ mock.ts                # IPC 桥接层：有 window.chronos 就调真实后端，否则回退 mock
│  └─ useTheme.ts            # 主题同步 <html> + prefers-color-scheme 监听
├─ store/
│  ├─ scheduleStore.ts       # 计划/规则 CRUD（persist）
│  ├─ settingsStore.ts       # 应用设置（persist）
│  └─ toastStore.ts          # Toast 队列
└─ components/
   ├─ WeekTimeline.tsx       # 周时间编排视图（七列网格 + 冲突提示）
   ├─ ActionIcon.tsx         # 动作图标集中映射（powerOn/shutdown/…）
   ├─ PendingExecutionDialog.tsx  # 执行前 30s 倒计时弹层（取消 / 立即执行）
   ├─ MasterSwitch / ScheduleList / ScheduleCard / ScheduleEditor
   ├─ ActionPicker / TimePicker / WeekdayPicker / QuickActions
   ├─ SettingsPanel / ThemeToggle / TitleBar / Toast / Toggle / TimeRingsBackground
electron/                    # 主进程 + preload（真实后端实现）
├─ main.ts                   # 窗口/托盘/IPC/电源动作/任务计划/持久化/调度定时器
└─ preload.ts                # contextBridge 暴露 window.chronos.* 安全 API
build/
├─ installer.nsh             # 自定义 NSIS：卸载时清理 \Chronos\ 计划任务
└─ tray.png                  # 托盘图标（同时打入 extraResources）
```

---

## 🔌 渲染层 ↔ 主进程 IPC

渲染进程统一通过 `src/lib/mock.ts` 调用，经 `window.chronos.*` 走真实 IPC（preload 用 `contextBridge` 注入）。
浏览器预览模式下没有 `window.chronos`，会自动回退到 mock 实现，便于纯前端调试。

| 渲染层调用 | 主进程通道 | 作用 |
|-----------|-----------|------|
| `executeAction(action)` | `power:execute` | 执行关机/重启/睡眠/休眠/锁屏/注销 |
| `syncScheduling(payload)` | `schedule:sync` | 同步计划快照：重算调度、刷新唤醒任务、持久化 |
| `cancelPendingExecution(id)` | `schedule:cancel-pending` | 取消当前到点倒计时 |
| `runPendingExecutionNow(id)` | `schedule:run-pending-now` | 立即执行当前挂起的动作 |
| `setLaunchAtLogin(bool)` | `settings:launch-at-login` | 开机自启动开关 |
| `setMinimizeToTray(bool)` | `settings:minimize-to-tray` | 最小化到托盘开关 |
| `minimize / toggleMaximize / close` | `window:*` | 无边框窗口控制 |
| `onPendingExecution(cb)` | `schedule:pending-execution`（事件） | 到点前 30s 推送倒计时事件 |
| `onPendingCleared(cb)` | `schedule:pending-cleared`（事件） | 推送取消/已执行/跳过结果 |

### 主进程调度机制
- 启用「定时模式」后，主进程按所有启用计划、所有非 `powerOn` 规则计算最近一次执行时刻，
  设定提醒定时器（提前 30 秒）与执行定时器；倒计时窗口弹出后到点自动执行系统动作。
- `powerOn` 规则不进入进程内定时器，而是**注册为 Windows 任务计划程序任务**（`-Weekly -DaysOfWeek … -At … -WakeToRun`），
  以 `Chronos.exe --wake-task --schedule-id … --rule-id …` 为动作，到点唤醒系统；主进程检测到 `--wake-task` 启动参数时不抢窗口焦点。
- 计划变更时按差集注销旧任务、注册新任务，保持系统侧与前端一致。

---

## 🎨 设计要点

- **简约高级、互动性强**：弱化纯工具感，避免过度科幻化；时间环背景 + 玻璃拟态卡片。
- 主区域自上而下：总闸 → 计划列表 → 周时间编排 → 快速操作 → 设置。
- 强调色（靛蓝→紫罗兰签名渐变）贯穿光晕、按钮、时间轴节点。
- 浅/深双主题由 CSS 变量驱动，切换平滑过渡；动效尊重 `prefers-reduced-motion`。

---

## ⚠️ 平台与限制

- 当前版本仅支持 **Windows**；主进程对 `process.platform !== 'win32'` 的电源动作会显式报错。
- 「开机/唤醒」依赖系统任务计划程序 + 主板 BIOS/UEFI 的 **RTC 唤醒** 支持；
  若硬件关闭了唤醒功能或处于完全断电（拔电源）状态，唤醒任务无法生效。
- 应用未做代码签名，首次运行可能触发 Windows SmartScreen 警告，需手动「仍要运行」。
