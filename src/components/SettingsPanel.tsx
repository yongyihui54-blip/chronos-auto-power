import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, Info, Minimize2, Power } from 'lucide-react';
import { useSettingsStore } from '@/store/settingsStore';
import { useToastStore } from '@/store/toastStore';
import { Toggle } from './Toggle';

export function SettingsPanel() {
  const [open, setOpen] = useState(false);

  return (
    <section className="glass overflow-hidden rounded-2xl">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <span className="font-display text-[13px] font-semibold tracking-wide text-ink/80">
          设置
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-ink/40" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="px-4"
          >
            <div className="space-y-1 pb-3 pt-1">
              <SettingRow
                Icon={Power}
                label="开机自启动"
                hint="登录后自动运行"
                settingKey="launchAtLogin"
              />
              <SettingRow
                Icon={Minimize2}
                label="最小化到托盘"
                hint="关闭窗口时驻留后台"
                settingKey="minimizeToTray"
              />
              <AboutRow />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function SettingRow({
  Icon,
  label,
  hint,
  settingKey,
}: {
  Icon: typeof Power;
  label: string;
  hint: string;
  settingKey: 'launchAtLogin' | 'minimizeToTray';
}) {
  const value = useSettingsStore((s) => s[settingKey]);
  const setter =
    settingKey === 'launchAtLogin'
      ? useSettingsStore((s) => s.setLaunchAtLogin)
      : useSettingsStore((s) => s.setMinimizeToTray);
  const push = useToastStore((s) => s.push);

  return (
    <div className="flex items-center justify-between rounded-xl px-2 py-2 transition-colors hover:bg-ink/5">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink/5 text-ink/55">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[13px] font-medium text-ink">{label}</p>
          <p className="text-[11px] text-ink/45">{hint}</p>
        </div>
      </div>
      <Toggle
        checked={value}
        onChange={() => {
          setter(!value);
          push(`${label}已${!value ? '开启' : '关闭'}`, 'info');
        }}
      />
    </div>
  );
}

function AboutRow() {
  return (
    <div className="flex items-center justify-between rounded-xl px-2 py-2">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink/5 text-ink/55">
          <Info className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[13px] font-medium text-ink">关于 Chronos</p>
          <p className="text-[11px] text-ink/45">v0.1.0 · Windows 本机版</p>
        </div>
      </div>
    </div>
  );
}
