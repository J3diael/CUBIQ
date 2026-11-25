import { create } from 'zustand';

export interface Toast {
  id: number;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface UiState {
  /** True during inspection or a solve: the tab bar hides and the timer takes the screen. */
  timerFocusMode: boolean;
  setTimerFocusMode: (value: boolean) => void;
  /** Short message at the bottom of the screen, such as "Solve deleted · Undo". */
  toast: Toast | null;
  showToast: (toast: Omit<Toast, 'id'>) => void;
  hideToast: (id?: number) => void;
}

let toastId = 0;

export const useUiStore = create<UiState>()((set, get) => ({
  timerFocusMode: false,
  setTimerFocusMode: (timerFocusMode) => set({ timerFocusMode }),
  toast: null,
  showToast: (toast) => set({ toast: { ...toast, id: ++toastId } }),
  hideToast: (id) => {
    if (id === undefined || get().toast?.id === id) set({ toast: null });
  },
}));
