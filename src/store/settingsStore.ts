import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, ThemeMode } from '@/types';

interface SettingsState extends AppSettings {
  setMaster: (v: boolean) => void;
  setTheme: (t: ThemeMode) => void;
  setMinimizeToTray: (v: boolean) => void;
  setLaunchAtLogin: (v: boolean) => void;
}

const defaults: AppSettings = {
  masterEnabled: true,
  theme: 'system',
  minimizeToTray: true,
  launchAtLogin: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,
      setMaster: (v) => set({ masterEnabled: v }),
      setTheme: (t) => set({ theme: t }),
      setMinimizeToTray: (v) => set({ minimizeToTray: v }),
      setLaunchAtLogin: (v) => set({ launchAtLogin: v }),
    }),
    { name: 'chronos-settings' },
  ),
);
