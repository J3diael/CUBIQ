import { topOrientation } from '@/lib/cube/analysis';
import {
  applyAlgorithm,
  caseFromAlgorithm,
  faceStickers,
  isSolved,
  piecesSolved,
  solvedCube,
  stickerAt,
  type CubeState,
} from '@/lib/cube/cube';
import { isoDiagram, type CubeDiagramSpec } from '@/lib/cube/diagram';
import { parseAlgorithm, type Face } from '@/lib/cube/notation';
import { ALGORITHM_SETS } from '@/content/algorithms';

import { ALL_LESSONS, BEGINNER_COURSE, getLesson, nextLesson, NOTATION_GUIDE } from '..';

const solved = () => solvedCube();
const S = (alg: string, from: CubeState = solved()) => applyAlgorithm(from, alg);
const AUFS = ['', 'U', 'U2', "U'"];
const SIDES = ['F', 'R', 'B', 'L'] as const;

function diagramSpecs(): CubeDiagramSpec[] {
  return ALL_LESSONS.flatMap((l) => [
    ...l.steps.flatMap((s) => s.blocks.flatMap((b) => (b.type === 'diagram' ? [b.diagram] : []))),
    ...l.practice.flatMap((q) => (q.diagram ? [q.diagram] : [])),
  ]);
}

describe('lesson content', () => {
  it('has unique ids, steps and well-formed practice questions', () => {
    const ids = ALL_LESSONS.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(BEGINNER_COURSE.lessons).toHaveLength(11);
    for (const l of ALL_LESSONS) {
      expect(l.steps.length).toBeGreaterThan(0);
      expect(l.practice.length).toBeGreaterThan(0);
      for (const q of l.practice) {
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
        expect(new Set(q.options).size).toBe(q.options.length);
      }
    }
    expect(getLesson('beginner.cross')?.title).toBe('Step 2: The white cross');
    expect(nextLesson('beginner.cross')?.id).toBe('beginner.corners');
    expect(nextLesson('beginner.last-edges')).toBeUndefined();
  });

  it('uses valid notation in every algorithm and diagram', () => {
    for (const l of ALL_LESSONS) {
      for (const b of l.steps.flatMap((s) => s.blocks)) {
        if (b.type === 'algorithm') expect(() => parseAlgorithm(b.moves)).not.toThrow();
      }
    }
    for (const d of diagramSpecs()) {
      if (d.setup) expect(() => parseAlgorithm(d.setup!)).not.toThrow();
      if (d.solvedBy) expect(() => caseFromAlgorithm(d.solvedBy!)).not.toThrow();
    }
  });

  it('teaches algorithms that are also in the PLL set where they overlap', () => {
    const pllAlgs = ALGORITHM_SETS.pll.cases.flatMap((c) => c.algorithms);
    expect(pllAlgs).toContain("R U' R U R U R U' R' U' R2");
  });
});

