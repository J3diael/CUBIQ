import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { inspectionPhase, type Penalty, type TimerState } from '@/lib/timer';
import { formatSolveTime } from '@/lib/time/format-result';
import { formatDuration } from '@/lib/time/format';
import type { DisplayDecimals } from '@/store/settings-store';
import type { ColorToken } from '@/theme';

import { now } from '../use-timer';

interface TimerDisplayProps {
  state: TimerState;
  decimals: DisplayDecimals;
  inspectionMs: number;
  hideWhileRunning: boolean;
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
  stoppedPenalty,
}: TimerDisplayProps) {
  const clock = useFrameClock(
    state.status === 'running' || state.status === 'inspecting' || hasInspection(state),
  );

  let text: string;
  let color: ColorToken = 'textPrimary';
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
            : 'textPrimary';
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
    <View style={styles.container} accessible accessibilityRole="timer" accessibilityLabel={label}>
      <Text
        variant="timer"
        color={color}
        align="center"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={state.status === 'running' && hideWhileRunning ? styles.solving : undefined}
      >
        {text}
      </Text>
    </View>
  );
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
