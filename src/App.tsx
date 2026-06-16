import { useEffect, useState } from 'react';
import { TimeRingsBackground } from '@/components/TimeRingsBackground';
import { TitleBar } from '@/components/TitleBar';
import { MasterSwitch } from '@/components/MasterSwitch';
import { ScheduleList } from '@/components/ScheduleList';
import { WeekTimeline } from '@/components/WeekTimeline';
import { QuickActions } from '@/components/QuickActions';
import { SettingsPanel } from '@/components/SettingsPanel';
import { ScheduleEditor } from '@/components/ScheduleEditor';
import { PendingExecutionDialog } from '@/components/PendingExecutionDialog';
import { ToastHost } from '@/components/Toast';
import { syncScheduling } from '@/lib/mock';
import { useScheduleStore } from '@/store/scheduleStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';
import { useTheme } from '@/lib/useTheme';
import type { Schedule } from '@/types';

export default function App() {
  useTheme();

  const schedules = useScheduleStore((s) => s.schedules);
  const masterEnabled = useSettingsStore((s) => s.masterEnabled);
  const theme = useSettingsStore((s) => s.theme);
  const minimizeToTray = useSettingsStore((s) => s.minimizeToTray);
  const launchAtLogin = useSettingsStore((s) => s.launchAtLogin);
  const push = useToastStore((s) => s.push);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [targetRuleId, setTargetRuleId] = useState<string | null>(null);
  const [editorSession, setEditorSession] = useState(0);

  useEffect(() => {
    let alive = true;
    void syncScheduling({
      masterEnabled,
      schedules,
      settings: {
        masterEnabled,
        theme,
        minimizeToTray,
        launchAtLogin,
      },
    }).catch((error) => {
      if (!alive) return;
      push(error instanceof Error ? error.message : '后端同步失败', 'error');
    });

    return () => {
      alive = false;
    };
  }, [launchAtLogin, masterEnabled, minimizeToTray, push, schedules, theme]);

  const openEditor = (s?: Schedule, ruleId?: string) => {
    setEditing(s ?? null);
    setTargetRuleId(ruleId ?? null);
    setEditorSession((v) => v + 1);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setTargetRuleId(null);
  };

  return (
    <div className="flex h-full flex-col">
      <TimeRingsBackground />
      <TitleBar />

      {/* 可滚动主内容 */}
      <main className="scrollbar-none flex-1 overflow-y-auto px-5 pb-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5 pt-2">
          <MasterSwitch />
          <ScheduleList onOpenEditor={openEditor} />
          <WeekTimeline
            onOpenEditor={() => openEditor()}
            onSelectRule={(rule, schedule) => openEditor(schedule, rule.id)}
          />
          <QuickActions />
          <SettingsPanel />
        </div>
      </main>

      <ScheduleEditor
        key={`${editing?.id ?? 'new'}-${editorSession}`}
        schedule={editing}
        open={editorOpen}
        targetRuleId={targetRuleId}
        onClose={closeEditor}
      />
      <PendingExecutionDialog />
      <ToastHost />
    </div>
  );
}
