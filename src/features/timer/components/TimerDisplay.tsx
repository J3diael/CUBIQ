import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { inspectionPhase, type Penalty, type TimerState } from '@/lib/timer';
import { formatSolveTime } from '@/lib/time/format-result';
import { formatDuration } from '@/lib/time/format';
import type { DisplayDecimals, TimerColor, TimerSize } from '@/store/settings-store';
import type { ColorToken } from '@/theme';

import { now } from '../use-timer';

interface TimerDisplayProps {
  state: TimerState;
  decimals: DisplayDecimals;
  inspectionMs: number;
  hideWhileRunning: boolean;
  /** Whole seconds only while running, for less distraction. */
  secondsOnlyWhileRunning?: boolean;
  size?: TimerSize;
  /** Colour of the time when idle, running or stopped. Ready and holding keep theirs. */
  timeColor?: TimerColor;
  /** Double tap with a screen reader: start or stop (see useTimer's `activate`). */
  onActivate?: () => void;
  /** Penalty of the recorded solve, which the user may have changed after stopping. */
  stoppedPenalty?: Penalty;
}

/**
 * Shows the time. Only this component re-renders on every frame while running,
 * and the frame loop only updates the display: it never affects the measured time.
 */
export function TimerDisplay({
  state,
  decimals,
  inspectionMs,
  hideWhileRunning,
  secondsOnlyWhileRunning = false,
  size = 'medium',
  timeColor = 'default',
  stoppedPenalty,
  onActivate,
}: TimerDisplayProps) {
  const clock = useFrameClock(
    state.status === 'running' || state.status === 'inspecting' || hasInspection(state),
  );

  let text: string;
  const baseColor = BASE_COLORS[timeColor];
  let color: ColorToken = baseColor;
  let label: string;

  switch (state.status) {
    case 'idle':
      text = formatDuration(0, decimals);
      label = 'Timer, ready for a new solve';
      break;
    case 'holding':
    case 'ready':
    case 'inspecting': {
      color =
        state.status === 'holding'
          ? 'timerHolding'
          : state.status === 'ready'
            ? 'timerReady'
            : baseColor;
      if (state.inspectionStart !== null) {
        const phase = inspectionPhase(clock - state.inspectionStart, inspectionMs);
        text =
          phase.kind === 'counting'
            ? String(phase.secondsLeft)
            : phase.kind === 'plus2'
              ? '+2'
              : 'DNF';
        if (phase.kind !== 'counting' && state.status === 'inspecting') color = 'warning';
        label = `Inspection, ${text}`;
      } else {
        text = formatDuration(0, decimals);
        label = state.status === 'ready' ? 'Ready, release to start' : 'Holding';
      }
      break;
    }
    case 'running':
      text = hideWhileRunning
        ? 'Solving'
        : secondsOnlyWhileRunning
          ? String(Math.floor(Math.max(0, clock - state.start) / 1000))
          : formatDuration(Math.max(0, clock - state.start), decimals);
      label = 'Timer running';
      break;
    case 'stopped':
      text = formatSolveTime(state.result.rawMs, stoppedPenalty ?? state.result.penalty, decimals, {
        showRawForDnf: true,
      });
      label = `Solve time ${text}`;
      break;
  }

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="timer"
      accessibilityLabel={label}
      accessibilityActions={
        onActivate ? [{ name: 'activate', label: activateLabel(state) }] : undefined
      }
      onAccessibilityAction={(e) => {
        if (e.nativeEvent.actionName === 'activate') onActivate?.();
      }}
    >
      <Text
        variant="timer"
        color={color}
        align="center"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={
          state.status === 'running' && hideWhileRunning
            ? styles.solving
            : { fontSize: SIZES[size], lineHeight: Math.round(SIZES[size] * 1.17) }
        }
      >
        {text}
      </Text>
    </View>
  );
}

const SIZES: Record<TimerSize, number> = { small: 56, medium: 72, large: 88, huge: 108 };
const BASE_COLORS: Record<TimerColor, ColorToken> = {
  default: 'textPrimary',
  accent: 'accent',
  green: 'success',
  amber: 'warning',
};

function activateLabel(state: TimerState): string {
  if (state.status === 'running') return 'Stop the timer';
  if (state.status === 'inspecting') return 'Start the solve';
  return 'Start the timer';
}

function hasInspection(state: TimerState): boolean {
  return (state.status === 'holding' || state.status === 'ready') && state.inspectionStart !== null;
}

/** Re-renders on each animation frame while `active`, returning the current monotonic time. */
function useFrameClock(active: boolean): number {
  const [time, setTime] = useState(now);
  useEffect(() => {
    if (!active) return;
    let frame = requestAnimationFrame(function loop() {
      setTime(now());
      frame = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(frame);
  }, [active]);
  return active ? time : now();
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 8 },
  solving: { fontSize: 40, lineHeight: 48 },
});
