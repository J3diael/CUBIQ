import { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SearchX } from 'lucide-react-native';

import {
  Button,
  Card,
  EmptyState,
  Screen,
  SectionHeader,
  SegmentedControl,
  Text,
  TextField,
} from '@/components/ui';
import { getSession } from '@/database/repositories/sessions-repository';
import { getSolve } from '@/database/repositories/solves-repository';
import { formatSolveDate } from '@/lib/time/date';
import { formatDuration } from '@/lib/time/format';
import { formatSolveTime } from '@/lib/time/format-result';
import type { Penalty } from '@/lib/timer/types';
import { useDataStore, useDbQuery } from '@/store/data-store';
import { useSettingsStore } from '@/store/settings-store';
import { useTheme } from '@/theme';

import { deleteSolveWithUndo } from './actions';

const PENALTY_OPTIONS = [
  { value: 'none', label: 'OK' },
  { value: 'plus2', label: '+2' },
  { value: 'dnf', label: 'DNF' },
] as const satisfies readonly { value: Penalty; label: string }[];

export function SolveDetailScreen() {
  const theme = useTheme();
  const { solveId = '' } = useLocalSearchParams<{ solveId: string }>();
  const solve = useDbQuery((db) => getSolve(db, solveId));
  const session = useDbQuery((db) => (solve ? getSession(db, solve.sessionId) : null));
  const decimals = useSettingsStore((s) => s.timer.decimals);
  const setPenalty = useDataStore((s) => s.setPenalty);
  const setNotes = useDataStore((s) => s.setNotes);
  const [notes, setNotesText] = useState(solve?.notes ?? '');

  if (!solve) {
    return (
      <Screen edges={['bottom']}>
        <EmptyState
          icon={SearchX}
          title="Solve not found"
          message="It may have been deleted."
          actionLabel="Close"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const saveNotes = () => {
    if ((solve.notes ?? '') !== notes.trim()) setNotes(solve.id, notes);
  };

  const facts = [
    ['Session', session?.name ?? '—'],
    ['When', formatSolveDate(solve.solvedAt)],
    ['Raw time', solve.rawTimeMs > 0 ? formatDuration(solve.rawTimeMs, 3) : 'Lost'],
    ['Inspection', solve.inspectionMs === null ? 'Off' : formatDuration(solve.inspectionMs, 2)],
    ['Entry', solve.source === 'manual' ? 'Typed in' : 'Timed in CUBIQ'],
  ] as const;

  return (
    <Screen edges={['bottom']}>
      <View style={{ alignItems: 'center', gap: theme.spacing.xxs }}>
        <Text
          variant="timer"
          accessibilityLabel={`Solve time ${formatSolveTime(solve.rawTimeMs, solve.penalty, decimals, { showRawForDnf: solve.rawTimeMs > 0 })}`}
          adjustsFontSizeToFit
          numberOfLines={1}
        >
          {formatSolveTime(solve.rawTimeMs, solve.penalty, decimals, {
            showRawForDnf: solve.rawTimeMs > 0,
          })}
        </Text>
        {solve.wasInterrupted ? (
          <Text variant="caption" color="warning" align="center">
            The app was in the background during this solve.
          </Text>
        ) : null}
      </View>

      <SegmentedControl
        accessibilityLabel="Penalty"
        options={PENALTY_OPTIONS}
        value={solve.penalty}
        onChange={(penalty) => setPenalty(solve.id, penalty)}
      />

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Scramble" />
        <Card>
          <Text
            variant="heading"
            selectable
            style={{ fontFamily: theme.typography.stat.fontFamily, lineHeight: 28 }}
          >
            {solve.scramble || 'No scramble was available for this solve.'}
          </Text>
        </Card>
      </View>

      <Card style={{ gap: theme.spacing.xs }}>
        {facts.map(([label, value]) => (
          <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="body" color="textSecondary">
              {label}
            </Text>
            <Text variant="bodyStrong">{value}</Text>
          </View>
        ))}
      </Card>

      <TextField
        label="Notes"
        multiline
        value={notes}
        onChangeText={setNotesText}
        onBlur={saveNotes}
        placeholder="Lockups, a skip, how it felt…"
        maxLength={500}
      />

      <View style={{ gap: theme.spacing.sm }}>
        <Button
          label="Done"
          fullWidth
          onPress={() => {
            saveNotes();
            router.back();
          }}
        />
        <Button
          label="Delete solve"
          variant="ghost"
          fullWidth
          onPress={() => {
            deleteSolveWithUndo(solve.id);
            router.back();
          }}
        />
      </View>
    </Screen>
  );
}
