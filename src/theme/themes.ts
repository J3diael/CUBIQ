import { palette, radius, spacing, typography, type ColorScheme, type Colors } from './tokens';

export type ThemePreference = 'dark' | 'light' | 'system';

export interface Theme {
  scheme: ColorScheme;
  colors: Colors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
}

export const themes: Record<ColorScheme, Theme> = {
  dark: { scheme: 'dark', colors: palette.dark, spacing, radius, typography },
  light: { scheme: 'light', colors: palette.light, spacing, radius, typography },
};

/**
 * Turns the user's preference into a concrete scheme.
 * `system` follows the OS; when the OS reports nothing we fall back to dark, CUBIQ's default.
 */
export function resolveColorScheme(
  preference: ThemePreference,
  systemScheme: string | null | undefined,
): ColorScheme {
  if (preference !== 'system') return preference;
  return systemScheme === 'light' ? 'light' : 'dark';
}
