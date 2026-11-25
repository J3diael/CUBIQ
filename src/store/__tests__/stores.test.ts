/**
 * @jest-environment node
 */
import { getDatabase } from '@/database/client';
import { setSetting } from '@/database/repositories/settings-repository';
import { listSessions } from '@/database/repositories/sessions-repository';
import { listSolves } from '@/database/repositories/solves-repository';

import { DATA_SETTING_KEYS, DEFAULT_SESSION_NAME, useDataStore } from '../data-store';
import { DEFAULT_TIMER_SETTINGS, useSettingsStore } from '../settings-store';

const data = () => useDataStore.getState();

describe('data store', () => {
  it('creates one default session on first launch and reuses it later', () => {
    expect(listSessions(getDatabase()).map((s) => s.name)).toEqual([DEFAULT_SESSION_NAME]);
    data().load();
    expect(listSessions(getDatabase())).toHaveLength(1);
  });

  it('remembers the active session across launches', () => {
    const other = data().createSession({ name: 'OH', puzzleId: '333' });
    data().setActiveSession(other.id);
    useDataStore.setState({ activeSessionId: '' });
    data().load();
    expect(data().activeSessionId).toBe(other.id);
  });

  it('falls back to the most recent session when the saved one is gone', () => {
    setSetting(getDatabase(), DATA_SETTING_KEYS.activeSession, 'missing-id');
    data().load();
    expect(data().activeSessionId).toBe(listSessions(getDatabase())[0]?.id);
  });

  it('refuses to delete the last session', () => {
    expect(() => data().deleteSession(data().activeSessionId)).toThrow('at least one session');
  });

  it('bumps the version after writes so screens re-query', () => {
    const before = data().version;
    data().addSolve({ puzzleId: '333', scramble: 'R', rawTimeMs: 1000, solvedAt: 1 });
    expect(data().version).toBe(before + 1);
  });

  describe('interrupted solve recovery', () => {
    const started = {
      puzzleId: '333',
      scramble: "F R U' R' U' R U R' F'",
      scrambleGeneratedAt: 5,
      startedAt: 1_700_000_000_000,
    };

    it('offers a solve that was running when the app closed, and saves it as a DNF', () => {
      data().markSolveStarted(started);
      data().load(); // next launch
      expect(data().interruptedSolve).toMatchObject(started);

      data().resolveInterruptedSolve('save-dnf');
      expect(listSolves(getDatabase(), data().activeSessionId)).toEqual([
        expect.objectContaining({
          scramble: started.scramble,
          penalty: 'dnf',
          rawTimeMs: 0,
          wasInterrupted: true,
          solvedAt: started.startedAt,
        }),
      ]);
      data().load();
      expect(data().interruptedSolve).toBeNull();
    });

    it('saves it with a session of the same puzzle if its own session was deleted', () => {
      const db = getDatabase();
      const big = data().createSession({ name: 'Big cubes', puzzleId: '444' });
      data().setActiveSession(big.id);
      data().markSolveStarted({ ...started, puzzleId: '444' });
      const threeId = listSessions(db).find((s) => s.puzzleId === '333')!.id;
      data().setActiveSession(threeId);
      data().deleteSession(big.id);
      data().load();

      data().resolveInterruptedSolve('save-dnf');
      // Not in the active 3x3 session: a new 4x4 session holds it.
      expect(listSolves(db, threeId)).toHaveLength(0);
      const four = listSessions(db).find((s) => s.puzzleId === '444')!;
      expect(four.name).toBe('4x4 Practice');
      expect(listSolves(db, four.id)).toEqual([
        expect.objectContaining({ puzzleId: '444', penalty: 'dnf' }),
      ]);
    });

    it('can discard it instead', () => {
      data().markSolveStarted(started);
      data().load();
      data().resolveInterruptedSolve('discard');
      expect(listSolves(getDatabase(), data().activeSessionId)).toHaveLength(0);
      data().load();
      expect(data().interruptedSolve).toBeNull();
    });

    it('has nothing to recover after a solve ends normally', () => {
      data().markSolveStarted(started);
      data().markSolveEnded();
      data().load();
      expect(data().interruptedSolve).toBeNull();
    });
  });
});

describe('settings store', () => {
  it('saves timer settings and loads them on the next launch', () => {
    useSettingsStore.getState().updateTimerSettings({ inspectionEnabled: true, decimals: 2 });
    useSettingsStore.setState({ timer: DEFAULT_TIMER_SETTINGS });
    useSettingsStore.getState().hydrate();
    expect(useSettingsStore.getState().timer).toMatchObject({
      inspectionEnabled: true,
      decimals: 2,
      holdMs: DEFAULT_TIMER_SETTINGS.holdMs,
    });
  });

  it('keeps valid fields and uses defaults for invalid or missing ones', () => {
    setSetting(getDatabase(), 'timer', {
      holdMs: 550,
      decimals: 7,
      unknown: true,
      timerSize: 'giant',
      timerColor: 'green',
    });
    setSetting(getDatabase(), 'appearance.theme', 'purple');
    useSettingsStore.getState().hydrate();
    const state = useSettingsStore.getState();
    expect(state.timer).toEqual({ ...DEFAULT_TIMER_SETTINGS, holdMs: 550, timerColor: 'green' });
    expect(state.themePreference).toBe('dark');
  });
});
