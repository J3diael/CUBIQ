import {
  applyAlgorithm,
  caseFromAlgorithm,
  faceStickers,
  isSolved,
  solvedCube,
  stateKey,
} from '../cube';
import { invertAlgorithm, moveCount, NotationError, parseAlgorithm } from '../notation';

const face = (alg: string, f: Parameters<typeof faceStickers>[1]) =>
  faceStickers(applyAlgorithm(solvedCube(), alg), f)
    .map((s) => s.color)
    .join('');

const repeat = (alg: string, n: number) => Array.from({ length: n }, () => alg).join(' ');

describe('notation', () => {
  it('parses turns, wide moves, slices and rotations', () => {
    expect(parseAlgorithm("(R U2 R') r Rw' M2 x y' z2'")).toEqual([
      { family: 'R', amount: 1 },
      { family: 'U', amount: 2 },
      { family: 'R', amount: 3 },
      { family: 'Rw', amount: 1 },
      { family: 'Rw', amount: 3 },
      { family: 'M', amount: 2 },
      { family: 'x', amount: 1 },
      { family: 'y', amount: 3 },
      { family: 'z', amount: 2 },
    ]);
  });

  it('rejects unknown moves', () => {
    expect(() => parseAlgorithm('R Q')).toThrow(NotationError);
  });

  it('inverts and counts moves', () => {
    expect(invertAlgorithm("R U R' U'")).toBe("U R U' R'");
    expect(invertAlgorithm('R2 y')).toBe("y' R2");
    expect(moveCount("y R U R' x")).toBe(3);
  });
});

describe('moves', () => {
  it('turns the right layer: U gets the front colour on its right column', () => {
    expect(face('R', 'U')).toBe('UUFUUFUUF');
    expect(face('R', 'F')).toBe('FFDFFDFFD');
  });

  it('turns U clockwise seen from above: F gets the R colour on top', () => {
    expect(face('U', 'F')).toBe('RRRFFFFFF');
    expect(face('U', 'L')).toBe('FFFLLLLLL');
  });

  it('turns F clockwise: U gets the L colour on its bottom row', () => {
    expect(face('F', 'U')).toBe('UUUUUULLL');
  });

  it('turns slices like L, D and F', () => {
    expect(face('M', 'F')).toBe('FUFFUFFUF');
    expect(face('E', 'F')).toBe('FFFLLLFFF');
    expect(face('S', 'U')).toBe('UUULLLUUU');
  });

  it('wide moves equal an outer turn plus the slice', () => {
    expect(stateKey(applyAlgorithm(solvedCube(), 'r'))).toBe(
      stateKey(applyAlgorithm(solvedCube(), "R M'")),
    );
  });

  it('returns to solved after known move orders', () => {
    const solvedAfter = (alg: string) => isSolved(applyAlgorithm(solvedCube(), alg));
    expect(solvedAfter('R R R R')).toBe(true);
    expect(solvedAfter(repeat("R U R' U'", 6))).toBe(true);
    expect(solvedAfter(repeat('R U', 105))).toBe(true);
    expect(solvedAfter(repeat("R U R' U'", 5))).toBe(false);
    expect(solvedAfter(repeat("R U R' U R U2 R'", 6))).toBe(true); // Sune has order 6
    expect(solvedAfter(repeat("R U R' U' R' F R2 U' R' U' R U R' F'", 2))).toBe(true); // T-perm
  });

  it('rotations do not change the case', () => {
    expect(isSolved(caseFromAlgorithm('x y z'))).toBe(true);
  });
});
