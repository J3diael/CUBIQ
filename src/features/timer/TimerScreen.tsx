import { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Keyboard } from 'lucide-react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';

import { Chip, IconButton, Screen, Text } from '@/components/ui';
import { DEFAULT_PUZZLE_ID, PUZZLES } from '@/constants/puzzles';
import { getSession } from '@/database/repositories/sessions-repository';
import { listSolves } from '@/database/repositories/solves-repository';
import { useScramble } from '@/features/scrambles/use-scramble';
import { SessionSwitcherSheet } from '@/features/sessions/components/SessionSwitcherSheet';
import { deleteSolveWithUndo } from '@/features/solves/actions';
import { saveSolveAndCheckRecords } from '@/features/stats/record-solve';
import { currentAverage, formatStat, toFinalTimes } from '@/lib/stats';
import type { SolveResult, TimerConfig } from '@/lib/timer';
import { useDataStore, useDbQuery } from '@/store/data-store';
import { useSettingsStore } from '@/store/settings-store';
import { useUiStore } from '@/store/ui-store';
import { allowAnyOrientation, lockPortrait } from '@/services/orientation';
import { useTheme } from '@/theme';
import { motion } from '@/theme/tokens';

import { LastSolveActions } from './components/LastSolveActions';
import { ManualEntrySheet } from './components/ManualEntrySheet';
import { ScrambleCard } from './components/ScrambleCard';
import { TimerDisplay } from './components/TimerDisplay';
import { useTimer } from './use-timer';

const KEEP_AWAKE_TAG = 'cubiq-timer';
// Skipped when the system asks for reduced motion.
const fadeIn = FadeIn.duration(motion.normal).reduceMotion(ReduceMotion.System);