describe('diagram captions match the pictures', () => {
  it('daisy: four white petals around the yellow centre', () => {
    const d = isoDiagram(S('F2 R2 B2 L2'), 'cross');
    expect(d.U).toEqual(
      ['D', 'D', 'D', 'D', 'U', 'D', 'D', 'D', 'D'].map((c, i) =>
        [0, 2, 6, 8].includes(i) ? null : c,
      ),
    );
  });

  it('cross: after F2 the green petal is on top above the green centre', () => {
    const st = S('F2');
    expect(stickerAt(st, [0, 1, 1], [0, 1, 0]).color).toBe('D');
    expect(stickerAt(st, [0, 1, 1], [0, 0, 1]).color).toBe('F');
  });

  it('white corners: the corner is above its spot at the front right', () => {
    const st = S("R U R' U'");
    const corner = st.find((s) => s.home.join() === '1,-1,1')!;
    expect(corner.pos).toEqual([1, 1, 1]);
    expect(piecesSolved(st, (h) => h[1] === -1 && !(h[0] === 1 && h[2] === 1))).toBe(true);
  });

  it('middle edges: front colour matches the front, top colour the side', () => {
    const right = caseFromAlgorithm("U R U' R' U' F' U F");
    expect(stickerAt(right, [0, 1, 1], [0, 0, 1]).color).toBe('F');
    expect(stickerAt(right, [0, 1, 1], [0, 1, 0]).color).toBe('R');
    const left = caseFromAlgorithm("U' L' U L U F U' F'");
    expect(stickerAt(left, [0, 1, 1], [0, 0, 1]).color).toBe('F');
    expect(stickerAt(left, [0, 1, 1], [0, 1, 0]).color).toBe('L');
  });

  it('yellow cross: dot, L at the back left and a left-right line', () => {
    expect(orientedEdges(caseFromAlgorithm("F R U R' U' F' U2 F U R U' R' F'"))).toBe('');
    expect(orientedEdges(caseFromAlgorithm("F U R U' R' F'"))).toBe('BL');
    expect(orientedEdges(caseFromAlgorithm("F R U R' U' F'"))).toBe('LR');
  });

  it('yellow face: one yellow corner, at the front left', () => {
    const st = caseFromAlgorithm("R U R' U R U2 R'");
    const top = faceStickers(st, 'U').map((s) => s.color === 'U');
    expect([0, 2, 6, 8].filter((i) => top[i])).toEqual([6]);
  });

  it('yellow corners: headlights at the back', () => {
    const st = caseFromAlgorithm("R' F R' B2 R F' R' B2 R2");
    expect(headlightSides(st)).toEqual(['B']);
  });

  it('last edges: the back is finished', () => {
    const st = caseFromAlgorithm("R U' R U R U R U' R' U' R2");
    expect(finishedSides(st)).toEqual(['B']);
  });
});

/** Which top edges show yellow on top: B (back), L, R, F. */
function orientedEdges(st: CubeState): string {
  const top = faceStickers(st, 'U');
  return [
    [1, 'B'],
    [3, 'L'],
    [5, 'R'],
    [7, 'F'],
  ]
    .filter(([i]) => top[i as number]!.color === 'U')
    .map(([, f]) => f)
    .sort()
    .join('');
}

const topRow = (st: CubeState, f: Face) => faceStickers(st, f).slice(0, 3);
const headlightSides = (st: CubeState) =>
  SIDES.filter((f) => {
    const [a, , c] = topRow(st, f);
    return a!.color === c!.color;
  });
const finishedSides = (st: CubeState) =>
  SIDES.filter((f) => topRow(st, f).every((s) => s.color === topRow(st, f)[0]!.color));

/**
 * Simulations: follow each lesson's instructions on the cube model, from every
 * relevant starting position, and check they really solve that step.
 */
