import { motion } from 'framer-motion';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import type { ThemeMode } from '@/types';
import { cn } from '@/lib/utils';

const OPTIONS: { key: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { key: 'light', label: '浅色', Icon: Sun },
  { key: 'dark', label: '深色', Icon: Moon },
  { key: 'system', label: '跟随系统', Icon: Monitor },
];

/** 三态主题切换：浅 / 深 / 跟随系统，带滑块指示 */
export function ThemeToggle() {
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const activeIndex = OPTIONS.findIndex((o) => o.key === theme);

  return (
    <div className="no-drag relative flex items-center gap-0.5 rounded-xl bg-ink/5 p-0.5">
      {/* 滑块背景 */}
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="absolute inset-y-0.5 rounded-[10px] bg-glass shadow-sm"
        style={{
          left: `calc(0.125rem + ${activeIndex} * 1.95rem + ${activeIndex} * 0.125rem)`,
          width: '1.95rem',
        }}
      />
      {OPTIONS.map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => setTheme(key)}
          aria-label={label}
          className={cn(
            'relative z-10 grid h-7 w-[1.95rem] place-items-center rounded-[10px] transition-colors',
            theme === key ? 'text-accent' : 'text-ink/45 hover:text-ink/70',
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.2} />
        </button>
      ))}
    </div>
  );
}
