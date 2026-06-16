import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn, parseTime } from '@/lib/utils';

interface TimePickerProps {
  value: string; // "HH:MM"
  onChange: (v: string) => void;
}

const ITEM_H = 28;
const MAX_VISIBLE = 6;

export function TimePicker({ value, onChange }: TimePickerProps) {
  const { h, m } = parseTime(value);
  const [open, setOpen] = useState<null | 'h' | 'm'>(null);

  const set = (nh: number, nm: number) =>
    onChange(`${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`);

  return (
    <div className="flex items-center gap-2 overflow-visible">
      <Field
        value={h}
        open={open === 'h'}
        onToggle={() => setOpen(open === 'h' ? null : 'h')}
        onPick={(v) => {
          set(v, m);
          setOpen(null);
        }}
        range={24}
      />
      <span className="tabular text-xl font-semibold text-ink/40">:</span>
      <Field
        value={m}
        open={open === 'm'}
        onToggle={() => setOpen(open === 'm' ? null : 'm')}
        onPick={(v) => {
          set(h, v);
          setOpen(null);
        }}
        range={60}
      />
    </div>
  );
}

function Field({
  value,
  open,
  onToggle,
  onPick,
  range,
}: {
  value: number;
  open: boolean;
  onToggle: () => void;
  onPick: (v: number) => void;
  range: number;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('bottom');

  useLayoutEffect(() => {
    if (!open) return;

    const root = rootRef.current;
    if (!root) return;

    const rect = root.getBoundingClientRect();
    const listHeight = ITEM_H * MAX_VISIBLE + 8;
    const below = window.innerHeight - rect.bottom;
    const above = rect.top;
    setPlacement(below < listHeight && above > below ? 'top' : 'bottom');
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;

    const list = listRef.current;
    if (!list) return;
    list.scrollTop = Math.max(0, value * ITEM_H - (list.clientHeight - ITEM_H) / 2);
  }, [open, value]);

  useEffect(() => {
    if (!open) return;

    const closeWhenOutside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || listRef.current?.contains(target)) return;
      onToggle();
    };

    document.addEventListener('pointerdown', closeWhenOutside, true);
    return () => document.removeEventListener('pointerdown', closeWhenOutside, true);
  }, [open, onToggle]);

  return (
    <div ref={rootRef} className="relative overflow-visible">
      <button
        type="button"
        onClick={onToggle}
        className="glass-soft flex h-12 w-16 items-center justify-center gap-1 rounded-xl text-ink transition-shadow hover:shadow-glass"
      >
        <span className="tabular text-xl font-semibold">
          {String(value).padStart(2, '0')}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-ink/40" />
      </button>

      {open && (
        <div
          ref={listRef}
          className={cn(
            'glass scrollbar-none absolute left-0 z-50 w-16 overflow-y-auto overflow-x-hidden rounded-xl p-1 shadow-glass-lg',
            placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
          )}
          style={{ maxHeight: ITEM_H * MAX_VISIBLE + 8 }}
        >
          {Array.from({ length: range }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onPick(i)}
              style={{ height: ITEM_H }}
              className={cn(
                'tabular block w-full rounded-md text-center text-[13px] font-medium leading-none transition-colors',
                i === value ? 'bg-accent text-white' : 'text-ink/70 hover:bg-ink/8',
              )}
            >
              {String(i).padStart(2, '0')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
