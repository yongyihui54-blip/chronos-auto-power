import { motion } from 'framer-motion';
import { Layers, MoreVertical, Trash2, Pencil } from 'lucide-react';
import { useState } from 'react';
import { useScheduleStore } from '@/store/scheduleStore';
import { useToastStore } from '@/store/toastStore';
import { ACTION_META } from '@/lib/constants';
import { cn, formatWeekdays } from '@/lib/utils';
import type { Rule, Schedule } from '@/types';
import { Toggle } from './Toggle';
import { ActionIcon } from './ActionIcon';

interface ScheduleCardProps {
  schedule: Schedule;
  index: number;
  onEdit: (ruleId?: string) => void;
}

export function ScheduleCard({ schedule, index, onEdit }: ScheduleCardProps) {
  const toggle = useScheduleStore((s) => s.toggleSchedule);
  const remove = useScheduleStore((s) => s.removeSchedule);
  const push = useToastStore((s) => s.push);
  const [menuOpen, setMenuOpen] = useState(false);

  // 首条规则的色相作为卡片主色调
  const primaryHue = schedule.rules[0]
    ? ACTION_META[schedule.rules[0].action].hue
    : 248;

  const openEditor = (ruleId?: string) => {
    setMenuOpen(false);
    onEdit(ruleId);
  };

  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, select, textarea')) return;
    openEditor();
  };

  const handleCardKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openEditor();
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 260, damping: 22 }}
      whileHover={{ y: -4 }}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`编辑 ${schedule.name}`}
      className={cn(
        'group glass relative cursor-pointer overflow-hidden rounded-2xl p-4 transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
        schedule.enabled ? 'shadow-glass' : 'opacity-70',
      )}
    >
      {/* 左侧主色条 */}
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{
          background: `linear-gradient(180deg, hsl(${primaryHue} 80% 65%), hsl(${primaryHue + 30} 80% 60%))`,
          opacity: schedule.enabled ? 1 : 0.4,
        }}
      />

      {/* 顶部：图标 + 名称 + 菜单 */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl"
            style={{
              backgroundColor: `hsl(${primaryHue} 80% 60% / 0.14)`,
              color: `hsl(${primaryHue} 80% 58%)`,
            }}
          >
            <Layers className="h-4 w-4" strokeWidth={2.4} />
          </span>
          <div className="min-w-0">
            <h4 className="flex items-center gap-1.5 text-[13px] font-semibold text-ink">
              <span className="truncate">{schedule.name}</span>
              <span className="shrink-0 rounded-full bg-ink/8 px-1.5 text-[10px] font-medium text-ink/45">
                {schedule.rules.length} 条
              </span>
            </h4>
          </div>
        </div>

        {/* 更多操作 */}
        <div className="relative no-drag" onClick={(event) => event.stopPropagation()}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="grid h-6 w-6 place-items-center rounded-md text-ink/40 opacity-0 transition-all hover:bg-ink/10 hover:text-ink group-hover:opacity-100"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="glass absolute right-0 top-7 z-20 w-28 overflow-hidden rounded-xl p-1 shadow-glass-lg"
              >
                <MenuButton
                  icon={<Pencil className="h-3.5 w-3.5" />}
                  label="编辑"
                  onClick={() => {
                    setMenuOpen(false);
                    openEditor();
                  }}
                />
                <MenuButton
                  icon={<Trash2 className="h-3.5 w-3.5" />}
                  label="删除"
                  danger
                  onClick={() => {
                    setMenuOpen(false);
                    remove(schedule.id);
                    push('已删除计划', 'info');
                  }}
                />
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* 规则列表：内联平铺 */}
      <div className="mt-3 max-h-40 space-y-1 overflow-y-auto scrollbar-none">
        {schedule.rules.map((rule) => (
          <RuleRow
            key={rule.id}
            rule={rule}
            dim={!schedule.enabled}
            onClick={() => openEditor(rule.id)}
          />
        ))}
      </div>

      {/* 底部总开关 */}
      <div className="mt-3 flex items-center justify-between border-t border-ink/8 pt-3">
        <span className="text-[11px] text-ink/45">
          {schedule.enabled ? '整组已启用' : '已停用'}
        </span>
        <Toggle
          checked={schedule.enabled}
          onChange={() => toggle(schedule.id)}
          label={`${schedule.name} 总开关`}
        />
      </div>
    </motion.div>
  );
}

/** 单条规则展示行：左侧细色条 + 大时间 + 动作 + 星期 */
function RuleRow({
  rule,
  dim,
  onClick,
}: {
  rule: Rule;
  dim?: boolean;
  onClick: () => void;
}) {
  const meta = ACTION_META[rule.action];
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      aria-label={`编辑 ${rule.time} ${meta.label}`}
      className={cn(
        'group/row flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
        dim && 'opacity-60',
      )}
    >
      <span
        className="h-6 w-0.5 shrink-0 rounded-full transition-all group-hover/row:w-1"
        style={{ background: `hsl(${meta.hue} 80% 60%)` }}
      />
      <ActionIcon
        name={meta.icon}
        className="h-3.5 w-3.5 shrink-0"
        strokeWidth={2.4}
        style={{ color: `hsl(${meta.hue} 80% 55%)` }}
      />
      <span className="tabular text-[15px] font-semibold text-ink">{rule.time}</span>
      <span className="text-[11px] font-medium text-ink/55">{meta.label}</span>
      <span className="ml-auto truncate text-[11px] text-ink/40">
        {formatWeekdays(rule.weekdays)}
      </span>
    </button>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors',
        danger
          ? 'text-red-500 hover:bg-red-500/10'
          : 'text-ink/70 hover:bg-ink/8 hover:text-ink',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
