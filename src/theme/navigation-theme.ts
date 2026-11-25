import { DarkTheme, DefaultTheme, type Theme as NavigationTheme } from 'expo-router';

import type { Theme } from './themes';

/** Maps CUBIQ's theme onto React Navigation's, so headers and screen backgrounds match. */
export function toNavigationTheme(theme: Theme): NavigationTheme {
  const base = theme.scheme === 'dark' ? DarkTheme : DefaultTheme;
  return {
    ...base,
    dark: theme.scheme === 'dark',
    colors: {
      ...base.colors,
      primary: theme.colors.accent,
      background: theme.colors.background,
      card: theme.colors.surface,
      text: theme.colors.textPrimary,
      border: theme.colors.border,
      notification: theme.colors.danger,
    },
  };
}
