import { motion } from 'framer-motion';
import { WEEKDAY_META } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { Weekday } from '@/types';

interface WeekdayPickerProps {
  value: Weekday[];
  onChange: (v: Weekday[]) => void;
}

/** 星期多选胶囊，可"全选"快捷 */
export function WeekdayPicker({ value, onChange }: WeekdayPickerProps) {
  const all = value.length === 0 || value.length === 7;

  const toggle = (d: Weekday) => {
    if (value.includes(d)) {
      const next = value.filter((x) => x !== d);
      onChange(next.length === 0 ? ([1, 2, 3, 4, 5, 6, 7] as Weekday[]) : next);
    } else {
      onChange([...value, d].sort((a, b) => a - b) as Weekday[]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        onClick={() =>
          onChange(all ? ([1, 2, 3, 4, 5] as Weekday[]) : ([] as Weekday[]))
        }
        className={cn(
          'rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors',
          all
            ? 'bg-accent text-white'
            : 'glass-soft text-ink/60 hover:text-ink',
        )}
      >
        每天
      </button>
      <span className="mx-0.5 h-4 w-px bg-ink/10" />
      {WEEKDAY_META.map(({ key, short, full }) => {
        const active = value.includes(key);
        return (
          <button
            key={key}
            onClick={() => toggle(key)}
            aria-label={full}
            className={cn(
              'relative grid h-8 w-8 place-items-center rounded-lg text-[12px] font-medium transition-colors',
              active
                ? 'bg-accent/15 text-accent'
                : 'glass-soft text-ink/55 hover:text-ink',
            )}
          >
            {active && (
              <motion.span
                layoutId={`wd-${key}`}
                className="absolute inset-0 rounded-lg bg-accent/15"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative">{short}</span>
          </button>
        );
      })}
    </div>
  );
}
