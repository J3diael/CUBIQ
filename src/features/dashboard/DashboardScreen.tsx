import { useMemo } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Layers, Play, Target, Timer } from 'lucide-react-native';

import {
  Button,
  Card,
  Divider,
  EmptyState,
  ListRow,
  Screen,
  SectionHeader,
  StatTile,
  Text,
} from '@/components/ui';
import { DEFAULT_PUZZLE_ID, PUZZLES } from '@/constants/puzzles';
import { getSession, listSessions } from '@/database/repositories/sessions-repository';
import { countSolves, listSolves, recentSolves } from '@/database/repositories/solves-repository';
import { useGoals } from '@/features/goals/use-goals';
import { sessionSubtitle } from '@/features/sessions/format';
import { SolveRow } from '@/features/solves/components/SolveRow';
import { openSolve } from '@/features/solves/navigation';
import { startOfLocalDay } from '@/lib/time/date';
import { getPersonalRecords } from '@/features/stats/queries';
import { currentAverage, formatStat, toFinalTimes } from '@/lib/stats';
import { useDataStore, useDbQuery } from '@/store/data-store';
import { useSettingsStore } from '@/store/settings-store';
import { useTheme } from '@/theme';

export function DashboardScreen() {
  const theme = useTheme();
  const decimals = useSettingsStore((s) => s.timer.decimals);
  const activeSessionId = useDataStore((s) => s.activeSessionId);
  const session = useDbQuery((db) => getSession(db, activeSessionId));
  const puzzle = PUZZLES[session?.puzzleId ?? DEFAULT_PUZZLE_ID];
  const records = useDbQuery((db) => getPersonalRecords(db, puzzle.id));
  const total = useDbQuery((db) => countSolves(db));
  const today = useDbQuery((db) => countSolves(db, { since: startOfLocalDay() }));
  const recent = useDbQuery((db) => recentSolves(db, 5));
  const sessions = useDbQuery(listSessions);
  const sessionSolves = useDbQuery((db) => listSolves(db, activeSessionId));
  const sessionTimes = useMemo(() => toFinalTimes(sessionSolves), [sessionSolves]);
  const daily = useGoals().find((g) => g.type === 'daily');

  return (
    <Screen title="CUBIQ" subtitle="Your cubing at a glance">
      <Button
        label="Quick start timer"
        icon={Play}
        fullWidth
        onPress={() => router.navigate('/timer')}
      />

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title={`Personal bests · ${puzzle.shortName}`} />
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
        {daily ? (
          <Card style={{ gap: theme.spacing.xs }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="bodyStrong">Daily goal</Text>
              <Text variant="label" color={daily.progress.done ? 'success' : 'accent'}>
                {daily.progress.done
                  ? 'Done for today'
                  : `${Math.round(daily.progress.fraction * 100)}%`}
              </Text>
            </View>
            <View
              accessibilityRole="progressbar"
              accessibilityLabel="Daily goal"
              accessibilityValue={{
                min: 0,
                max: daily.progress.target,
                now: daily.progress.current,
              }}
              style={{ height: 6, borderRadius: 3, backgroundColor: theme.colors.surfaceRaised }}
            >
              <View
                style={{
                  width: `${daily.progress.fraction * 100}%`,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: daily.progress.done ? theme.colors.success : theme.colors.accent,
                }}
              />
            </View>
            <Text variant="caption" color="textSecondary">
              {daily.progress.text}
            </Text>
          </Card>
        ) : (
          <Card flush>
            <ListRow
              icon={Target}
              title="Daily goal"
              subtitle="Optional: set a number of solves a day in Profile"
              onPress={() => router.navigate('/profile')}
            />
          </Card>
        )}
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Current session" />
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <StatTile
            label="Ao5 now"
            value={formatStat(currentAverage(sessionTimes, 'ao5'), decimals)}
          />
          <StatTile
            label="Ao12 now"
            value={formatStat(currentAverage(sessionTimes, 'ao12'), decimals)}
          />
          <StatTile label="Solves" value={String(sessionTimes.length)} />
        </View>
        <Card flush>
          {sessions.slice(0, 3).map((s, i) => (
            <View key={s.id}>
              {i > 0 ? <Divider inset={48} /> : null}
              <ListRow
                icon={Layers}
                title={s.name}
                subtitle={
                  s.id === activeSessionId ? `Active · ${sessionSubtitle(s)}` : sessionSubtitle(s)
                }
                onPress={() =>
                  router.navigate({
                    pathname: '/sessions/[sessionId]',
                    params: { sessionId: s.id },
                  })
                }
              />
            </View>
          ))}
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
