import {
  displayedElapsedMs,
  initialTimerState,
  isTimerBusy,
  timerReducer,
  type TimerConfig,
  type TimerEvent,
  type TimerState,
} from '../timer-machine';

const noInspection: TimerConfig = { holdMs: 300, inspectionEnabled: false, inspectionMs: 15_000 };
const withInspection: TimerConfig = { ...noInspection, inspectionEnabled: true };

function run(events: TimerEvent[], config = noInspection, from: TimerState = initialTimerState) {
  return events.reduce((state, event) => timerReducer(state, event, config), from);
}

describe('hold to start', () => {
  it('is not ready until the hold time has passed', () => {
    expect(
      run([
        { type: 'pressIn', at: 1000 },
        { type: 'tick', at: 1299 },
      ]).status,
    ).toBe('holding');
    expect(
      run([
        { type: 'pressIn', at: 1000 },
        { type: 'tick', at: 1300 },
      ]).status,
    ).toBe('ready');
  });

  it('goes back to idle when released too early', () => {
    const state = run([
      { type: 'pressIn', at: 1000 },
      { type: 'pressOut', at: 1200 },
    ]);
    expect(state).toEqual({ status: 'idle' });
  });

  it('starts on release once ready', () => {
    const state = run([
      { type: 'pressIn', at: 1000 },
      { type: 'tick', at: 1350 },
      { type: 'pressOut', at: 1500 },
    ]);
    expect(state).toEqual({ status: 'running', start: 1500, inspectionMs: null, penalty: 'none' });
  });

  it('still starts on a long enough release when a tick was missed', () => {
    const state = run([
      { type: 'pressIn', at: 1000 },
      { type: 'pressOut', at: 1400 },
    ]);
    expect(state.status).toBe('running');
  });

  it('is ready immediately with a zero hold time', () => {
    const state = run([{ type: 'pressIn', at: 1000 }], { ...noInspection, holdMs: 0 });
    expect(state.status).toBe('ready');
  });

  it('ignores a second finger while holding', () => {
    const holding = run([{ type: 'pressIn', at: 1000 }]);
    expect(timerReducer(holding, { type: 'pressIn', at: 1100 }, noInspection)).toBe(holding);
  });
});

describe('timing', () => {
  it('measures the difference between release and the stopping press', () => {
    const state = run([
      { type: 'pressIn', at: 1000 },
      { type: 'tick', at: 1300 },
      { type: 'pressOut', at: 2000.4 },
      { type: 'tick', at: 5000 },
      { type: 'pressIn', at: 11_874.6 },
    ]);
    expect(state).toEqual({
      status: 'stopped',
      result: { rawMs: 9874, penalty: 'none', inspectionMs: null },
    });
  });

  it('is unaffected by how often ticks arrive', () => {
    const base: TimerEvent[] = [
      { type: 'pressIn', at: 0 },
      { type: 'pressOut', at: 500 },
    ];
    const manyTicks = Array.from({ length: 200 }, (_, i): TimerEvent => ({
      type: 'tick',
      at: 500 + i * 37,
    }));
    const a = run([...base, { type: 'pressIn', at: 10_500 }]);
    const b = run([...base, ...manyTicks, { type: 'pressIn', at: 10_500 }]);
    expect(a).toEqual(b);
  });

  it('ignores the release that follows the stopping press', () => {
    const stopped = run([
      { type: 'pressIn', at: 0 },
      { type: 'pressOut', at: 500 },
      { type: 'pressIn', at: 1500 },
    ]);
    expect(timerReducer(stopped, { type: 'pressOut', at: 1600 }, noInspection)).toBe(stopped);
  });

  it('can start the next solve from stopped', () => {
    const stopped = run([
      { type: 'pressIn', at: 0 },
      { type: 'pressOut', at: 500 },
      { type: 'pressIn', at: 1500 },
    ]);
    expect(timerReducer(stopped, { type: 'pressIn', at: 3000 }, noInspection).status).toBe(
      'holding',
    );
  });

  it('shift extends a running solve to correct a paused clock', () => {
    const running = run([
      { type: 'pressIn', at: 0 },
      { type: 'pressOut', at: 500 },
    ]);
    const shifted = run(
      [
        { type: 'shift', ms: 4000 },
        { type: 'pressIn', at: 1500 },
      ],
      noInspection,
      running,
    );
    expect(shifted).toMatchObject({ status: 'stopped', result: { rawMs: 5000 } });
  });
});

