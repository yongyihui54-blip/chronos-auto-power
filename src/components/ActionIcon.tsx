import { Lock, LogOut, Moon, Power, RefreshCw, Snowflake, Zap } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { ActionMeta } from '@/lib/constants';

/** 动作 icon 名 → lucide 组件 的集中映射，供时间轴、卡片等复用 */
const ICONS = {
  powerOn: Zap,
  power: Power,
  refresh: RefreshCw,
  moon: Moon,
  snowflake: Snowflake,
  lock: Lock,
  logout: LogOut,
} as const;

interface Props extends LucideProps {
  name: ActionMeta['icon'];
}

export function ActionIcon({ name, ...rest }: Props) {
  const Cmp = ICONS[name];
  return <Cmp {...rest} />;
}
