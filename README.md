<p align="center">
  <img src="build/tray.png" alt="Chronos" width="80" height="80" />
</p>

<h1 align="center">Chronos · 智能定时开关机</h1>

<p align="center">
  让你的电脑拥有自己的生物钟 —— 定时关机、重启、休眠、锁屏、唤醒，一切自动化
</p>

<p align="center">
  <a href="./README.en.md">English</a> · 简体中文
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

## 这是什么

**Chronos** 是一个 Windows 桌面应用，让你可以像设闹钟一样为电脑设定开关机计划。它可以按周循环，在指定时间自动执行关机、开机、重启、休眠、锁屏、注销、睡眠等操作。

比如：**工作日早上 8 点自动开机，晚上 11 点自动关机** —— 设定一次，每天准时执行。

所有计划在你设定的时间精确触发，真正的开关机由 Windows 系统命令执行，开机唤醒则通过系统的任务计划程序托管。

---

## 使用场景

- **上班族**：工作日早上自动开机，下班后自动关机，周末灵活安排
- **下载党 / 媒体服务器**：深夜自动关机省电，早上恢复
- **家长控制**：设定孩子的电脑使用时间窗口
- **定时重启**：深夜自动重启以保持系统稳定

---

## 功能一览

- 🎛️ **总闸控制**：一键开启 / 关闭所有定时，带实时倒计时和下次执行预览
- 📋 **组合计划**：创建多个计划，每个计划可包含多条时间规则（不同动作 + 不同时刻）
- 📅 **周视图**：七列网格一览整周的定时安排，同一时间的冲突温和提示
- ⚡ **快速操作**：随时手动执行关机、重启、睡眠等操作，无需等待定时
- 🔔 **执行前提醒**：到点前 30 秒弹窗倒计时，可取消或立即执行
- 🎨 **浅色 / 深色主题**：跟随系统或手动切换，玻璃拟态卡片风格
- 📌 **系统托盘驻留**：最小化到托盘，后台静默运行
- 🚀 **开机自启**：登录后自动隐藏启动
- 🔒 **单实例锁**：重复启动自动聚焦到已有窗口

### 支持的操作

| 操作 | 说明 |
|------|------|
| 关机 | `shutdown.exe /s /t 0` |
| 重启 | `shutdown.exe /r /t 0` |
| 开机 / 唤醒 | 系统任务计划程序 `WakeToRun`（需 BIOS/UEFI RTC 唤醒支持） |
| 睡眠 | PowerShell 调用 `SetSuspendState` |
| 休眠 | `shutdown.exe /h` |
| 锁屏 | `rundll32.exe user32.dll,LockWorkStation` |
| 注销 | `shutdown.exe /l` |

---

## 快速开始

**环境要求**：[Node.js](https://nodejs.org) 18+

```bash
# 安装依赖
npm install

# 纯前端预览（浏览器，最快，不启动 Electron 后端）
npm run dev

# Electron 桌面开发（完整功能，含真实电源 / 任务计划后端）
npm run electron:dev

# 打包安装程序（NSIS 安装包）
npm run build
```

打包产物位于 `release/` 文件夹：
- `Chronos Setup 0.1.0.exe` — NSIS 安装包（~77 MB）
- `win-unpacked/` — 免安装解包版，直接运行 `Chronos.exe`

---

## 技术栈

| 层 | 技术 |
|----|------|
| 桌面壳 | Electron 31 |
| 渲染 | React 18 + TypeScript 5 |
| 构建 | Vite 5（vite-plugin-electron） |
| 状态管理 | Zustand（persist 持久化） |
| 样式 | Tailwind CSS 3 + CSS 变量双主题 |
| 动效 | Framer Motion |
| 图标 | lucide-react |

---

## 项目结构

```
src/                          # 渲染进程
├── App.tsx                   # 主页面编排
├── main.tsx                  # 入口
├── index.css                 # 样式 & 主题变量
├── components/               # UI 组件
│   ├── MasterSwitch.tsx      # 总闸开关
│   ├── ScheduleList.tsx      # 计划列表
│   ├── ScheduleEditor.tsx    # 计划编辑器
│   ├── WeekTimeline.tsx      # 周视图
│   ├── QuickActions.tsx      # 快速操作
│   ├── SettingsPanel.tsx     # 设置面板
│   ├── PendingExecutionDialog.tsx  # 执行倒计时
│   └── ...
├── store/                    # 状态管理（Zustand）
├── lib/                      # 工具函数 & IPC 桥接
└── types/                    # TypeScript 类型定义

electron/                     # 主进程
├── main.ts                   # 窗口 / 托盘 / IPC / 电源 / 调度
└── preload.ts                # 安全 IPC 桥接

build/
├── installer.nsh             # NSIS 自定义脚本
└── tray.png                  # 托盘图标
```

---

## 注意事项

- 仅支持 **Windows 10/11**，非 Windows 平台的电源操作会提示错误
- **开机 / 唤醒**功能依赖主板 BIOS/UEFI 的 RTC 唤醒支持；完全断电（拔电源线）时无法唤醒
- 应用未做代码签名，首次运行可能触发 Windows SmartScreen 警告，选择「仍要运行」即可
- 应用无需管理员权限即可运行

---

## License

[MIT](./LICENSE) © 2026 Chronos
