import { motion } from 'framer-motion';
import { Minus, X, Square } from 'lucide-react';
import { win } from '@/lib/mock';
import { ThemeToggle } from './ThemeToggle';

/** 自定义无边框标题栏：可拖拽，左侧品牌，右侧主题 + 窗口控制 */
export function TitleBar() {
  return (
    <div className="drag-region relative z-[300] flex h-11 shrink-0 items-center justify-between px-4">
      {/* 品牌 */}
      <div className="flex items-center gap-2">
        <motion.div
          initial={{ rotate: -20, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="grid h-6 w-6 place-items-center rounded-md bg-gradient-accent text-white shadow-glow"
        >
          <ClockGlyph className="h-3.5 w-3.5" />
        </motion.div>
        <span className="font-display text-[13px] font-semibold tracking-tight text-ink">
          Chronos
        </span>
        <span className="text-[11px] text-ink/40">·</span>
        <span className="text-[11px] text-ink/50">定时开关机</span>
      </div>

      {/* 右侧控件：不参与拖拽 */}
      <div className="no-drag flex items-center gap-1.5">
        <ThemeToggle />
        <WindowButton onClick={() => win().chronos?.minimize()} label="最小化">
          <Minus className="h-3.5 w-3.5" />
        </WindowButton>
        <WindowButton onClick={() => win().chronos?.toggleMaximize()} label="最大化">
          <Square className="h-3 w-3" strokeWidth={2.4} />
        </WindowButton>
        <WindowButton
          onClick={() => win().chronos?.close()}
          label="关闭"
          danger
        >
          <X className="h-3.5 w-3.5" />
        </WindowButton>
      </div>
    </div>
  );
}

function WindowButton({
  children,
  onClick,
  label,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      aria-label={label}
      className={
        'grid h-7 w-7 place-items-center rounded-lg text-ink/60 transition-colors ' +
        (danger
          ? 'hover:bg-red-500/90 hover:text-white'
          : 'hover:bg-ink/10 hover:text-ink')
      }
    >
      {children}
    </motion.button>
  );
}

function ClockGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 7.5V12l3 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
