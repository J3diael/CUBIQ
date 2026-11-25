import { create } from 'zustand';

import type { ThemePreference } from '@/theme/themes';

/**
 * App-wide preferences.
 * Phase 1 keeps these in memory only. Phase 3 persists them to the SQLite `settings` table.
 */
interface SettingsState {
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
}

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'dark';

export const useSettingsStore = create<SettingsState>()((set) => ({
  themePreference: DEFAULT_THEME_PREFERENCE,
  setThemePreference: (themePreference) => set({ themePreference }),
}));
