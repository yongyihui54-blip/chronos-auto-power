import { useEffect } from 'react';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * 根据 theme 设置同步 <html> 的 dark 类。
 * 'system' 时监听 prefers-color-scheme。
 */
export function useTheme(): void {
  const theme = useSettingsStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;

    const apply = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const dark = theme === 'dark' || (theme === 'system' && prefersDark);
      root.classList.toggle('dark', dark);
    };

    apply();
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      mq.addEventListener('change', apply);
      return () => mq.removeEventListener('change', apply);
    }
  }, [theme]);
}
