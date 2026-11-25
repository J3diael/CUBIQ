import { ALGORITHM_SETS, type AlgorithmCase, type AlgorithmSetId } from '@/content/algorithms';
import { emptyProgress, type AlgorithmProgress } from '@/database/repositories/training-repository';

export type ProgressMap = Map<string, AlgorithmProgress>;

export const progressFor = (map: ProgressMap, key: string) => map.get(key) ?? emptyProgress(key);

export interface SetSummary {
  total: number;
  learned: number;
  learning: number;
  due: number;
}

export function summarizeCases(
  cases: readonly AlgorithmCase[],
  map: ProgressMap,
  now: number,
): SetSummary {
  let learned = 0;
  let learning = 0;
  let due = 0;
  for (const c of cases) {
    const p = progressFor(map, c.id);
    if (p.status === 'learned') learned++;
    else if (p.status === 'learning') learning++;
    if (p.reviews > 0 && p.dueAt !== null && p.dueAt <= now) due++;
  }
  return { total: cases.length, learned, learning, due };
}

export const summarizeSet = (set: AlgorithmSetId, map: ProgressMap, now: number) =>
  summarizeCases(ALGORITHM_SETS[set].cases, map, now);

/** The algorithm a case is learned with: the user's choice if still available, else the first. */
export function chosenAlgorithm(
  c: AlgorithmCase,
  progress: AlgorithmProgress,
  custom: string[],
): string {
  const options = [...c.algorithms, ...custom];
  return progress.preferredAlgorithm && options.includes(progress.preferredAlgorithm)
    ? progress.preferredAlgorithm
    : c.algorithms[0];
}

export const STATUS_LABELS = {
  new: 'Not started',
  learning: 'Learning',
  learned: 'Learned',
} as const;
