import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';

import { PUZZLES, type PuzzleId } from '@/constants/puzzles';
import { defaultGoalTitle } from '@/lib/goals/goals';
import { newId } from '@/utils/id';

import type { AppDatabase } from '../client';
import { GOAL_STATS, GOAL_TYPES, goals, type GoalRow } from '../schema';

export type Goal = Omit<GoalRow, 'deletedAt'>;

const puzzleIds = Object.keys(PUZZLES) as [PuzzleId, ...PuzzleId[]];
const ONE_HOUR = 60 * 60 * 1000;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullish()
    .transform((v) => (v ? v : null));

/** Checks a goal and fills in what its type needs; the title defaults to a description. */
export const goalInputSchema = z
  .object({
    type: z.enum(GOAL_TYPES),
    title: optionalText(60),
    notes: optionalText(500),
    target: z.number().int().nullish(),
    puzzleId: z.enum(puzzleIds).nullish(),
    stat: z.enum(GOAL_STATS).nullish(),
    algorithmSet: z.enum(['f2l', 'oll', 'pll']).nullish(),
  })
  .superRefine((g, ctx) => {
    const need = (ok: boolean, path: string, message: string) => {
      if (!ok) ctx.addIssue({ code: 'custom', path: [path], message });
    };
    const t = g.target ?? 0;
    switch (g.type) {
      case 'solves':
        need(t >= 1 && t <= 100_000, 'target', 'Choose between 1 and 100,000 solves');
        break;
      case 'time':
        need(t >= 100 && t <= ONE_HOUR, 'target', 'Enter a time like 20 or 1:30');
        need(!!g.puzzleId, 'puzzleId', 'Choose a puzzle');
        need(!!g.stat, 'stat', 'Choose single, Ao5 or Ao12');
        break;
      case 'algorithms':
        need(!!g.algorithmSet, 'algorithmSet', 'Choose F2L, OLL or PLL');
        break;
      case 'streak':
        need(t >= 2 && t <= 365, 'target', 'Choose between 2 and 365 days');
        break;
      case 'daily':
        need(t >= 1 && t <= 1000, 'target', 'Choose between 1 and 1,000 solves');
        break;
      case 'custom':
        need(!!g.title, 'title', 'Give your goal a name');
        break;
    }
  })
  .transform((g) => {
    // Keep only the fields this type uses, so stale values never linger.
    const uses = {
      target: ['solves', 'time', 'streak', 'daily'].includes(g.type),
      puzzleId: g.type === 'solves' || g.type === 'time',
      stat: g.type === 'time',
      algorithmSet: g.type === 'algorithms',
    };
    const clean = {
      type: g.type,
      notes: g.notes,
      target: uses.target ? (g.target ?? null) : null,
      puzzleId: uses.puzzleId ? (g.puzzleId ?? null) : null,
      stat: uses.stat ? (g.stat ?? null) : null,
      algorithmSet: uses.algorithmSet ? (g.algorithmSet ?? null) : null,
    };
    const title =
      g.title ??
      defaultGoalTitle({
        ...clean,
        puzzleName: clean.puzzleId ? PUZZLES[clean.puzzleId].shortName : null,
      });
    return { ...clean, title };
  });

export type GoalInput = z.input<typeof goalInputSchema>;

const live = isNull(goals.deletedAt);

/** Open goals first (oldest first), then completed ones (most recent first). */
export function listGoals(db: AppDatabase): Goal[] {
  const rows = db.select().from(goals).where(live).all();
  const open = rows.filter((g) => g.completedAt === null).sort((a, b) => a.createdAt - b.createdAt);
  const done = rows
    .filter((g) => g.completedAt !== null)
    .sort((a, b) => b.completedAt! - a.completedAt!);
  return [...open, ...done].map(({ deletedAt: _deleted, ...g }) => g);
}

export function getGoal(db: AppDatabase, id: string): Goal | null {
  const row = db
    .select()
    .from(goals)
    .where(and(eq(goals.id, id), live))
    .get();
  if (!row) return null;
  const { deletedAt: _deleted, ...goal } = row;
  return goal;
}

export function createGoal(db: AppDatabase, input: GoalInput, now = Date.now()): Goal {
  const values = goalInputSchema.parse(input);
  const id = newId();
  db.insert(goals)
    .values({ id, ...values, createdAt: now, updatedAt: now })
    .run();
  return getGoal(db, id)!;
}

/** Changing what a goal measures reopens it; its progress is computed again. */
export function updateGoal(db: AppDatabase, id: string, input: GoalInput, now = Date.now()): void {
  const values = goalInputSchema.parse(input);
  const current = getGoal(db, id);
  const sameMeasure =
    current &&
    current.type === values.type &&
    current.target === values.target &&
    current.puzzleId === values.puzzleId &&
    current.stat === values.stat &&
    current.algorithmSet === values.algorithmSet;
  db.update(goals)
    .set({ ...values, completedAt: sameMeasure ? current.completedAt : null, updatedAt: now })
    .where(eq(goals.id, id))
    .run();
}

/** Marks a goal done (at a time) or open again (null). */
export function setGoalCompleted(db: AppDatabase, id: string, at: number | null, now = Date.now()) {
  db.update(goals).set({ completedAt: at, updatedAt: now }).where(eq(goals.id, id)).run();
}

export function deleteGoal(db: AppDatabase, id: string, now = Date.now()): void {
  db.update(goals).set({ deletedAt: now, updatedAt: now }).where(eq(goals.id, id)).run();
}

export function restoreGoal(db: AppDatabase, id: string, now = Date.now()): void {
  db.update(goals).set({ deletedAt: null, updatedAt: now }).where(eq(goals.id, id)).run();
}
