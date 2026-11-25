import { F2L_CASES, F2L_GROUPS } from './f2l';
import { OLL_CASES, OLL_GROUPS } from './oll';
import { PLL_CASES, PLL_GROUPS } from './pll';
import type { AlgorithmCase, AlgorithmSet, AlgorithmSetId } from './types';

export * from './types';

export const ALGORITHM_SETS: Record<AlgorithmSetId, AlgorithmSet> = {
  f2l: {
    id: 'f2l',
    name: 'F2L',
    fullName: 'First two layers',
    description: 'Pair a corner with its edge and insert them together, one slot at a time.',
    groups: F2L_GROUPS,
    cases: F2L_CASES,
  },
  oll: {
    id: 'oll',
    name: 'OLL',
    fullName: 'Orientation of the last layer',
    description: 'Make the whole top face yellow in one algorithm.',
    groups: OLL_GROUPS,
    cases: OLL_CASES,
  },
  pll: {
    id: 'pll',
    name: 'PLL',
    fullName: 'Permutation of the last layer',
    description: 'Move the last-layer pieces into place to finish the solve.',
    groups: PLL_GROUPS,
    cases: PLL_CASES,
  },
};

export const ALGORITHM_SET_ORDER: AlgorithmSetId[] = ['f2l', 'oll', 'pll'];

export const ALL_CASES: AlgorithmCase[] = ALGORITHM_SET_ORDER.flatMap((id) => [
  ...ALGORITHM_SETS[id].cases,
]);

const byId = new Map(ALL_CASES.map((c) => [c.id, c]));
export function getCase(id: string): AlgorithmCase | undefined {
  return byId.get(id);
}
