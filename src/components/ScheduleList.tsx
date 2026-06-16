import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useScheduleStore } from '@/store/scheduleStore';
import { countRules } from '@/lib/utils';
import { ScheduleCard } from './ScheduleCard';
import type { Schedule } from '@/types';

interface ScheduleListProps {
  onOpenEditor: (schedule?: Schedule, ruleId?: string) => void;
}

export function ScheduleList({ onOpenEditor }: ScheduleListProps) {
  const schedules = useScheduleStore((s) => s.schedules);
  const ruleCount = countRules(schedules);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="flex items-baseline gap-2">
          <h3 className="font-display text-[13px] font-semibold tracking-wide text-ink/80">
            我的计划
          </h3>
          <span className="text-[11px] text-ink/40">
            {schedules.length} 个计划 · {ruleCount} 条规则
          </span>
        </div>
        <button
          onClick={() => onOpenEditor()}
          className="group flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-accent transition-colors hover:bg-accent/10"
        >
          <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" strokeWidth={2.6} />
          新建计划
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {schedules.map((s, i) => (
          <ScheduleCard key={s.id} schedule={s} index={i} onEdit={(ruleId) => onOpenEditor(s, ruleId)} />
        ))}

        {/* 添加占位卡 */}
        <AddCard onClick={() => onOpenEditor()} />
      </div>
    </section>
  );
}

function AddCard({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex h-[108px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink/15 text-ink/40 transition-colors hover:border-accent/50 hover:text-accent"
    >
      <Plus className="h-5 w-5" strokeWidth={2.2} />
      <span className="text-[12px] font-medium">添加计划</span>
    </motion.button>
  );
}
