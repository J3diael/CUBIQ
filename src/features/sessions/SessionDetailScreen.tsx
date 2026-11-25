import { useState } from 'react';
import { View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ChartLine, Timer } from 'lucide-react-native';

import {
  Button,
  Card,
  Divider,
  EmptyState,
  Screen,
  SectionHeader,
  Sheet,
  StatTile,
  Text,
} from '@/components/ui';
import { getSession, listSessions } from '@/database/repositories/sessions-repository';
import { listSolves } from '@/database/repositories/solves-repository';
import { SolveRow } from '@/features/solves/components/SolveRow';
import { openSolve } from '@/features/solves/navigation';
import { computeSessionStats, formatStat } from '@/lib/stats';
import { useDataStore, useDbQuery } from '@/store/data-store';
import { useSettingsStore } from '@/store/settings-store';
import { useTheme } from '@/theme';

import { SessionFormSheet } from './components/SessionFormSheet';
import { METHOD_LABELS, PURPOSE_LABELS } from './labels';

export function SessionDetailScreen() {
  const theme = useTheme();
  const { sessionId = '' } = useLocalSearchParams<{ sessionId: string }>();
  const session = useDbQuery((db) => getSession(db, sessionId));
  const solves = useDbQuery((db) => listSolves(db, sessionId));
  const sessionCount = useDbQuery((db) => listSessions(db).length);
  const decimals = useSettingsStore((s) => s.timer.decimals);
  const activeId = useDataStore((s) => s.activeSessionId);
  const setActive = useDataStore((s) => s.setActiveSession);
  const renameSession = useDataStore((s) => s.renameSession);
  const deleteSession = useDataStore((s) => s.deleteSession);
  const [sheet, setSheet] = useState<'rename' | 'delete' | null>(null);

  if (!session) {
    return (
      <Screen edges={[]}>
        <EmptyState
          icon={Timer}
          title="Session not found"
          message="It may have been deleted."
          actionLabel="Back to sessions"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const isActive = session.id === activeId;
  const stats = computeSessionStats(solves);
  const dnfs = stats.dnfCount;
  const tags = [
    session.method && METHOD_LABELS[session.method],
    session.purpose && PURPOSE_LABELS[session.purpose],
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: session.name }} />
      <View style={{ gap: theme.spacing.xxs }}>
        <Text variant="title">{session.name}</Text>
        <Text variant="caption" color="textSecondary">
          {[isActive ? 'Active session' : null, tags || null].filter(Boolean).join(' · ') || '3x3'}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <StatTile
          label="Solves"
          value={String(solves.length)}
          hint={dnfs ? `${dnfs} DNF` : undefined}
        />
        <StatTile label="Best" value={formatStat(stats.bestSingle, decimals)} />
        <StatTile label="Ao5" value={formatStat(stats.averages.ao5.current, decimals)} />
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <Button
          label="Statistics and charts"
          icon={ChartLine}
          variant="secondary"
          fullWidth
          onPress={() =>
            router.push({
              pathname: '/sessions/[sessionId]/stats',
              params: { sessionId: session.id },
            })
          }
        />
        {!isActive ? (
          <Button label="Use this session" fullWidth onPress={() => setActive(session.id)} />
        ) : null}
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button
              label="Rename"
              variant="secondary"
              fullWidth
              onPress={() => setSheet('rename')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Delete"
              variant="secondary"
              fullWidth
              disabled={sessionCount <= 1}
              onPress={() => setSheet('delete')}
            />
          </View>
        </View>
        {sessionCount <= 1 ? (
          <Text variant="caption" color="textSecondary" align="center">
            This is your only session, so it can&apos;t be deleted.
          </Text>
        ) : null}
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Solves" />
        <Card flush>
          {solves.length === 0 ? (
            <EmptyState
              icon={Timer}
              title="No solves yet"
              message={
                isActive
                  ? 'Solves you time now are saved here.'
                  : 'Make this the active session to time solves into it.'
              }
            />
          ) : (
            // Newest first; numbering keeps the order solves were done in.
            [...solves].reverse().map((solve, i) => (
              <View key={solve.id}>
                {i > 0 ? <Divider /> : null}
                <SolveRow
                  solve={solve}
                  decimals={decimals}
                  index={solves.length - i}
                  onPress={() => openSolve(solve.id)}
                />
              </View>
            ))
          )}
        </Card>
      </View>

      <SessionFormSheet
        key={session.name}
        visible={sheet === 'rename'}
        mode="rename"
        initialName={session.name}
        onClose={() => setSheet(null)}
        onSubmit={(values) => renameSession(session.id, values.name)}
      />
      <Sheet visible={sheet === 'delete'} onClose={() => setSheet(null)} title="Delete session?">
        <Text variant="body" color="textSecondary">
          {`“${session.name}” and its ${solves.length} ${solves.length === 1 ? 'solve' : 'solves'} will be removed.`}
        </Text>
        <Button
          label="Delete session"
          variant="danger"
          fullWidth
          onPress={() => {
            setSheet(null);
            deleteSession(session.id);
            router.back();
          }}
        />
        <Button label="Cancel" variant="ghost" fullWidth onPress={() => setSheet(null)} />
      </Sheet>
    </Screen>
  );
}
