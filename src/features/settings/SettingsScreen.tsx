import { View } from 'react-native';
import { router } from 'expo-router';
import { LayoutGrid } from 'lucide-react-native';

import { Card, ListRow, Screen, SectionHeader, SegmentedControl, Text } from '@/components/ui';
import { useSettingsStore } from '@/store/settings-store';
import { useTheme, type ThemePreference } from '@/theme';

const THEME_OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
] as const satisfies readonly { value: ThemePreference; label: string }[];

export function SettingsScreen() {
  const theme = useTheme();
  const themePreference = useSettingsStore((state) => state.themePreference);
  const setThemePreference = useSettingsStore((state) => state.setThemePreference);

  return (
    <Screen edges={[]}>
      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Appearance" />
        <SegmentedControl
          accessibilityLabel="Theme"
          options={THEME_OPTIONS}
          value={themePreference}
          onChange={setThemePreference}
        />
        <Text variant="caption" color="textSecondary">
          System follows your phone&apos;s setting. Your choice is saved once storage arrives in
          Phase 3.
        </Text>
      </View>

      {__DEV__ ? (
        <View style={{ gap: theme.spacing.sm }}>
          <SectionHeader title="Developer" />
          <Card flush>
            <ListRow
              title="Component gallery"
              subtitle="Every UI component in the current theme"
              icon={LayoutGrid}
              onPress={() => router.push('/dev/gallery')}
            />
          </Card>
        </View>
      ) : null}
    </Screen>
  );
}
