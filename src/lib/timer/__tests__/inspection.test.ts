import { inspectionPenalty, inspectionPhase, inspectionWarningsMs } from '../inspection';

describe('inspectionPenalty (15 s)', () => {
  it.each([
    [0, 'none'],
    [14_999, 'none'],
    [15_000, 'none'],
    [15_001, 'plus2'],
    [17_000, 'plus2'],
    [17_001, 'dnf'],
    [60_000, 'dnf'],
  ] as const)('%d ms → %s', (elapsed, expected) => {
    expect(inspectionPenalty(elapsed, 15_000)).toBe(expected);
  });

  it('scales the grace period to custom durations', () => {
    expect(inspectionPenalty(8_500, 8_000)).toBe('plus2');
    expect(inspectionPenalty(10_500, 8_000)).toBe('dnf');
  });
});

describe('inspectionPhase', () => {
  it('counts whole seconds down, rounding up', () => {
    expect(inspectionPhase(0, 15_000)).toEqual({ kind: 'counting', secondsLeft: 15 });
    expect(inspectionPhase(1, 15_000)).toEqual({ kind: 'counting', secondsLeft: 15 });
    expect(inspectionPhase(1_000, 15_000)).toEqual({ kind: 'counting', secondsLeft: 14 });
    expect(inspectionPhase(14_999, 15_000)).toEqual({ kind: 'counting', secondsLeft: 1 });
    expect(inspectionPhase(15_000, 15_000)).toEqual({ kind: 'counting', secondsLeft: 0 });
  });

  it('shows +2 and then DNF after time is up', () => {
    expect(inspectionPhase(16_000, 15_000)).toEqual({ kind: 'plus2' });
    expect(inspectionPhase(18_000, 15_000)).toEqual({ kind: 'dnf' });
  });
});

describe('inspectionWarningsMs', () => {
  it('warns at 8 and 12 seconds for WCA inspection', () => {
    expect(inspectionWarningsMs(15_000)).toEqual([8_000, 12_000]);
  });

  it('drops warnings that would fall before the start', () => {
    expect(inspectionWarningsMs(5_000)).toEqual([2_000]);
  });
});