describe('the taught method works', () => {
  const crossSolved = (st: CubeState) =>
    piecesSolved(st, (h) => h[1] === -1 && h.filter((c) => c !== 0).length === 2);
  const firstLayerSolved = (st: CubeState) => piecesSolved(st, (h) => h[1] === -1);
  const f2lSolved = (st: CubeState) => piecesSolved(st, (h) => h[1] !== 1);

  it('daisy to cross: match each petal to its centre, then turn that side twice', () => {
    for (const start of AUFS) {
      let st = S(`F2 R2 B2 L2 ${start}`);
      const above: Record<(typeof SIDES)[number], [number, number, number]> = {
        F: [0, 1, 1],
        R: [1, 1, 0],
        B: [0, 1, -1],
        L: [-1, 1, 0],
      };
      const outward = { F: [0, 0, 1], R: [1, 0, 0], B: [0, 0, -1], L: [-1, 0, 0] } as const;
      for (const side of SIDES) {
        let turns = 0;
        while (stickerAt(st, above[side], outward[side]).color !== side) {
          st = S('U', st);
          if (++turns > 4) throw new Error(`no petal for ${side}`);
        }
        expect(stickerAt(st, above[side], [0, 1, 0]).color).toBe('D');
        st = S(`${side}2`, st);
      }
      expect(crossSolved(st)).toBe(true);
    }
  });

  it("white corners: R U R' U' at most five times puts the corner in", () => {
    // The corner above its spot in each of its three twists, and from the bottom.
    for (let reps = 1; reps <= 5; reps++) {
      let st = S(Array(reps).fill("R U R' U'").join(' '));
      let count = 0;
      while (!firstLayerSolved(st)) {
        st = S("R U R' U'", st);
        count++;
      }
      expect(count).toBeLessThanOrEqual(5);
    }
  });

  it('middle edges: each sequence inserts the edge without breaking the white layer', () => {
    for (const alg of ["U R U' R' U' F' U F", "U' L' U L U F U' F'"]) {
      const st = caseFromAlgorithm(alg);
      expect(firstLayerSolved(st)).toBe(true);
      expect(f2lSolved(S(alg, st))).toBe(true);
    }
  });

  // Every last-layer orientation: the 57 OLL cases.
  const ollStarts = ALGORITHM_SETS.oll.cases.map((c) => caseFromAlgorithm(c.algorithms[0]));

  function yellowCross(start: CubeState): CubeState {
    let st = start;
    for (let i = 0; i < 4; i++) {
      const e = orientedEdges(st);
      if (e.length === 4) return st;
      if (e.length === 2) {
        // Turn the top until the L is at the back left or the line runs left to right.
        let turns = 0;
        while (!['BL', 'LR'].includes(orientedEdges(st))) {
          st = S('U', st);
          if (++turns > 4) throw new Error('could not place L or line');
        }
      }
      st = S("F R U R' U' F'", st);
    }
    throw new Error('yellow cross did not finish in 3 sequences');
  }

  function yellowFace(start: CubeState): CubeState {
    let st = start;
    for (let i = 0; i < 8; i++) {
      const top = faceStickers(st, 'U').map((s) => s.color === 'U');
      const corners = [0, 2, 6, 8].filter((c) => top[c]).length;
      if (corners === 4) return st;
      const ready = (s: CubeState) => {
        const t = faceStickers(s, 'U');
        if (corners === 1) return t[6]!.color === 'U';
        // Front-left corner: yellow facing left (none on top) or facing you (two on top).
        if (corners === 0) return faceStickers(s, 'L')[2]!.color === 'U';
        return faceStickers(s, 'F')[0]!.color === 'U';
      };
      let turns = 0;
      while (!ready(st)) {
        st = S('U', st);
        if (++turns > 4) throw new Error(`no way to hold ${corners} corners`);
      }
      st = S("R U R' U R U2 R'", st);
    }
    throw new Error('yellow face did not finish');
  }

  it('yellow cross from every orientation, in at most three sequences', () => {
    for (const start of ollStarts) {
      const st = yellowCross(start);
      expect(topOrientation(st).edges).toBe(4);
      expect(f2lSolved(st)).toBe(true);
    }
  });

  it('yellow face from every orientation once the cross is made', () => {
    for (const start of ollStarts) {
      const st = yellowFace(yellowCross(start));
      expect(topOrientation(st)).toEqual({ edges: 4, corners: 4 });
      expect(f2lSolved(st)).toBe(true);
    }
  });

  // Every last-layer permutation: the 21 PLL cases, each with every pre-turn of the top.
  const pllStarts = ALGORITHM_SETS.pll.cases.flatMap((c) =>
    AUFS.map((auf) => S(auf, caseFromAlgorithm(c.algorithms[0]))),
  );

  const cornersPlaced = (st: CubeState) =>
    AUFS.some((auf) =>
      piecesSolved(S(auf, st), (h) => h[1] !== 1 || h.filter((c) => c !== 0).length === 3),
    );

  it('yellow corners then last edges solve every last-layer permutation', () => {
    for (const start of pllStarts) {
      let st = start;
      // Step 7: headlights to the back, sequence, repeat.
      for (let i = 0; i < 3 && !cornersPlaced(st); i++) {
        if (headlightSides(st).length > 0) {
          let turns = 0;
          while (!headlightSides(st).includes('B')) {
            st = S('U', st);
            if (++turns > 4) throw new Error('no headlights at the back');
          }
        }
        st = S("R' F R' B2 R F' R' B2 R2", st);
      }
      expect(cornersPlaced(st)).toBe(true);
      // Line the corners up with their sides.
      st = S(
        AUFS.find((auf) =>
          piecesSolved(S(auf, st), (h) => h[1] !== 1 || h.filter((c) => c !== 0).length === 3),
        )!,
        st,
      );

      // Step 8: finished side to the back, sequence, repeat.
      for (let i = 0; i < 3 && !isSolved(st); i++) {
        const finished = finishedSides(st);
        if (finished.length > 0 && !finished.includes('B')) {
          // Turn the whole cube so the finished side is at the back.
          const rotation = { F: 'y2', R: "y'", L: 'y' }[finished[0] as 'F' | 'R' | 'L'];
          st = S(rotation, st);
        }
        st = S("R U' R U R U R U' R' U' R2", st);
      }
      // Solved, with yellow still on top (the cube may be turned around y).
      expect(isSolved(st)).toBe(true);
      expect(faceStickers(st, 'U').every((s) => s.color === 'U')).toBe(true);
    }
  });
});

