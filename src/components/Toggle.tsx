import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: () => void;
  size?: 'sm' | 'lg';
  label?: string;
}

/** 弹性开关。切换时滑块带 spring 弹性，开启有光晕。 */
export function Toggle({ checked, onChange, size = 'sm', label }: ToggleProps) {
  const dims =
    size === 'lg'
      ? { w: 72, h: 38, knob: 30, x: 34, pad: 4 }
      : { w: 42, h: 24, knob: 18, x: 18, pad: 3 };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={(event) => {
        event.stopPropagation();
        onChange();
      }}
      className={cn(
        'relative shrink-0 rounded-full transition-colors duration-300',
        checked
          ? 'bg-gradient-accent shadow-glow'
          : 'bg-ink/15 hover:bg-ink/20',
      )}
      style={{ width: dims.w, height: dims.h, padding: dims.pad }}
    >
      <motion.span
        layout
        animate={{ x: checked ? dims.x : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="grid block place-items-center rounded-full bg-white shadow-md"
        style={{ width: dims.knob, height: dims.knob }}
      >
        {/* 开启时旋钮内的呼吸光点 */}
        {checked && size === 'lg' && (
          <motion.span
            className="h-1.5 w-1.5 rounded-full bg-accent"
            animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </motion.span>

      {/* lg 尺寸显示 ON/OFF 文字 */}
      {size === 'lg' && (
        <span
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 text-[10px] font-bold tracking-wider transition-opacity',
            checked
              ? 'left-3 text-white/80 opacity-100'
              : 'right-3 text-ink/40 opacity-100',
          )}
        >
          {checked ? 'ON' : 'OFF'}
        </span>
      )}
    </button>
  );
}
