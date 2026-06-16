import { motion } from 'framer-motion';
import { ACTION_LIST } from '@/lib/constants';
import type { ActionMeta } from '@/lib/constants';
import { cn } from '@/lib/utils';
import type { ActionType } from '@/types';
import { ActionIcon } from './ActionIcon';

interface ActionPickerProps {
  value: ActionType;
  onChange: (v: ActionType) => void;
}

export function ActionPicker({ value, onChange }: ActionPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {ACTION_LIST.map((meta) => (
        <ActionChip
          key={meta.key}
          meta={meta}
          active={value === meta.key}
          onClick={() => onChange(meta.key)}
        />
      ))}
    </div>
  );
}

function ActionChip({
  meta,
  active,
  onClick,
}: {
  meta: ActionMeta;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center gap-1.5 rounded-2xl border py-3 transition-all',
        active
          ? 'border-transparent text-white shadow-glow'
          : 'border-ink/10 glass-soft text-ink/60 hover:text-ink',
      )}
      style={
        active
          ? { background: `linear-gradient(135deg, hsl(${meta.hue} 80% 58%), hsl(${meta.hue + 30} 80% 55%))` }
          : undefined
      }
    >
      <ActionIcon name={meta.icon} className="h-4 w-4" strokeWidth={2.4} />
      <span className="text-[12px] font-semibold">{meta.label}</span>
      {meta.systemHosted && (
        <span className="absolute right-1.5 top-1.5 rounded-full bg-black/20 px-1.5 py-px text-[8px] font-bold leading-tight text-white/90">
          托管
        </span>
      )}
    </motion.button>
  );
}
