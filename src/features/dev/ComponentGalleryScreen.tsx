import { useState } from 'react';
import { View } from 'react-native';
import { Inbox, Plus, Settings, Trash2 } from 'lucide-react-native';

import {
  Button,
  Card,
  Chip,
  Divider,
  EmptyState,
  IconButton,
  ListRow,
  Screen,
  SectionHeader,
  SegmentedControl,
  Sheet,
  StatTile,
  Text,
} from '@/components/ui';
import { useSettingsStore } from '@/store/settings-store';
import { useTheme, type ColorToken, type TypographyVariant } from '@/theme';

const TYPE_VARIANTS: TypographyVariant[] = [
  'display',
  'title',
  'heading',
  'body',
  'bodyStrong',
  'label',
  'caption',
  'overline',
  'stat',
];

const SWATCHES: ColorToken[] = [
  'background',
  'surface',
  'surfaceRaised',
  'border',
  'textPrimary',
  'textSecondary',
  'accent',
  'timerReady',
  'timerHolding',
  'danger',
];

/** Dev-only screen to review every component in both themes. Reached from Settings in dev builds. */
export function ComponentGalleryScreen() {
  const theme = useTheme();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [chip, setChip] = useState('3x3');
  const themePreference = useSettingsStore((s) => s.themePreference);
  const setThemePreference = useSettingsStore((s) => s.setThemePreference);

  return (
    <Screen edges={[]}>
      <SegmentedControl
        accessibilityLabel="Theme"
        options={[
          { value: 'dark', label: 'Dark' },
          { value: 'light', label: 'Light' },
          { value: 'system', label: 'System' },
        ]}
        value={themePreference}
        onChange={setThemePreference}
      />

      <Section title="Colours">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          {SWATCHES.map((token) => (
            <View key={token} style={{ width: 96, gap: 4 }}>
              <View
                style={{
                  height: 40,
                  borderRadius: theme.radius.sm,
                  backgroundColor: theme.colors[token],
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              />
              <Text variant="caption" color="textSecondary">
                {token}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Typography">
        {TYPE_VARIANTS.map((variant) => (
          <Text key={variant} variant={variant}>
            {variant === 'stat' ? '12.345' : variant}
          </Text>
        ))}
        <Text variant="timer" adjustsFontSizeToFit numberOfLines={1}>
          9.874
        </Text>
      </Section>

      <Section title="Buttons">
        <Button label="Primary" icon={Plus} />
        <Button label="Secondary" variant="secondary" />
        <Button label="Ghost" variant="ghost" />
        <Button label="Disabled" disabled />
        <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
          <IconButton icon={Settings} accessibilityLabel="Settings" />
          <IconButton icon={Trash2} accessibilityLabel="Delete" color="danger" />
        </View>
      </Section>

      <Section title="Chips">
        <View style={{ flexDirection: 'row', gap: theme.spacing.xs }}>
          {['2x2', '3x3', '4x4'].map((label) => (
            <Chip
              key={label}
              label={label}
              selected={chip === label}
              onPress={() => setChip(label)}
            />
          ))}
          <Chip label="Static" />
        </View>
      </Section>

      <Section title="Stat tiles">
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <StatTile label="Best" value="9.874" hint="Today" />
          <StatTile label="Ao5" value="—" />
        </View>
      </Section>

      <Section title="List">
        <Card flush>
          <ListRow
            title="Pressable row"
            subtitle="With a subtitle"
            icon={Settings}
            onPress={() => {}}
          />
          <Divider inset={48} />
          <ListRow title="Static row" trailing={<Chip label="Info" />} />
        </Card>
      </Section>

      <Section title="Empty state">
        <Card>
          <EmptyState
            icon={Inbox}
            title="Nothing here yet"
            message="Empty states explain what will appear and how to get started."
            actionLabel="Open sheet"
            onAction={() => setSheetOpen(true)}
          />
        </Card>
      </Section>

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="Example sheet">
        <Text color="textSecondary">Sheets hold short tasks such as switching sessions.</Text>
        <Button label="Done" fullWidth onPress={() => setSheetOpen(false)} />
      </Sheet>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.spacing.sm }}>
      <SectionHeader title={title} />
      {children}
    </View>
  );
}
