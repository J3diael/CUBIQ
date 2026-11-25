import { create } from 'zustand';

import type { ThemePreference } from '@/theme/themes';

export type HoldDurationMs = 0 | 300 | 550 | 1000;
export type InspectionSeconds = 8 | 15 | 30;
export type DisplayDecimals = 2 | 3;

export interface TimerSettings {
  inspectionEnabled: boolean;
  inspectionSeconds: InspectionSeconds;
  /** Start sensitivity: how long to hold before the timer is ready. */
  holdMs: HoldDurationMs;
  hapticsEnabled: boolean;
  decimals: DisplayDecimals;
  /** Show "Solving" instead of the running time, for less distraction. */
  hideTimeWhileRunning: boolean;
  keepScreenAwake: boolean;
}

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  inspectionEnabled: false,
  inspectionSeconds: 15,
  holdMs: 300,
  hapticsEnabled: true,
  decimals: 3,
  hideTimeWhileRunning: false,
  keepScreenAwake: true,
};

/**
 * App-wide preferences.
 * Kept in memory for now. Phase 3 persists them to the SQLite `settings` table.
 */
interface SettingsState {
  themePreference: ThemePreference;
  timer: TimerSettings;
  setThemePreference: (preference: ThemePreference) => void;
  updateTimerSettings: (changes: Partial<TimerSettings>) => void;
}

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'dark';

export const useSettingsStore = create<SettingsState>()((set) => ({
  themePreference: DEFAULT_THEME_PREFERENCE,
  timer: DEFAULT_TIMER_SETTINGS,
  setThemePreference: (themePreference) => set({ themePreference }),
  updateTimerSettings: (changes) => set((state) => ({ timer: { ...state.timer, ...changes } })),
}));
