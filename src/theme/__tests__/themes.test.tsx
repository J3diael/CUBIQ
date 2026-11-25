import { act, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { DEFAULT_THEME_PREFERENCE, useSettingsStore } from '@/store/settings-store';

import { palette } from '../tokens';
import { resolveColorScheme } from '../themes';
import { ThemeProvider, useTheme } from '../ThemeProvider';

jest.mock('@/hooks/use-color-scheme', () => ({ useColorScheme: jest.fn(() => 'dark') }));

describe('resolveColorScheme', () => {
  it('uses an explicit preference regardless of the system', async () => {
    expect(resolveColorScheme('dark', 'light')).toBe('dark');
    expect(resolveColorScheme('light', 'dark')).toBe('light');
  });

  it('follows the system when preference is system', async () => {
    expect(resolveColorScheme('system', 'light')).toBe('light');
    expect(resolveColorScheme('system', 'dark')).toBe('dark');
  });

  it('falls back to dark when the system reports nothing', async () => {
    expect(resolveColorScheme('system', null)).toBe('dark');
    expect(resolveColorScheme('system', undefined)).toBe('dark');
  });
});

describe('palette', () => {
  it('defines the same tokens for light and dark', async () => {
    expect(Object.keys(palette.light).sort()).toEqual(Object.keys(palette.dark).sort());
  });
});

function Probe() {
  const theme = useTheme();
  return <Text testID="probe">{`${theme.scheme}:${theme.colors.background}`}</Text>;
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    useSettingsStore.setState({ themePreference: DEFAULT_THEME_PREFERENCE });
  });

  it('defaults to dark', async () => {
    expect(DEFAULT_THEME_PREFERENCE).toBe('dark');
    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('probe')).toHaveTextContent(`dark:${palette.dark.background}`);
  });

  it('switches theme when the preference changes', async () => {
    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    await act(() => useSettingsStore.getState().setThemePreference('light'));
    expect(screen.getByTestId('probe')).toHaveTextContent(`light:${palette.light.background}`);
  });

  it('follows the system scheme when set to system', async () => {
    jest.mocked(useColorScheme).mockReturnValue('light');
    useSettingsStore.setState({ themePreference: 'system' });
    await render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('probe')).toHaveTextContent(`light:${palette.light.background}`);
  });

  it('throws a clear error outside the provider', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(render(<Probe />)).rejects.toThrow(
      'useTheme must be used inside <ThemeProvider>.',
    );
  });
});
