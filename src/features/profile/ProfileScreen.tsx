import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ChartLine, Plus, Settings, Target } from 'lucide-react-native';

import {
  Button,
  Card,
  Divider,
  EmptyState,
  IconButton,
  ListRow,
  Screen,
  SectionHeader,
  StatTile,
} from '@/components/ui';
import { DEFAULT_PUZZLE_ID, PUZZLES } from '@/constants/puzzles';
import type { Goal } from '@/database/repositories/goals-repository';
import { getSession } from '@/database/repositories/sessions-repository';
import { listSolvesBySession, practiceTotals } from '@/database/repositories/solves-repository';
import { goalActions } from '@/features/goals/actions';
import { GoalFormSheet } from '@/features/goals/components/GoalFormSheet';
import { GoalRow } from '@/features/goals/components/GoalRow';
import { useGoals } from '@/features/goals/use-goals';
import { computeSessionStats, formatStat } from '@/lib/stats';
import { formatTotalTime } from '@/lib/time/format';
import { useDataStore, useDbQuery } from '@/store/data-store';
import { useSettingsStore } from '@/store/settings-store';
import { useTheme } from '@/theme';

export function ProfileScreen() {
  const theme = useTheme();
  const decimals = useSettingsStore((s) => s.timer.decimals);
  const activeSessionId = useDataStore((s) => s.activeSessionId);
  const session = useDbQuery((db) => getSession(db, activeSessionId));
  const puzzle = PUZZLES[session?.puzzleId ?? DEFAULT_PUZZLE_ID];
  const totals = useDbQuery(practiceTotals);
  // Mean over every session of the puzzle being practised now.
  const mean = useDbQuery(
    (db) => computeSessionStats(listSolvesBySession(db, puzzle.id).flat()).mean,
  );
  const goals = useGoals();
  const open = goals.filter((g) => g.completedAt === null);
  const reached = goals.filter((g) => g.completedAt !== null);
  const [sheet, setSheet] = useState<{ editing: Goal | null } | null>(null);

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
          <StatTile label="Solves" value={String(totals.count)} />
          <StatTile label={`Mean · ${puzzle.shortName}`} value={formatStat(mean, decimals)} />
          <StatTile label="Time" value={formatTotalTime(totals.totalMs)} />
        </View>
        <Card flush>
          <ListRow
            title="Statistics and charts"
            subtitle={`For ${session?.name ?? 'the active session'}`}
            icon={ChartLine}
            onPress={() =>
              router.navigate({
                pathname: '/sessions/[sessionId]/stats',
                params: { sessionId: activeSessionId },
              })
            }
          />
        </Card>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Goals" />
        {open.length === 0 ? (
          <Card>
            <EmptyState
              icon={Target}
              title="No goals yet"
              message="Goals are optional. Set one like sub-20 or 100 solves when you want a target."
            />
          </Card>
        ) : (
          <Card flush>
            {open.map((g, i) => (
              <View key={g.id}>
                {i > 0 ? <Divider /> : null}
                <GoalRow goal={g} onPress={() => setSheet({ editing: g })} />
              </View>
            ))}
          </Card>
        )}
        <Button
          label="New goal"
          icon={Plus}
          variant="secondary"
          fullWidth
          onPress={() => setSheet({ editing: null })}
        />
      </View>

      {reached.length > 0 ? (
        <View style={{ gap: theme.spacing.sm }}>
          <SectionHeader title="Achievements" />
          <Card flush>
            {reached.map((g, i) => (
              <View key={g.id}>
                {i > 0 ? <Divider /> : null}
                <GoalRow goal={g} onPress={() => setSheet({ editing: g })} />
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      <Card flush>
        <ListRow
          title="Settings"
          icon={Settings}
          onPress={() => router.push('/profile/settings')}
        />
      </Card>

      {sheet ? (
        <GoalFormSheet
          visible
          existing={sheet.editing}
          onClose={() => setSheet(null)}
          onSave={(input) =>
            sheet.editing ? goalActions.update(sheet.editing.id, input) : goalActions.create(input)
          }
          onDelete={sheet.editing ? () => goalActions.delete(sheet.editing!.id) : undefined}
          onToggleDone={
            sheet.editing
              ? () =>
                  goalActions.setCompleted(sheet.editing!.id, sheet.editing!.completedAt === null)
              : undefined
          }
        />
      ) : null}
    </Screen>
  );
}
