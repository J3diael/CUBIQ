import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { useSettingsStore } from '@/store/settings-store';

import { resolveColorScheme, themes, type Theme } from './themes';

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const preference = useSettingsStore((state) => state.themePreference);
  const scheme = resolveColorScheme(preference, systemScheme);
  const theme = useMemo(() => themes[scheme], [scheme]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used inside <ThemeProvider>.');
  }
  return theme;
}
