import { useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

import { Chip, Screen, Text } from '@/components/ui';
import { DEFAULT_PUZZLE_ID, PUZZLES } from '@/constants/puzzles';
import { useScramble } from '@/features/scrambles/use-scramble';
import type { SolveResult, TimerConfig } from '@/lib/timer';
import { useSettingsStore } from '@/store/settings-store';
import { useSolvesStore } from '@/store/solves-store';
import { useUiStore } from '@/store/ui-store';
import { useTheme } from '@/theme';

import { LastSolveActions } from './components/LastSolveActions';
import { ScrambleCard } from './components/ScrambleCard';
import { TimerDisplay } from './components/TimerDisplay';
import { useTimer } from './use-timer';

const KEEP_AWAKE_TAG = 'cubiq-timer';
const puzzle = PUZZLES[DEFAULT_PUZZLE_ID];

export function TimerScreen() {
  const theme = useTheme();
  const settings = useSettingsStore((s) => s.timer);
  const solves = useSolvesStore((s) => s.solves);
  const addSolve = useSolvesStore((s) => s.addSolve);
  const setPenalty = useSolvesStore((s) => s.setPenalty);
  const deleteSolve = useSolvesStore((s) => s.deleteSolve);
  const setFocusMode = useUiStore((s) => s.setTimerFocusMode);
  const scramble = useScramble(puzzle.id);

  const config: TimerConfig = useMemo(
    () => ({
      holdMs: settings.holdMs,
      inspectionEnabled: settings.inspectionEnabled,
      inspectionMs: settings.inspectionSeconds * 1000,
    }),
    [settings.holdMs, settings.inspectionEnabled, settings.inspectionSeconds],
  );

  const onSolve = useCallback(
    (result: SolveResult, wasInterrupted: boolean) => {
      // The scramble on screen during the solve is the one stored with it; then it is replaced.
      addSolve({
        puzzleId: puzzle.id,
        scramble: scramble.scramble?.notation ?? '',
        scrambleGeneratedAt: scramble.scramble?.generatedAt ?? null,
        rawMs: result.rawMs,
        penalty: result.penalty,
        inspectionMs: result.inspectionMs,
        wasInterrupted,
        solvedAt: Date.now(),
      });
      scramble.next();
    },
    [addSolve, scramble],
  );

  const timer = useTimer({ config, onSolve });
  const { state, busy, reset } = timer;

  useEffect(() => {
    setFocusMode(busy);
  }, [busy, setFocusMode]);

  // Leaving the tab cancels inspection or a half-finished hold, and keep-awake ends.
  useFocusEffect(
    useCallback(() => {
      if (settings.keepScreenAwake) activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
      return () => {
        deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
        setFocusMode(false);
        reset();
      };
    }, [settings.keepScreenAwake, setFocusMode, reset]),
  );

  const lastSolve = state.status === 'stopped' ? solves.at(-1) : undefined;

  const hint =
    state.status === 'inspecting'
      ? 'Hold to get ready, release to start'
      : state.status === 'holding'
        ? 'Keep holding…'
        : state.status === 'ready'
          ? 'Release to start'
          : state.status === 'running'
            ? 'Tap anywhere to stop'
            : settings.inspectionEnabled
              ? 'Tap to start inspection'
              : 'Hold, then release to start';

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      {!busy ? (
        <View style={{ gap: theme.spacing.md }}>
          <View style={styles.headerRow}>
            <Chip label={`${puzzle.shortName} · Current session`} selected />
          </View>
          <ScrambleCard scramble={scramble} onNewScramble={scramble.next} />
        </View>
      ) : null}

      <View
        testID="timer-touch-area"
        style={styles.touchArea}
        onTouchStart={timer.pressIn}
        onTouchEnd={timer.pressOut}
        onTouchCancel={timer.cancelTouch}
        accessibilityHint={hint}
      >
        <TimerDisplay
          state={state}
          decimals={settings.decimals}
          inspectionMs={config.inspectionMs}
          hideWhileRunning={settings.hideTimeWhileRunning}
          stoppedPenalty={lastSolve?.penalty}
        />
        <Text variant="caption" color="textSecondary" align="center">
          {hint}
        </Text>
      </View>

      {!busy ? (
        <View style={{ gap: theme.spacing.md, minHeight: 96, justifyContent: 'flex-end' }}>
          {lastSolve ? (
            <LastSolveActions
              solve={lastSolve}
              onPenalty={(penalty) => setPenalty(lastSolve.id, penalty)}
              onDelete={() => {
                deleteSolve(lastSolve.id);
                reset();
              }}
            />
          ) : null}
          <View style={[styles.statsRow, { gap: theme.spacing.lg }]}>
            <MiniStat label="Ao5" />
            <MiniStat label="Ao12" />
            <MiniStat label="Solves" value={String(solves.length)} />
          </View>
        </View>
      ) : null}
    </Screen>
  );
}

function MiniStat({ label, value = '—' }: { label: string; value?: string }) {
  return (
    <View style={styles.miniStat}>
      <Text variant="overline" color="textSecondary">
        {label}
      </Text>
      <Text variant="stat">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'center' },
  touchArea: { flex: 1, justifyContent: 'center', gap: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'center' },
  miniStat: { alignItems: 'center', gap: 2, minWidth: 72 },
});
