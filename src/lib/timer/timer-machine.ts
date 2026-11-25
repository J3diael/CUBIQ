import { inspectionPenalty } from './inspection';
import type { Penalty, SolveResult } from './types';

/**
 * The timer as a pure state machine. It knows nothing about React, touches or clocks:
 * callers pass events stamped with a monotonic timestamp (`performance.now()`), and the
 * solve time is always a difference between two of those timestamps. Display refreshes
 * never affect the measured time.
 *
 *   idle ──press──▶ holding ──held long enough──▶ ready ──release──▶ running ──press──▶ stopped
 *     │                ▲ released too early │                                              │
 *     │                └────────────────────┘                                              │
 *     └─(inspection on) press──▶ inspecting ──press──▶ holding …            stopped ──press──▶ (as idle)
 */

export interface TimerConfig {
  /** How long the screen must be held before the timer is ready. 0 = ready immediately. */
  holdMs: number;
  inspectionEnabled: boolean;
  /** Inspection length; WCA uses 15 000 ms. */
  inspectionMs: number;
}

export type TimerState =
  | { status: 'idle' }
  | { status: 'inspecting'; inspectionStart: number }
  | { status: 'holding'; holdStart: number; inspectionStart: number | null }
  | { status: 'ready'; inspectionStart: number | null }
  | {
      status: 'running';
      start: number;
      inspectionMs: number | null;
      penalty: Penalty;
    }
  | { status: 'stopped'; result: SolveResult };

export type TimerEvent =
  /** Finger down on the timer area. */
  | { type: 'pressIn'; at: number }
  /** Finger lifted. */
  | { type: 'pressOut'; at: number }
  /** Periodic check, so holding becomes ready without waiting for another touch. */
  | { type: 'tick'; at: number }
  /** Touch was cancelled by the system (e.g. app backgrounded) before the solve started. */
  | { type: 'cancel' }
  /** Moves running/inspection start times earlier by `ms`, to correct a clock that paused. */
  | { type: 'shift'; ms: number }
  | { type: 'reset' };

export const initialTimerState: TimerState = { status: 'idle' };

export function timerReducer(
  state: TimerState,
  event: TimerEvent,
  config: TimerConfig,
): TimerState {
  switch (event.type) {
    case 'reset':
      return initialTimerState;

    case 'pressIn':
      return onPressIn(state, event.at, config);

    case 'pressOut':
      return onPressOut(state, event.at, config);

    case 'tick':
      if (state.status === 'holding' && event.at - state.holdStart >= config.holdMs) {
        return { status: 'ready', inspectionStart: state.inspectionStart };
      }
      return state;

    case 'cancel':
      if (state.status === 'holding' || state.status === 'ready') {
        return backToWaiting(state.inspectionStart);
      }
      return state;

    case 'shift':
      if (state.status === 'running') return { ...state, start: state.start - event.ms };
      if (state.status === 'inspecting') {
        return { ...state, inspectionStart: state.inspectionStart - event.ms };
      }
      return state;
  }
}

function onPressIn(state: TimerState, at: number, config: TimerConfig): TimerState {
  switch (state.status) {
    case 'idle':
    case 'stopped':
      if (config.inspectionEnabled) return { status: 'inspecting', inspectionStart: at };
      return startHolding(at, null, config);
    case 'inspecting':
      return startHolding(at, state.inspectionStart, config);
    case 'running':
      return {
        status: 'stopped',
        result: {
          rawMs: Math.max(0, Math.round(at - state.start)),
          penalty: state.penalty,
          inspectionMs: state.inspectionMs,
        },
      };
    case 'holding':
    case 'ready':
      // A second finger while already holding changes nothing.
      return state;
  }
}

function onPressOut(state: TimerState, at: number, config: TimerConfig): TimerState {
  if (state.status === 'holding') {
    // If a tick was missed, a long enough hold still counts as ready.
    if (at - state.holdStart >= config.holdMs) {
      return startRunning(at, state.inspectionStart, config);
    }
    return backToWaiting(state.inspectionStart);
  }
  if (state.status === 'ready') {
    return startRunning(at, state.inspectionStart, config);
  }
  // Releasing after stopping, or during inspection, does nothing.
  return state;
}

function startHolding(at: number, inspectionStart: number | null, config: TimerConfig): TimerState {
  if (config.holdMs <= 0) return { status: 'ready', inspectionStart };
  return { status: 'holding', holdStart: at, inspectionStart };
}

function startRunning(at: number, inspectionStart: number | null, config: TimerConfig): TimerState {
  const inspectionMs = inspectionStart === null ? null : Math.round(at - inspectionStart);
  return {
    status: 'running',
    start: at,
    inspectionMs,
    penalty: inspectionMs === null ? 'none' : inspectionPenalty(inspectionMs, config.inspectionMs),
  };
}

function backToWaiting(inspectionStart: number | null): TimerState {
  return inspectionStart === null ? initialTimerState : { status: 'inspecting', inspectionStart };
}

/** Time to show on screen at `now`. */
export function displayedElapsedMs(state: TimerState, now: number): number {
  switch (state.status) {
    case 'running':
      return Math.max(0, now - state.start);
    case 'stopped':
      return state.result.rawMs;
    default:
      return 0;
  }
}

/** True while a solve or inspection is in progress, when distractions should be hidden. */
export function isTimerBusy(state: TimerState): boolean {
  return state.status !== 'idle' && state.status !== 'stopped';
}
