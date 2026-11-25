import {
  applyAlgorithm,
  caseFromAlgorithm,
  isSolved,
  piecesSolved,
  type CubeState,
} from '@/lib/cube/cube';
import {
  f2lCaseKey,
  isF2LSolved,
  lastLayerCaseKey,
  ollCaseKey,
  onlyFrontRightPairAndTopMoved,
  topOrientation,
} from '@/lib/cube/analysis';
import { parseAlgorithm } from '@/lib/cube/notation';

import { ALGORITHM_SETS, ALL_CASES } from '..';

const PLL = ALGORITHM_SETS.pll.cases;
const OLL = ALGORITHM_SETS.oll.cases;
const F2L = ALGORITHM_SETS.f2l.cases;

describe('algorithm content', () => {
  it('has the full CFOP sets with unique ids', () => {
    expect(PLL).toHaveLength(21);
    expect(OLL).toHaveLength(57);
    expect(F2L).toHaveLength(41);
    expect(new Set(ALL_CASES.map((c) => c.id)).size).toBe(ALL_CASES.length);
  });

  it('uses valid notation and known groups everywhere', () => {
    for (const set of Object.values(ALGORITHM_SETS)) {
      const groups = new Set(set.groups.map((g) => g.name));
      for (const c of set.cases) {
        expect(groups.has(c.group)).toBe(true);
        for (const alg of c.algorithms) expect(() => parseAlgorithm(alg)).not.toThrow();
      }
    }
  });
});

describe('PLL', () => {
  it.each(PLL.flatMap((c) => c.algorithms.map((alg) => [c.name, alg])))(
    '%s (%s) only permutes the last layer',
    (_name, alg) => {
      const state = caseFromAlgorithm(alg);
      expect(isF2LSolved(state)).toBe(true);
      expect(topOrientation(state)).toEqual({ edges: 4, corners: 4 });
      expect(isSolved(state)).toBe(false);
    },
  );

  it('has 21 different cases, and alternatives solve the same case', () => {
    const keys = PLL.map((c) => lastLayerCaseKey(c.algorithms[0]));
    expect(new Set(keys).size).toBe(21);
    for (const c of PLL) {
      for (const alg of c.algorithms)
        expect(lastLayerCaseKey(alg)).toBe(lastLayerCaseKey(c.algorithms[0]));
    }
  });
});

/** True if, after some turn of the U layer, the matching U-layer pieces are all solved. */
function solvedAfterSomeAuf(state: CubeState, kind: 'corners' | 'edges'): boolean {
  return ['', 'U', 'U2', "U'"].some((auf) =>
    piecesSolved(applyAlgorithm(state, auf), (home) => {
      const isCorner = home.every((c) => c !== 0);
      return home[1] === 1 && (kind === 'corners' ? isCorner : !isCorner);
    }),
  );
}

describe('PLL groups', () => {
  it.each(PLL.map((c) => [c.name, c.group, c.algorithms[0]]))(
    '%s is in the right group (%s)',
    (_name, group, alg) => {
      const state = caseFromAlgorithm(alg);
      const corners = solvedAfterSomeAuf(state, 'corners');
      const edges = solvedAfterSomeAuf(state, 'edges');
      if (group === 'Edges only') expect(corners).toBe(true);
      else if (group === 'Corners only') expect(edges).toBe(true);
      else expect([corners, edges]).toEqual([false, false]);
    },
  );
});

describe('OLL', () => {
  it.each(OLL.flatMap((c) => c.algorithms.map((alg) => [c.name, alg])))(
    '%s (%s) keeps the first two layers solved',
    (_name, alg) => {
      const state = caseFromAlgorithm(alg);
      expect(isF2LSolved(state)).toBe(true);
      expect(topOrientation(state)).not.toEqual({ edges: 4, corners: 4 });
    },
  );

  it('has 57 different orientation cases', () => {
    const keys = OLL.map((c) => ollCaseKey(c.algorithms[0]));
    expect(new Set(keys).size).toBe(57);
  });

  it('puts each case in a group that matches its edges', () => {
    for (const c of OLL) {
      const { edges, corners } = topOrientation(caseFromAlgorithm(c.algorithms[0]));
      if (c.group === 'Cross') expect(edges).toBe(4);
      else if (c.group === 'Dot') expect(edges).toBe(0);
      else expect(edges).toBe(2);
      if (c.group === 'Corners oriented') expect(corners).toBe(4);
    }
  });
});

describe('F2L', () => {
  it.each(F2L.flatMap((c) => c.algorithms.map((alg) => [c.name, alg])))(
    '%s (%s) only involves the front-right pair and the top layer',
    (_name, alg) => {
      const state = caseFromAlgorithm(alg);
      expect(onlyFrontRightPairAndTopMoved(state)).toBe(true);
      expect(isF2LSolved(state)).toBe(false);
    },
  );

  it('has 41 different cases', () => {
    const keys = F2L.map((c) => f2lCaseKey(c.algorithms[0]));
    const dupes = F2L.filter((c, i) => keys.indexOf(keys[i]!) !== i).map((c) => c.name);
    expect(dupes).toEqual([]);
  });
});