describe('inspection', () => {
  it('starts inspection on the first press', () => {
    expect(run([{ type: 'pressIn', at: 0 }], withInspection)).toEqual({
      status: 'inspecting',
      inspectionStart: 0,
    });
  });

  it('records inspection time and no penalty within 15 s', () => {
    const state = run(
      [
        { type: 'pressIn', at: 0 },
        { type: 'pressOut', at: 100 },
        { type: 'pressIn', at: 9000 },
        { type: 'tick', at: 9300 },
        { type: 'pressOut', at: 10_000 },
      ],
      withInspection,
    );
    expect(state).toEqual({
      status: 'running',
      start: 10_000,
      inspectionMs: 10_000,
      penalty: 'none',
    });
  });

  it('gives +2 for starting between 15 and 17 s', () => {
    const state = run(
      [
        { type: 'pressIn', at: 0 },
        { type: 'pressIn', at: 15_000 },
        { type: 'pressOut', at: 16_000 },
        { type: 'pressIn', at: 26_000 },
      ],
      withInspection,
    );
    expect(state).toEqual({
      status: 'stopped',
      result: { rawMs: 10_000, penalty: 'plus2', inspectionMs: 16_000 },
    });
  });

  it('gives DNF for starting after 17 s', () => {
    const state = run(
      [
        { type: 'pressIn', at: 0 },
        { type: 'pressIn', at: 17_000 },
        { type: 'pressOut', at: 17_500 },
      ],
      withInspection,
    );
    expect(state).toMatchObject({ status: 'running', penalty: 'dnf' });
  });

  it('returns to inspection, not idle, when the hold is released early', () => {
    const state = run(
      [
        { type: 'pressIn', at: 0 },
        { type: 'pressIn', at: 5000 },
        { type: 'pressOut', at: 5100 },
      ],
      withInspection,
    );
    expect(state).toEqual({ status: 'inspecting', inspectionStart: 0 });
  });

  it('keeps inspection running when a hold is cancelled', () => {
    const state = run(
      [{ type: 'pressIn', at: 0 }, { type: 'pressIn', at: 5000 }, { type: 'cancel' }],
      withInspection,
    );
    expect(state).toEqual({ status: 'inspecting', inspectionStart: 0 });
  });
});

describe('helpers', () => {
  it('displays live elapsed time while running and the result when stopped', () => {
    const running = run([
      { type: 'pressIn', at: 0 },
      { type: 'pressOut', at: 500 },
    ]);
    expect(displayedElapsedMs(running, 1750)).toBe(1250);
    const stopped = run([{ type: 'pressIn', at: 2500 }], noInspection, running);
    expect(displayedElapsedMs(stopped, 99_999)).toBe(2000);
    expect(displayedElapsedMs(initialTimerState, 1234)).toBe(0);
  });

  it('reports busy only during a solve attempt', () => {
    expect(isTimerBusy(initialTimerState)).toBe(false);
    expect(isTimerBusy(run([{ type: 'pressIn', at: 0 }]))).toBe(true);
    expect(isTimerBusy(run([{ type: 'pressIn', at: 0 }], withInspection))).toBe(true);
  });

  it('reset always returns to idle', () => {
    const running = run([
      { type: 'pressIn', at: 0 },
      { type: 'pressOut', at: 500 },
    ]);
    expect(timerReducer(running, { type: 'reset' }, noInspection)).toEqual({ status: 'idle' });
  });
});
