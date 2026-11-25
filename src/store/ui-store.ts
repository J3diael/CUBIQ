import { create } from 'zustand';

interface UiState {
  /** True during inspection or a solve: the tab bar hides and the timer takes the screen. */
  timerFocusMode: boolean;
  setTimerFocusMode: (value: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  timerFocusMode: false,
  setTimerFocusMode: (timerFocusMode) => set({ timerFocusMode }),
}));
