import { View } from 'react-native';
import { router } from 'expo-router';
import { Layers, Play, Timer } from 'lucide-react-native';

import {
  Button,
  Card,
  Divider,
  EmptyState,
  ListRow,
  Screen,
  SectionHeader,
  StatTile,
} from '@/components/ui';
import { DEFAULT_PUZZLE_ID } from '@/constants/puzzles';
import { getSession } from '@/database/repositories/sessions-repository';
import { countSolves, recentSolves } from '@/database/repositories/solves-repository';
import { SolveRow } from '@/features/solves/components/SolveRow';
import { openSolve } from '@/features/solves/navigation';
import { startOfLocalDay } from '@/lib/time/date';
import { getPersonalRecords } from '@/features/stats/queries';
import { formatStat } from '@/lib/stats';
import { useDataStore, useDbQuery } from '@/store/data-store';
import { useSettingsStore } from '@/store/settings-store';
import { useTheme } from '@/theme';

export function DashboardScreen() {
  const theme = useTheme();
  const decimals = useSettingsStore((s) => s.timer.decimals);
  const activeSessionId = useDataStore((s) => s.activeSessionId);
  const session = useDbQuery((db) => getSession(db, activeSessionId));
  const records = useDbQuery((db) => getPersonalRecords(db, DEFAULT_PUZZLE_ID));
  const total = useDbQuery((db) => countSolves(db));
  const today = useDbQuery((db) => countSolves(db, { since: startOfLocalDay() }));
  const recent = useDbQuery((db) => recentSolves(db, 5));

  return (
    <Screen title="CUBIQ" subtitle="Your cubing at a glance">
      <Button
        label="Quick start timer"
        icon={Play}
        fullWidth
        onPress={() => router.navigate('/timer')}
      />

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Personal bests · 3x3" />
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <StatTile label="Single" value={formatStat(records.single, decimals)} />
          <StatTile label="Ao5" value={formatStat(records.ao5, decimals)} />
          <StatTile label="Ao12" value={formatStat(records.ao12, decimals)} />
        </View>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Practice" />
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <StatTile label="Today" value={String(today)} />
          <StatTile label="Total" value={String(total)} />
        </View>
        <Card flush>
          <ListRow
            icon={Layers}
            title={session?.name ?? 'Session'}
            subtitle="Active session"
            onPress={() =>
              router.navigate({
                pathname: '/sessions/[sessionId]',
                params: { sessionId: activeSessionId },
              })
            }
          />
        </Card>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Recent solves" />
        <Card flush>
          {recent.length === 0 ? (
            <EmptyState
              icon={Timer}
              title="No solves yet"
              message="Your first solve will show up here, along with your personal bests."
            />
          ) : (
            recent.map((solve, i) => (
              <View key={solve.id}>
                {i > 0 ? <Divider /> : null}
                <SolveRow
                  solve={solve}
                  decimals={decimals}
                  detail={solve.sessionName}
                  onPress={() => openSolve(solve.id)}
                />
              </View>
            ))
          )}
        </Card>
      </View>
    </Screen>
  );
}
