import { z } from 'zod';
import { create } from 'zustand';

import { getDatabase } from '@/database/client';
import { getSetting, setSetting } from '@/database/repositories/settings-repository';
import type { ThemePreference } from '@/theme/themes';

export type HoldDurationMs = 0 | 300 | 550 | 1000;
export type InspectionSeconds = 8 | 15 | 30;
export type DisplayDecimals = 2 | 3;
export const TIMER_SIZES = ['small', 'medium', 'large', 'huge'] as const;
export type TimerSize = (typeof TIMER_SIZES)[number];
export const TIMER_COLORS = ['default', 'accent', 'green', 'amber'] as const;
export type TimerColor = (typeof TIMER_COLORS)[number];
export const TIMER_BACKGROUNDS = ['default', 'surface', 'black'] as const;
export type TimerBackground = (typeof TIMER_BACKGROUNDS)[number];

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
  soundEnabled: boolean;
  timerSize: TimerSize;
  timerColor: TimerColor;
  timerBackground: TimerBackground;
  /** Show whole seconds while running (ignored when the time is hidden). */
  secondsOnlyWhileRunning: boolean;
  /** Let the Timer tab rotate to landscape. The rest of the app stays portrait. */
  allowLandscape: boolean;
}

export const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  inspectionEnabled: false,
  inspectionSeconds: 15,
  holdMs: 300,
  hapticsEnabled: true,
  decimals: 3,
  hideTimeWhileRunning: false,
  keepScreenAwake: true,
  soundEnabled: false,
  timerSize: 'medium',
  timerColor: 'default',
  timerBackground: 'default',
  secondsOnlyWhileRunning: false,
  allowLandscape: false,
};

export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'dark';

/** Keys in the SQLite `settings` table. */
export const SETTING_KEYS = {
  theme: 'appearance.theme',
  timer: 'timer',
} as const;

const themeSchema = z.enum(['dark', 'light', 'system']);

/**
 * Every field is optional and invalid fields are dropped, so a value saved by an
 * older or newer version of the app still loads; missing fields use the defaults.
 */
const timerSettingsSchema = z.object({
  inspectionEnabled: z.boolean().optional().catch(undefined),
  inspectionSeconds: z
    .union([z.literal(8), z.literal(15), z.literal(30)])
    .optional()
    .catch(undefined),
  holdMs: z
    .union([z.literal(0), z.literal(300), z.literal(550), z.literal(1000)])
    .optional()
    .catch(undefined),
  hapticsEnabled: z.boolean().optional().catch(undefined),
  decimals: z
    .union([z.literal(2), z.literal(3)])
    .optional()
    .catch(undefined),
  hideTimeWhileRunning: z.boolean().optional().catch(undefined),
  keepScreenAwake: z.boolean().optional().catch(undefined),
  soundEnabled: z.boolean().optional().catch(undefined),
  timerSize: z.enum(TIMER_SIZES).optional().catch(undefined),
  timerColor: z.enum(TIMER_COLORS).optional().catch(undefined),
  timerBackground: z.enum(TIMER_BACKGROUNDS).optional().catch(undefined),
  secondsOnlyWhileRunning: z.boolean().optional().catch(undefined),
  allowLandscape: z.boolean().optional().catch(undefined),
});

function withoutUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined)) as Partial<T>;
}

/** Writes a setting. A failed write keeps the in-memory value and is logged, never thrown. */
function persist(key: string, value: unknown) {
  try {
    setSetting(getDatabase(), key, value);
  } catch (error) {
    console.warn(`Could not save setting "${key}"`, error);
  }
}

/** App-wide preferences, saved to the SQLite `settings` table on every change. */
interface SettingsState {
  themePreference: ThemePreference;
  timer: TimerSettings;
  /** Loads saved values at startup. */
  hydrate: () => void;
  setThemePreference: (preference: ThemePreference) => void;
  updateTimerSettings: (changes: Partial<TimerSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  themePreference: DEFAULT_THEME_PREFERENCE,
  timer: DEFAULT_TIMER_SETTINGS,
  hydrate: () => {
    const db = getDatabase();
    const themePreference = getSetting(
      db,
      SETTING_KEYS.theme,
      themeSchema,
      DEFAULT_THEME_PREFERENCE,
    );
    const saved = getSetting(db, SETTING_KEYS.timer, timerSettingsSchema, {});
    set({
      themePreference,
      timer: { ...DEFAULT_TIMER_SETTINGS, ...(withoutUndefined(saved) as Partial<TimerSettings>) },
    });
  },
  setThemePreference: (themePreference) => {
    set({ themePreference });
    persist(SETTING_KEYS.theme, themePreference);
  },
  updateTimerSettings: (changes) => {
    const timer = { ...get().timer, ...changes };
    set({ timer });
    persist(SETTING_KEYS.timer, timer);
  },
}));
