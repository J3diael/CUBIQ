import { View } from 'react-native';
import { router } from 'expo-router';
import { Play, Timer } from 'lucide-react-native';

import { Button, Card, EmptyState, Screen, SectionHeader, StatTile } from '@/components/ui';
import { useTheme } from '@/theme';

/** Placeholder numbers. They show "—" or 0 until solves are recorded (Phase 3) and calculated (Phase 4). */
const PERSONAL_BESTS = [
  { label: 'Single', value: '—' },
  { label: 'Ao5', value: '—' },
  { label: 'Ao12', value: '—' },
] as const;

const PRACTICE = [
  { label: 'Session', value: '—' },
  { label: 'Total', value: '0' },
  { label: 'Today', value: '0' },
] as const;

export function DashboardScreen() {
  const theme = useTheme();

  return (
    <Screen title="CUBIQ" subtitle="Your cubing at a glance">
      <Button
        label="Quick start timer"
        icon={Play}
        fullWidth
        onPress={() => router.navigate('/timer')}
      />

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Personal bests" />
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {PERSONAL_BESTS.map((stat) => (
            <StatTile key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </View>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Practice" />
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {PRACTICE.map((stat) => (
            <StatTile key={stat.label} label={stat.label} value={stat.value} />
          ))}
        </View>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Recent solves" />
        <Card>
          <EmptyState
            icon={Timer}
            title="No solves yet"
            message="Your first solve will show up here, along with your personal bests."
          />
        </Card>
      </View>
    </Screen>
  );
}