describe('notation guide', () => {
  const entries = NOTATION_GUIDE.flatMap((g) => g.entries);

  it('parses every move and highlights the layer it turns', () => {
    for (const e of entries) {
      const [move] = parseAlgorithm(e.move);
      expect(move?.family).toBe(e.layer);
    }
  });

  /** Where the sticker at `pos` facing `normal` ends up facing after the move. */
  const facingAfter = (
    move: string,
    pos: [number, number, number],
    normal: [number, number, number],
  ) => {
    const before = stickerAt(solved(), pos, normal);
    const after = S(move).find(
      (s) => s.home.join() === before.home.join() && s.color === before.color,
    )!;
    return after.normal.join();
  };
  const UP = '0,1,0';
  const DOWN = '0,-1,0';
  const LEFT = '-1,0,0';
  const RIGHT = '1,0,0';

  it('describes each direction correctly', () => {
    // "Its front edge moves up / down / left / right": follow the front sticker of that layer.
    expect(facingAfter('R', [1, 0, 1], [0, 0, 1])).toBe(UP);
    expect(facingAfter('L', [-1, 0, 1], [0, 0, 1])).toBe(DOWN);
    expect(facingAfter('U', [0, 1, 1], [0, 0, 1])).toBe(LEFT);
    expect(facingAfter('D', [0, -1, 1], [0, 0, 1])).toBe(RIGHT);
    expect(facingAfter('F', [0, 1, 1], [0, 1, 0])).toBe(RIGHT);
    expect(facingAfter('B', [0, 1, -1], [0, 1, 0])).toBe(LEFT);
    expect(facingAfter("R'", [1, 0, 1], [0, 0, 1])).toBe(DOWN);
    expect(facingAfter("U'", [0, 1, 1], [0, 0, 1])).toBe(RIGHT);
    expect(facingAfter('M', [0, 0, 1], [0, 0, 1])).toBe(DOWN);
    expect(facingAfter('E', [0, 0, 1], [0, 0, 1])).toBe(RIGHT);
    expect(facingAfter('S', [0, 1, 0], [0, 1, 0])).toBe(RIGHT);
    expect(facingAfter('x', [0, 0, 1], [0, 0, 1])).toBe(UP);
    expect(facingAfter('y', [0, 0, 1], [0, 0, 1])).toBe(LEFT);
    expect(facingAfter('z', [0, 1, 0], [0, 1, 0])).toBe(RIGHT);
  });
});
