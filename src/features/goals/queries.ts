import { ALGORITHM_SETS, type AlgorithmSetId } from '@/content/algorithms';
import type { PuzzleId } from '@/constants/puzzles';
import type { AppDatabase } from '@/database/client';
import { listGoals, setGoalCompleted, type Goal } from '@/database/repositories/goals-repository';
import { countSolves, solveTimesSince } from '@/database/repositories/solves-repository';
import { listProgress } from '@/database/repositories/training-repository';
import { getPersonalRecords } from '@/features/stats/queries';
import { countProgress, practiceStreak, timeProgress, type GoalProgress } from '@/lib/goals/goals';
import { startOfLocalDay } from '@/lib/time/date';

const DAY_MS = 24 * 60 * 60 * 1000;

/** A goal's progress, computed from solves and training data. */
export function goalProgress(
  db: AppDatabase,
  goal: Goal,
  now: number,
  decimals: 2 | 3 = 2,
): GoalProgress {
  const target = goal.target ?? 1;
  switch (goal.type) {
    case 'solves':
      return countProgress(
        countSolves(db, { since: goal.createdAt, puzzleId: goal.puzzleId }),
        target,
        'solves',
      );
    case 'daily':
      return countProgress(
        countSolves(db, { since: startOfLocalDay(now) }),
        target,
        'solves today',
      );
    case 'time': {
      const records = getPersonalRecords(db, (goal.puzzleId ?? '333') as PuzzleId);
      return timeProgress(records[goal.stat ?? 'single'], target, decimals);
    }
    case 'algorithms': {
      const set = ALGORITHM_SETS[(goal.algorithmSet ?? 'pll') as AlgorithmSetId];
      const progress = listProgress(db);
      const learned = set.cases.filter((c) => progress.get(c.id)?.status === 'learned').length;
      return countProgress(learned, set.cases.length, `${set.name} cases learned`);
    }
    case 'streak': {
      const streak = practiceStreak(solveTimesSince(db, now - (target + 2) * DAY_MS), now);
      return countProgress(streak, target, 'days in a row');
    }
    case 'custom': {
      const done = goal.completedAt !== null;
      return {
        current: done ? 1 : 0,
        target: 1,
        fraction: done ? 1 : 0,
        done,
        text: done ? 'Done' : 'Mark it done when you get there',
      };
    }
  }
}

export interface GoalWithProgress extends Goal {
  progress: GoalProgress;
}

export function listGoalsWithProgress(
  db: AppDatabase,
  now: number,
  decimals: 2 | 3 = 2,
): GoalWithProgress[] {
  return listGoals(db).map((g) => ({ ...g, progress: goalProgress(db, g, now, decimals) }));
}

/**
 * Records the moment open goals are reached. Daily goals repeat every day and
 * custom goals are completed by hand, so neither is completed here.
 * Returns the goals that were just completed.
 */
export function syncGoalCompletions(db: AppDatabase, now: number): Goal[] {
  const reached = listGoals(db).filter(
    (g) =>
      g.completedAt === null &&
      g.type !== 'daily' &&
      g.type !== 'custom' &&
      goalProgress(db, g, now).done,
  );
  for (const g of reached) setGoalCompleted(db, g.id, now, now);
  return reached;
}
