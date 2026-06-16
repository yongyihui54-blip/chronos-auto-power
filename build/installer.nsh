; ===== Chronos 自定义安装页：桌面快捷方式选项 =====
; electron-builder 分两遍编译：先 BUILD_UNINSTALLER（生成卸载器），再编主安装器。
; 页面与页面函数仅属于主安装器，用 !ifndef BUILD_UNINSTALLER 隔离，避免卸载器阶段触发 NSIS 6010。
!ifndef BUILD_UNINSTALLER
!include "nsDialogs.nsh"
!include "LogicLib.nsh"

; 复选框状态：1 = 创建桌面快捷方式（默认），0 = 不创建。
; 静默安装 / 升级跳过页面时此变量保持默认值。
Var ChronosDesktopShortcut
Var ChronosDesktopCheckbox

; ---- 自定义页面：紧接「选择安装目录」页之后 ----
!macro customPageAfterChangeDir
  Page custom ChronosDesktopShortcutPageCreate ChronosDesktopShortcutPageLeave
!macroend

Function ChronosDesktopShortcutPageCreate
  StrCpy $ChronosDesktopShortcut "1"

  nsDialogs::Create 1018
  Pop $0
  StrCmp $0 "error" 0 +2
  Abort

  ${NSD_CreateCheckbox} 0 0 100% 12u "创建桌面快捷方式"
  Pop $ChronosDesktopCheckbox
  ${NSD_SetState} $ChronosDesktopCheckbox ${BST_CHECKED}

  nsDialogs::Show
FunctionEnd

Function ChronosDesktopShortcutPageLeave
  ${NSD_GetState} $ChronosDesktopCheckbox $0
  StrCmp $0 ${BST_CHECKED} 0 +3
  StrCpy $ChronosDesktopShortcut "1"
  Goto +2
  StrCpy $ChronosDesktopShortcut "0"
FunctionEnd
!endif

; ---- 安装阶段：若用户未勾选，删除模板已创建的桌面快捷方式 ----
; 执行顺序：setLinkVars → addDesktopLink(创建) → customInstall(本宏)。
; addDesktopLink 受编译期 DO_NOT_CREATE_DESKTOP_SHORTCUT 与运行期 --no-desktop-shortcut 控制，
; 无法直接接复选框，故此处用"先创建再按需删除"的方式。
!macro customInstall
  StrCmp $ChronosDesktopShortcut "0" 0 +3
  IfFileExists "$newDesktopLink" 0 +2
  Delete "$newDesktopLink"
!macroend

; ---- 卸载阶段：清理 Chronos 注册的 Windows 计划任务 ----
!macro customUnInstall
  ExecWait `"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -Command "Get-ScheduledTask -TaskPath '\Chronos\' -ErrorAction SilentlyContinue | Unregister-ScheduledTask -Confirm:$$false -ErrorAction SilentlyContinue"`
!macroend