export function TimerScreen() {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const settings = useSettingsStore((s) => s.timer);
  const activeSessionId = useDataStore((s) => s.activeSessionId);
  const session = useDbQuery((db) => getSession(db, activeSessionId));
  const puzzle = PUZZLES[session?.puzzleId ?? DEFAULT_PUZZLE_ID];
  const solves = useDbQuery((db) => listSolves(db, activeSessionId));
  const times = useMemo(() => toFinalTimes(solves), [solves]);
  const setPenalty = useDataStore((s) => s.setPenalty);
  const markSolveStarted = useDataStore((s) => s.markSolveStarted);
  const markSolveEnded = useDataStore((s) => s.markSolveEnded);
  const setFocusMode = useUiStore((s) => s.setTimerFocusMode);
  const scramble = useScramble(puzzle.id);
  const [sheet, setSheet] = useState<'sessions' | 'manual' | null>(null);
  const [lastSolveId, setLastSolveId] = useState<string | null>(null);
  const [recordMessage, setRecordMessage] = useState<string | null>(null);

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
      const { solve, message } = saveSolveAndCheckRecords(
        {
          puzzleId: puzzle.id,
          scramble: scramble.scramble?.notation ?? '',
          scrambleGeneratedAt: scramble.scramble?.generatedAt ?? null,
          rawTimeMs: result.rawMs,
          penalty: result.penalty,
          inspectionMs: result.inspectionMs,
          source: 'timer',
          wasInterrupted,
          solvedAt: Date.now(),
        },
        // Shown under the time instead of a toast, which would cover the stats.
        { announce: 'none' },
      );
      setLastSolveId(solve.id);
      setRecordMessage(message);
      scramble.next();
    },
    [scramble, puzzle.id],
  );

  // A record of the running solve, so it can be recovered if the app is closed mid-solve.
  const onRunningChange = useCallback(
    (running: boolean) => {
      if (!running) return markSolveEnded();
      markSolveStarted({
        puzzleId: puzzle.id,
        scramble: scramble.scramble?.notation ?? '',
        scrambleGeneratedAt: scramble.scramble?.generatedAt ?? null,
        startedAt: Date.now(),
      });
    },
    [markSolveEnded, markSolveStarted, scramble.scramble, puzzle.id],
  );

  const onManualSave = useCallback(
    (entry: { rawTimeMs: number; penalty: SolveResult['penalty'] }) => {
      saveSolveAndCheckRecords({
        puzzleId: puzzle.id,
        scramble: scramble.scramble?.notation ?? '',
        scrambleGeneratedAt: scramble.scramble?.generatedAt ?? null,
        rawTimeMs: entry.rawTimeMs,
        penalty: entry.penalty,
        source: 'manual',
        solvedAt: Date.now(),
      });
      scramble.next();
    },
    [scramble, puzzle.id],
  );

  const timer = useTimer({ config, onSolve, onRunningChange });
  const { state, busy, reset } = timer;

  useEffect(() => {
    setFocusMode(busy);
  }, [busy, setFocusMode]);

  // Leaving the tab cancels inspection or a half-finished hold, and keep-awake ends.
  useFocusEffect(
    useCallback(() => {
      if (settings.keepScreenAwake) activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {});
      if (settings.allowLandscape) allowAnyOrientation();
      return () => {
        deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
        if (settings.allowLandscape) lockPortrait();
        setFocusMode(false);
        reset();
      };
    }, [settings.keepScreenAwake, settings.allowLandscape, setFocusMode, reset]),
  );

  // Penalty controls apply to the solve just timed, while its time is still on screen.
  const lastSolve =
    state.status === 'stopped' ? solves.find((s) => s.id === lastSolveId) : undefined;

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
    <Screen
      scroll={false}
      contentStyle={styles.content}
      backgroundColor={
        settings.timerBackground === 'black'
          ? '#000000'
          : settings.timerBackground === 'surface'
            ? theme.colors.surface
            : undefined
      }
    >
      {!busy ? (
        // Controls fade back in after a solve; the fade runs on the UI thread, and
        // nothing animates while the timer is running.
        <Animated.View entering={fadeIn} style={{ gap: theme.spacing.md }}>
          <View style={styles.headerRow}>
            <View style={styles.headerSpacer} />
            <Chip
              label={`${puzzle.shortName} · ${session?.name ?? 'Session'}`}
              selected
              accessibilityLabel={`Session: ${session?.name ?? ''}. Change session`}
              onPress={() => setSheet('sessions')}
            />
            <View style={[styles.headerSpacer, { alignItems: 'flex-end' }]}>
              <IconButton
                icon={Keyboard}
                accessibilityLabel="Add a time manually"
                color="textSecondary"
                size={20}
                onPress={() => setSheet('manual')}
              />
            </View>
          </View>
          <ScrambleCard scramble={scramble} onNewScramble={scramble.next} />
        </Animated.View>
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
          secondsOnlyWhileRunning={settings.secondsOnlyWhileRunning}
          size={settings.timerSize}
          timeColor={settings.timerColor}
          onActivate={timer.activate}
          stoppedPenalty={lastSolve?.penalty}
        />
        {state.status === 'stopped' && recordMessage && lastSolve ? (
          <Text variant="bodyStrong" color="accent" align="center" accessibilityRole="alert">
            {recordMessage}
          </Text>
        ) : null}
        <Text variant="caption" color="textSecondary" align="center">
          {hint}
        </Text>
      </View>

      {!busy ? (
        <Animated.View
          entering={fadeIn}
          style={{
            gap: theme.spacing.md,
            minHeight: landscape ? 0 : 96,
            justifyContent: 'flex-end',
          }}
        >
          {lastSolve ? (
            <LastSolveActions
              solve={lastSolve}
              onPenalty={(penalty) => {
                setPenalty(lastSolve.id, penalty);
                // A penalty can undo the record; the stats screen always has the truth.
                if (penalty !== lastSolve.penalty) setRecordMessage(null);
              }}
              onDelete={() => {
                deleteSolveWithUndo(lastSolve.id);
                reset();
              }}
            />
          ) : null}
          {/* Landscape is short: the time and scramble come first. */}
          {landscape ? null : (
            <View style={[styles.statsRow, { gap: theme.spacing.lg }]}>
              <MiniStat
                label="Ao5"
                value={formatStat(currentAverage(times, 'ao5'), settings.decimals)}
              />
              <MiniStat
                label="Ao12"
                value={formatStat(currentAverage(times, 'ao12'), settings.decimals)}
              />
              <MiniStat label="Solves" value={String(solves.length)} />
            </View>
          )}
        </Animated.View>
      ) : null}

      <SessionSwitcherSheet visible={sheet === 'sessions'} onClose={() => setSheet(null)} />
      <ManualEntrySheet
        visible={sheet === 'manual'}
        scramble={scramble.scramble?.notation ?? null}
        onClose={() => setSheet(null)}
        onSave={onManualSave}
      />
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
  headerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  headerSpacer: { flex: 1 },
  touchArea: { flex: 1, justifyContent: 'center', gap: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'center' },
  miniStat: { alignItems: 'center', gap: 2, minWidth: 72 },
});
