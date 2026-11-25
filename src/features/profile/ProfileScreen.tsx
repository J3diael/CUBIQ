import { View } from 'react-native';
import { router } from 'expo-router';
import { ChartLine, Settings, Target } from 'lucide-react-native';

import {
  Card,
  EmptyState,
  IconButton,
  ListRow,
  Screen,
  SectionHeader,
  StatTile,
} from '@/components/ui';
import { useTheme } from '@/theme';

export function ProfileScreen() {
  const theme = useTheme();

  return (
    <Screen
      title="Profile"
      subtitle="Statistics, goals and preferences"
      headerAction={
        <IconButton
          icon={Settings}
          accessibilityLabel="Settings"
          onPress={() => router.push('/profile/settings')}
        />
      }
    >
      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="All time" />
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <StatTile label="Solves" value="0" />
          <StatTile label="Mean" value="—" />
          <StatTile label="Time" value="—" />
        </View>
        <Card flush>
          <ListRow
            title="Statistics and charts"
            subtitle="Progression, averages and distribution arrive in Phase 4"
            icon={ChartLine}
          />
        </Card>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Goals" />
        <Card>
          <EmptyState
            icon={Target}
            title="No goals yet"
            message="Goals are optional. Set one like sub-20 or 100 solves when you want a target."
          />
        </Card>
      </View>

      <Card flush>
        <ListRow
          title="Settings"
          icon={Settings}
          onPress={() => router.push('/profile/settings')}
        />
      </Card>
    </Screen>
  );
}
