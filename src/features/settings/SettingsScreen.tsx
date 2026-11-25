import type { ReactNode } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { LayoutGrid } from 'lucide-react-native';

import {
  Card,
  Divider,
  ListRow,
  Screen,
  SectionHeader,
  SegmentedControl,
  SwitchRow,
  Text,
} from '@/components/ui';
import {
  useSettingsStore,
  type DisplayDecimals,
  type HoldDurationMs,
  type InspectionSeconds,
  type TimerBackground,
  type TimerColor,
  type TimerSize,
} from '@/store/settings-store';
import { useTheme, type ThemePreference } from '@/theme';

const THEME_OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
] as const satisfies readonly { value: ThemePreference; label: string }[];

const HOLD_OPTIONS = [
  { value: '0', label: 'Instant' },
  { value: '300', label: '0.3 s' },
  { value: '550', label: '0.55 s' },
  { value: '1000', label: '1 s' },
] as const;

const INSPECTION_OPTIONS = [
  { value: '8', label: '8 s' },
  { value: '15', label: '15 s' },
  { value: '30', label: '30 s' },
] as const;

const SIZE_OPTIONS = [
  { value: 'small', label: 'S' },
  { value: 'medium', label: 'M' },
  { value: 'large', label: 'L' },
  { value: 'huge', label: 'XL' },
] as const satisfies readonly { value: TimerSize; label: string }[];

const COLOR_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'accent', label: 'Indigo' },
  { value: 'green', label: 'Green' },
  { value: 'amber', label: 'Amber' },
] as const satisfies readonly { value: TimerColor; label: string }[];

const BACKGROUND_OPTIONS = [
  { value: 'default', label: 'Theme' },
  { value: 'surface', label: 'Soft' },
  { value: 'black', label: 'Black' },
] as const satisfies readonly { value: TimerBackground; label: string }[];

const DECIMAL_OPTIONS = [
  { value: '2', label: '0.00' },
  { value: '3', label: '0.000' },
] as const;

export function SettingsScreen() {
  const theme = useTheme();
  const themePreference = useSettingsStore((state) => state.themePreference);
  const setThemePreference = useSettingsStore((state) => state.setThemePreference);
  const timer = useSettingsStore((state) => state.timer);
  const update = useSettingsStore((state) => state.updateTimerSettings);

  return (
    <Screen edges={[]}>
      <Section title="Appearance">
        <SegmentedControl
          accessibilityLabel="Theme"
          options={THEME_OPTIONS}
          value={themePreference}
          onChange={setThemePreference}
        />
      </Section>

      <Section title="Timer">
        <Card flush>
          <SwitchRow
            title="Inspection"
            subtitle="WCA-style countdown before each solve. Over time is +2, then DNF."
            value={timer.inspectionEnabled}
            onValueChange={(inspectionEnabled) => update({ inspectionEnabled })}
          />
          {timer.inspectionEnabled ? (
            <View style={{ paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md }}>
              <SegmentedControl
                accessibilityLabel="Inspection duration"
                options={INSPECTION_OPTIONS}
                value={String(timer.inspectionSeconds) as `${InspectionSeconds}`}
                onChange={(v) => update({ inspectionSeconds: Number(v) as InspectionSeconds })}
              />
            </View>
          ) : null}
          <Divider inset={16} />
          <SwitchRow
            title="Haptic feedback"
            subtitle="Vibrate when ready, on stop, and at inspection warnings"
            value={timer.hapticsEnabled}
            onValueChange={(hapticsEnabled) => update({ hapticsEnabled })}
          />
          <Divider inset={16} />
          <SwitchRow
            title="Sound"
            subtitle="Beeps when ready, on stop, at inspection warnings and for a new best"
            value={timer.soundEnabled}
            onValueChange={(soundEnabled) => update({ soundEnabled })}
          />
          <Divider inset={16} />
          <SwitchRow
            title="Hide time while solving"
            value={timer.hideTimeWhileRunning}
            onValueChange={(hideTimeWhileRunning) => update({ hideTimeWhileRunning })}
          />
          <Divider inset={16} />
          <SwitchRow
            title="Whole seconds while solving"
            subtitle="Less flicker; the full time shows when you stop"
            value={timer.secondsOnlyWhileRunning}
            onValueChange={(secondsOnlyWhileRunning) => update({ secondsOnlyWhileRunning })}
          />
          <Divider inset={16} />
          <SwitchRow
            title="Allow landscape"
            subtitle="Let the Timer tab rotate. The rest of the app stays upright."
            value={timer.allowLandscape}
            onValueChange={(allowLandscape) => update({ allowLandscape })}
          />
          <Divider inset={16} />
          <SwitchRow
            title="Keep screen awake"
            subtitle="While the Timer tab is open"
            value={timer.keepScreenAwake}
            onValueChange={(keepScreenAwake) => update({ keepScreenAwake })}
          />
        </Card>

        <Text variant="label" color="textSecondary">
          Hold to start
        </Text>
        <SegmentedControl
          accessibilityLabel="Hold to start"
          options={HOLD_OPTIONS}
          value={String(timer.holdMs) as `${HoldDurationMs}`}
          onChange={(v) => update({ holdMs: Number(v) as HoldDurationMs })}
        />

        <Text variant="label" color="textSecondary">
          Time precision
        </Text>
        <SegmentedControl
          accessibilityLabel="Time precision"
          options={DECIMAL_OPTIONS}
          value={String(timer.decimals) as `${DisplayDecimals}`}
          onChange={(v) => update({ decimals: Number(v) as DisplayDecimals })}
        />
      </Section>

      <Section title="Timer look">
        <Text variant="label" color="textSecondary">
          Time size
        </Text>
        <SegmentedControl
          accessibilityLabel="Time size"
          options={SIZE_OPTIONS}
          value={timer.timerSize}
          onChange={(timerSize) => update({ timerSize })}
        />
        <Text variant="label" color="textSecondary">
          Time colour
        </Text>
        <SegmentedControl
          accessibilityLabel="Time colour"
          options={COLOR_OPTIONS}
          value={timer.timerColor}
          onChange={(timerColor) => update({ timerColor })}
        />
        <Text variant="label" color="textSecondary">
          Background
        </Text>
        <SegmentedControl
          accessibilityLabel="Timer background"
          options={BACKGROUND_OPTIONS}
          value={timer.timerBackground}
          onChange={(timerBackground) => update({ timerBackground })}
        />
        <Text variant="caption" color="textSecondary">
          The time still turns amber while you hold and green when it is ready.
        </Text>
      </Section>

      {__DEV__ ? (
        <Section title="Developer">
          <Card flush>
            <ListRow
              title="Component gallery"
              subtitle="Every UI component in the current theme"
              icon={LayoutGrid}
              onPress={() => router.push('/dev/gallery')}
            />
          </Card>
        </Section>
      ) : null}
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <SectionHeader title={title} />
      {children}
    </View>
  );
}
