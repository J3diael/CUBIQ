/**
 * @jest-environment node
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { z } from 'zod';

import type { AppDatabase } from '../client';
import {
  addQueuedScramble,
  listQueuedScrambles,
  removeQueuedScramble,
} from '../repositories/scramble-queue-repository';
import {
  createSession,
  deleteSession,
  getSession,
  listSessions,
  renameSession,
} from '../repositories/sessions-repository';
import { deleteSetting, getSetting, setSetting } from '../repositories/settings-repository';
import {
  addSolve,
  bestSingle,
  countSolves,
  deleteSolve,
  getSolve,
  listSolves,
  recentSolves,
  restoreSolve,
  setNotes,
  setPenalty,
} from '../repositories/solves-repository';
import { createTestDatabase } from '../test-utils';

let db: AppDatabase;
let close: () => void;

beforeEach(() => {
  ({ db, close } = createTestDatabase());
});
afterEach(() => close());

const solveInput = (sessionId: string, rawTimeMs: number, extra: object = {}) => ({
  sessionId,
  puzzleId: '333',
  scramble: "R U R' U'",
  rawTimeMs,
  solvedAt: 1_000 + rawTimeMs,
  ...extra,
});

describe('sessions', () => {
  it('creates, reads and renames a session', () => {
    const session = createSession(
      db,
      { name: '  Daily 3x3 ', puzzleId: '333', method: 'cfop' },
      100,
    );
    expect(session).toMatchObject({
      name: 'Daily 3x3',
      puzzleId: '333',
      method: 'cfop',
      purpose: null,
    });
    renameSession(db, session.id, 'Comp prep', 200);
    expect(getSession(db, session.id)).toMatchObject({ name: 'Comp prep', updatedAt: 200 });
  });

  it('rejects blank names, both in validation and in the database', () => {
    expect(() => createSession(db, { name: '   ', puzzleId: '333' })).toThrow(
      'Give the session a name',
    );
    const session = createSession(db, { name: 'Ok', puzzleId: '333' });
    expect(() => renameSession(db, session.id, '')).toThrow();
  });

  it('lists sessions with solve counts and best single, most recently used first', () => {
    const a = createSession(db, { name: 'A', puzzleId: '333' }, 100);
    const b = createSession(db, { name: 'B', puzzleId: '333' }, 200);
    addSolve(db, solveInput(a.id, 12_000), 300);
    addSolve(db, solveInput(a.id, 9_000, { penalty: 'plus2' }), 301);
    addSolve(db, solveInput(a.id, 8_000, { penalty: 'dnf' }), 302);

    const list = listSessions(db);
    expect(list.map((s) => s.name)).toEqual(['A', 'B']);
    expect(list[0]).toMatchObject({ solveCount: 3, bestSingleMs: 11_000 });
    expect(list[1]).toMatchObject({
      id: b.id,
      solveCount: 0,
      bestSingleMs: null,
      lastSolvedAt: null,
    });
  });

  it('soft-deletes a session together with its solves', () => {
    const a = createSession(db, { name: 'A', puzzleId: '333' });
    const solve = addSolve(db, solveInput(a.id, 10_000));
    deleteSession(db, a.id);
    expect(getSession(db, a.id)).toBeNull();
    expect(listSessions(db)).toHaveLength(0);
    expect(getSolve(db, solve.id)).toBeNull();
    expect(countSolves(db)).toBe(0);
  });
});

describe('solves', () => {
  let sessionId: string;
  beforeEach(() => {
    sessionId = createSession(db, { name: 'S', puzzleId: '333' }).id;
  });

  it('saves and retrieves a solve with its exact scramble', () => {
    const saved = addSolve(
      db,
      solveInput(sessionId, 9874, { inspectionMs: 8000, scrambleGeneratedAt: 5 }),
    );
    expect(getSolve(db, saved.id)).toEqual({
      id: saved.id,
      sessionId,
      puzzleId: '333',
      scramble: "R U R' U'",
      scrambleGeneratedAt: 5,
      rawTimeMs: 9874,
      penalty: 'none',
      inspectionMs: 8000,
      source: 'timer',
      wasInterrupted: false,
      notes: null,
      solvedAt: 10_874,
    });
  });

  it('lists a session oldest first', () => {
    addSolve(db, { ...solveInput(sessionId, 1), solvedAt: 30 });
    addSolve(db, { ...solveInput(sessionId, 2), solvedAt: 10 });
    addSolve(db, { ...solveInput(sessionId, 3), solvedAt: 20 });
    expect(listSolves(db, sessionId).map((s) => s.rawTimeMs)).toEqual([2, 3, 1]);
  });

  it('updates the penalty and notes', () => {
    const saved = addSolve(db, solveInput(sessionId, 10_000));
    setPenalty(db, saved.id, 'plus2');
    setNotes(db, saved.id, '  lockup on F2L  ');
    expect(getSolve(db, saved.id)).toMatchObject({ penalty: 'plus2', notes: 'lockup on F2L' });
    setNotes(db, saved.id, '   ');
    expect(getSolve(db, saved.id)?.notes).toBeNull();
  });

  it('rejects invalid times and penalties', () => {
    expect(() => addSolve(db, solveInput(sessionId, -5))).toThrow();
    const saved = addSolve(db, solveInput(sessionId, 10_000));
    expect(() => setPenalty(db, saved.id, 'oops' as 'dnf')).toThrow();
  });

  it('enforces the session foreign key', () => {
    expect(() => addSolve(db, solveInput('missing-session', 10_000))).toThrow(/FOREIGN KEY/);
  });

  it('deletes a solve and restores it with undo', () => {
    const saved = addSolve(db, solveInput(sessionId, 10_000));
    deleteSolve(db, saved.id);
    expect(listSolves(db, sessionId)).toHaveLength(0);
    restoreSolve(db, saved.id);
    expect(listSolves(db, sessionId)).toHaveLength(1);
  });

  it('counts solves overall and since a time, and finds the best single', () => {
    addSolve(db, { ...solveInput(sessionId, 15_000), solvedAt: 100 });
    addSolve(db, { ...solveInput(sessionId, 9_000, { penalty: 'plus2' }), solvedAt: 200 });
    addSolve(db, { ...solveInput(sessionId, 7_000, { penalty: 'dnf' }), solvedAt: 300 });
    expect(countSolves(db)).toBe(3);
    expect(countSolves(db, { since: 200 })).toBe(2);
    expect(bestSingle(db, '333')).toBe(11_000);
    expect(bestSingle(db, '222')).toBeNull();
  });

  it('returns recent solves across sessions with the session name', () => {
    addSolve(db, { ...solveInput(sessionId, 1), solvedAt: 10 });
    addSolve(db, { ...solveInput(sessionId, 2), solvedAt: 20 });
    expect(recentSolves(db, 1)).toEqual([
      expect.objectContaining({ rawTimeMs: 2, sessionName: 'S' }),
    ]);
  });
});

describe('settings', () => {
  const schema = z.object({ inspection: z.boolean() });

  it('stores JSON values and overwrites them', () => {
    setSetting(db, 'timer', { inspection: true });
    expect(getSetting(db, 'timer', schema, { inspection: false })).toEqual({ inspection: true });
    setSetting(db, 'timer', { inspection: false });
    expect(getSetting(db, 'timer', schema, { inspection: true })).toEqual({ inspection: false });
  });

  it('falls back when a value is missing or invalid', () => {
    expect(getSetting(db, 'timer', schema, { inspection: false })).toEqual({ inspection: false });
    setSetting(db, 'timer', { inspection: 'yes' });
    expect(getSetting(db, 'timer', schema, { inspection: false })).toEqual({ inspection: false });
    deleteSetting(db, 'timer');
    expect(getSetting(db, 'timer', schema, { inspection: true })).toEqual({ inspection: true });
  });
});

describe('scramble queue', () => {
  it('keeps queued scrambles in generation order and removes used ones', () => {
    addQueuedScramble(db, { id: 'b', puzzleId: '333', notation: 'B', generatedAt: 2 });
    addQueuedScramble(db, { id: 'a', puzzleId: '333', notation: 'A', generatedAt: 1 });
    addQueuedScramble(db, { id: 'c', puzzleId: '222', notation: 'C', generatedAt: 3 });
    expect(listQueuedScrambles(db, '333').map((s) => s.notation)).toEqual(['A', 'B']);
    removeQueuedScramble(db, 'a');
    expect(listQueuedScrambles(db, '333').map((s) => s.id)).toEqual(['b']);
  });
});

describe('persistence', () => {
  it('keeps data after the database is closed and reopened', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'cubiq-'));
    const file = path.join(dir, 'test.db');
    try {
      const first = createTestDatabase(file);
      const session = createSession(first.db, { name: 'Persisted', puzzleId: '333' });
      addSolve(first.db, solveInput(session.id, 12_345, { penalty: 'plus2' }));
      setSetting(first.db, 'sessions.active', session.id);
      first.close();

      // Reopening runs migrations again; already-applied ones are skipped.
      const second = createTestDatabase(file);
      expect(listSessions(second.db)).toEqual([
        expect.objectContaining({ name: 'Persisted', solveCount: 1, bestSingleMs: 14_345 }),
      ]);
      expect(getSetting(second.db, 'sessions.active', z.string(), '')).toBe(session.id);
      second.close();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
