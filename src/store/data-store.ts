import { useMemo } from 'react';
import { z } from 'zod';
import { create } from 'zustand';

import { getDatabase, type AppDatabase } from '@/database/client';
import {
  createSession as createSessionRow,
  deleteSession as deleteSessionRow,
  getSession,
  listSessions,
  renameSession as renameSessionRow,
  type NewSessionInput,
} from '@/database/repositories/sessions-repository';
import { deleteSetting, getSetting, setSetting } from '@/database/repositories/settings-repository';
import {
  addSolve as addSolveRow,
  deleteSolve as deleteSolveRow,
  restoreSolve as restoreSolveRow,
  setNotes as setNotesRow,
  setPenalty as setPenaltyRow,
  type NewSolveInput,
} from '@/database/repositories/solves-repository';
import { DEFAULT_PUZZLE_ID } from '@/constants/puzzles';
import type { Penalty } from '@/lib/timer/types';
import type { Session, Solve } from '@/types/models';

export const DATA_SETTING_KEYS = {
  activeSession: 'sessions.active',
  inProgressSolve: 'timer.inProgress',
} as const;

export const DEFAULT_SESSION_NAME = '3x3 Practice';

/** Written when a solve starts and cleared when it ends, so a solve lost to a crash can be recovered. */
const inProgressSolveSchema = z.object({
  sessionId: z.string(),
  puzzleId: z.string(),
  scramble: z.string(),
  scrambleGeneratedAt: z.number().nullable(),
  startedAt: z.number(),
});
export type InProgressSolve = z.infer<typeof inProgressSolveSchema>;

interface DataState {
  /** Bumped after every write. Screens re-run their queries when it changes. */
  version: number;
  activeSessionId: string;
  /** A solve that was running when the app last closed, waiting for the user's decision. */
  interruptedSolve: InProgressSolve | null;

  /** Loads the active session (creating the first one if needed) and any interrupted solve. */
  load: () => void;

  /** Runs any repository write, then refreshes screens. Used by feature actions (training). */
  write: <T>(action: (db: AppDatabase) => T) => T;

  addSolve: (input: Omit<NewSolveInput, 'sessionId'> & { sessionId?: string }) => Solve;
  setPenalty: (id: string, penalty: Penalty) => void;
  setNotes: (id: string, notes: string) => void;
  deleteSolve: (id: string) => void;
  restoreSolve: (id: string) => void;

  createSession: (input: NewSessionInput) => Session;
  renameSession: (id: string, name: string) => void;
  /** Deletes a session and its solves. The last remaining session can't be deleted. */
  deleteSession: (id: string) => void;
  setActiveSession: (id: string) => void;

  markSolveStarted: (solve: Omit<InProgressSolve, 'sessionId'>) => void;
  markSolveEnded: () => void;
  resolveInterruptedSolve: (action: 'save-dnf' | 'discard') => void;
}

export const useDataStore = create<DataState>()((set, get) => {
  /** Runs a write, then tells subscribed screens to refresh. */
  function write<T>(action: (db: AppDatabase) => T): T {
    const result = action(getDatabase());
    set((state) => ({ version: state.version + 1 }));
    return result;
  }

  return {
    version: 0,
    activeSessionId: '',
    interruptedSolve: null,

    load: () => {
      const db = getDatabase();
      let sessions = listSessions(db);
      if (sessions.length === 0) {
        createSessionRow(db, { name: DEFAULT_SESSION_NAME, puzzleId: DEFAULT_PUZZLE_ID });
        sessions = listSessions(db);
      }
      const savedId = getSetting(db, DATA_SETTING_KEYS.activeSession, z.string(), '');
      // Fall back to the most recently used session if the saved one is gone.
      const active = sessions.find((s) => s.id === savedId) ?? sessions[0]!;
      const interruptedSolve = getSetting(
        db,
        DATA_SETTING_KEYS.inProgressSolve,
        inProgressSolveSchema.nullable(),
        null,
      );
      set((state) => ({
        activeSessionId: active.id,
        interruptedSolve,
        version: state.version + 1,
      }));
    },

    write: (action) => write(action),

    addSolve: (input) =>
      write((db) =>
        addSolveRow(db, { ...input, sessionId: input.sessionId ?? get().activeSessionId }),
      ),
    setPenalty: (id, penalty) => write((db) => setPenaltyRow(db, id, penalty)),
    setNotes: (id, notes) => write((db) => setNotesRow(db, id, notes)),
    deleteSolve: (id) => write((db) => deleteSolveRow(db, id)),
    restoreSolve: (id) => write((db) => restoreSolveRow(db, id)),

    createSession: (input) => write((db) => createSessionRow(db, input)),
    renameSession: (id, name) => write((db) => renameSessionRow(db, id, name)),
    deleteSession: (id) => {
      const db = getDatabase();
      const remaining = listSessions(db).filter((s) => s.id !== id);
      if (remaining.length === 0) throw new Error('You need at least one session.');
      write(() => deleteSessionRow(db, id));
      if (get().activeSessionId === id) get().setActiveSession(remaining[0]!.id);
    },
    setActiveSession: (id) => {
      const db = getDatabase();
      if (!getSession(db, id)) return;
      setSetting(db, DATA_SETTING_KEYS.activeSession, id);
      set((state) => ({ activeSessionId: id, version: state.version + 1 }));
    },

    markSolveStarted: (solve) => {
      try {
        setSetting(getDatabase(), DATA_SETTING_KEYS.inProgressSolve, {
          ...solve,
          sessionId: get().activeSessionId,
        });
      } catch (error) {
        console.warn('Could not save the in-progress solve', error);
      }
    },
    markSolveEnded: () => {
      try {
        deleteSetting(getDatabase(), DATA_SETTING_KEYS.inProgressSolve);
      } catch (error) {
        console.warn('Could not clear the in-progress solve', error);
      }
    },
    resolveInterruptedSolve: (action) => {
      const pending = get().interruptedSolve;
      if (!pending) return;
      const db = getDatabase();
      if (action === 'save-dnf') {
        // The time itself was lost with the app, so it is stored as a DNF with no time.
        const sessionId = getSession(db, pending.sessionId)
          ? pending.sessionId
          : get().activeSessionId;
        write(() =>
          addSolveRow(db, {
            sessionId,
            puzzleId: pending.puzzleId,
            scramble: pending.scramble,
            scrambleGeneratedAt: pending.scrambleGeneratedAt,
            rawTimeMs: 0,
            penalty: 'dnf',
            wasInterrupted: true,
            notes: 'The app closed during this solve, so its time was lost.',
            solvedAt: pending.startedAt,
          }),
        );
      }
      deleteSetting(db, DATA_SETTING_KEYS.inProgressSolve);
      set({ interruptedSolve: null });
    },
  };
});

/**
 * Runs a read query against the database and re-runs it after every write.
 * Queries are synchronous and indexed, so re-running them is cheap.
 */
export function useDbQuery<T>(query: (db: AppDatabase) => T): T {
  // The React Compiler would see that `version` isn't read by the query and drop it from
  // the memo, so the query would never re-run. This hook manages its own memoization.
  'use no memo';
  const version = useDataStore((state) => state.version);
  return useMemo(() => {
    void version;
    return query(getDatabase());
  }, [query, version]);
}
