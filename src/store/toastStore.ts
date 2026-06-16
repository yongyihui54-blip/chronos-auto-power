import { create } from 'zustand';
import type { ToastItem } from '@/types';
import { uid } from '@/lib/utils';

interface ToastState {
  toasts: ToastItem[];
  push: (message: string, tone?: ToastItem['tone']) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, tone = 'success') => {
    const id = uid();
    set((s) => ({ toasts: [...s.toasts, { id, message, tone }] }));
    // 自动消失
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 2600);
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
