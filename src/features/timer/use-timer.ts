import { useCallback, useEffect, useEffectEvent, useRef, useState } from 'react';
import { AppState, BackHandler, type AppStateStatus } from 'react-native';

import {
  initialTimerState,
  inspectionWarningsMs,
  isTimerBusy,
  timerReducer,
  type SolveResult,
  type TimerConfig,
  type TimerEvent,
  type TimerState,
} from '@/lib/timer';
import { playHaptic } from '@/services/haptics';

/** Monotonic clock: unaffected by the user changing the device time. */
export const now = () => performance.now();

/** Wall-clock drift beyond this after backgrounding means the monotonic clock paused. */
const CLOCK_PAUSE_THRESHOLD_MS = 500;

export interface UseTimerOptions {
  config: TimerConfig;
  /** Called once per finished solve. `wasInterrupted` is true if the app was backgrounded mid-solve. */
  onSolve: (result: SolveResult, wasInterrupted: boolean) => void;
  /** Called when a solve starts running (true) and when it stops or is abandoned (false). */
  onRunningChange?: (running: boolean) => void;
}

/**
 * Connects the pure timer state machine to touches, the clock, haptics, the app
 * lifecycle and the Android back button. All solve timing happens in the reducer.
 */
export function useTimer({ config, onSolve, onRunningChange }: UseTimerOptions) {
  const [state, setState] = useState<TimerState>(initialTimerState);
  const dispatch = useCallback(
    (event: TimerEvent) => setState((current) => timerReducer(current, event, config)),
    [config],
  );
  const interruptedRef = useRef(false);
  const handleSolve = useEffectEvent((result: SolveResult) =>
    onSolve(result, interruptedRef.current),
  );
  const handleRunningChange = useEffectEvent((running: boolean) => onRunningChange?.(running));

  // Touch handlers take the timestamp first, before any other work.
  const pressIn = useCallback(() => dispatch({ type: 'pressIn', at: now() }), [dispatch]);
  const pressOut = useCallback(() => dispatch({ type: 'pressOut', at: now() }), [dispatch]);
  const cancelTouch = useCallback(() => dispatch({ type: 'cancel' }), [dispatch]);
  const reset = useCallback(() => dispatch({ type: 'reset' }), [dispatch]);

  // Holding → ready after the hold time, without waiting for another touch.
  // Timers can fire slightly early relative to the monotonic clock, so re-check until due.
  useEffect(() => {
    if (state.status !== 'holding') return;
    const holdStart = state.holdStart;
    let timeout: ReturnType<typeof setTimeout>;
    const check = () => {
      const remaining = config.holdMs - (now() - holdStart);
      if (remaining <= 0) dispatch({ type: 'tick', at: now() });
      else timeout = setTimeout(check, remaining + 1);
    };
    check();
    return () => clearTimeout(timeout);
  }, [state, config.holdMs, dispatch]);

  // Haptic cues on transitions, after the transition's timestamp is already recorded.
  const previousStatus = useRef(state.status);
  useEffect(() => {
    const previous = previousStatus.current;
    previousStatus.current = state.status;
    if (previous === state.status) return;
    if (state.status === 'ready') playHaptic('ready');
    if (state.status === 'running') {
      interruptedRef.current = false;
      handleRunningChange(true);
    }
    if (state.status === 'stopped') {
      playHaptic('stop');
      handleSolve(state.result);
    }
    if (previous === 'running') handleRunningChange(false);
  }, [state]);

  // Inspection warnings at 8 s and 12 s (for 15 s inspection).
  const inspectionStart =
    state.status === 'inspecting' || state.status === 'holding' || state.status === 'ready'
      ? state.inspectionStart
      : null;
  useEffect(() => {
    if (inspectionStart === null) return;
    const timeouts = inspectionWarningsMs(config.inspectionMs)
      .map((at) => at - (now() - inspectionStart))
      .filter((delay) => delay > 0)
      .map((delay) => setTimeout(() => playHaptic('warning'), delay));
    return () => timeouts.forEach(clearTimeout);
  }, [inspectionStart, config.inspectionMs]);

  // App backgrounded: drop an unfinished hold; keep a running solve going and
  // correct the clock on return if it paused while the phone slept.
  const background = useRef<{ mono: number; wall: number } | null>(null);
  const onAppStateChange = useEffectEvent((next: AppStateStatus) => {
    const status = state.status;
    if (next !== 'active') {
      if (status === 'holding' || status === 'ready') dispatch({ type: 'cancel' });
      if (!background.current) background.current = { mono: now(), wall: Date.now() };
      if (status === 'running') interruptedRef.current = true;
      return;
    }
    const away = background.current;
    background.current = null;
    if (!away || (status !== 'running' && status !== 'inspecting')) return;
    const drift = Date.now() - away.wall - (now() - away.mono);
    if (drift > CLOCK_PAUSE_THRESHOLD_MS) dispatch({ type: 'shift', ms: drift });
  });
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  // Android back: cancel inspection; ignore during a solve so it can't be lost by accident.
  const busy = isTimerBusy(state);
  const onBackPress = useEffectEvent(() => {
    if (state.status === 'inspecting') dispatch({ type: 'reset' });
    return true;
  });
  useEffect(() => {
    if (!busy) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [busy]);

  return { state, busy, pressIn, pressOut, cancelTouch, reset };
}
