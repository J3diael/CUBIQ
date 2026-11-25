import {
  applyAlgorithm,
  faceStickers,
  normalizeOrientation,
  piecesSolved,
  solvedCube,
  stateKey,
  type CubeState,
} from './cube';
import { invertAlgorithm } from './notation';

const AUFS = ['', 'U', 'U2', "U'"];

/** The first two layers (everything except the U layer) are solved. */
export function isF2LSolved(state: CubeState): boolean {
  return piecesSolved(state, (home) => home[1] !== 1);
}

/** All pieces except the U layer and the front-right F2L pair are solved. */
export function onlyFrontRightPairAndTopMoved(state: CubeState): boolean {
  return piecesSolved(state, (home) => {
    if (home[1] === 1) return false;
    const frontRightPair = home[0] === 1 && home[2] === 1; // DFR corner and FR edge
    return !frontRightPair;
  });
}

/** Which U-layer stickers show the top colour, as 21 characters (U face then sides). */
export function topColorPattern(state: CubeState): string {
  const top = faceStickers(state, 'U')
    .map((s) => (s.color === 'U' ? 'x' : '.'))
    .join('');
  const sides = (['F', 'R', 'B', 'L'] as const)
    .map((f) =>
      faceStickers(state, f)
        .slice(0, 3)
        .map((s) => (s.color === 'U' ? 'x' : '.'))
        .join(''),
    )
    .join('');
  return top + sides;
}

/** Counts oriented edges and corners in the U layer. */
export function topOrientation(state: CubeState): { edges: number; corners: number } {
  const top = faceStickers(state, 'U').map((s) => s.color === 'U');
  const edges = [1, 3, 5, 7].filter((i) => top[i]).length;
  const corners = [0, 2, 6, 8].filter((i) => top[i]).length;
  return { edges, corners };
}

function caseState(algorithm: string, before = '', after = ''): CubeState {
  return normalizeOrientation(
    applyAlgorithm(solvedCube(), `${before} ${invertAlgorithm(algorithm)} ${after}`),
  );
}

/** A key that is the same for a case however the U layer is turned before or after. */
export function lastLayerCaseKey(algorithm: string): string {
  const keys: string[] = [];
  for (const before of AUFS)
    for (const after of AUFS) keys.push(stateKey(caseState(algorithm, before, after)));
  return keys.sort()[0]!;
}

/** Orientation-only key for OLL, the same however the U layer is turned. */
export function ollCaseKey(algorithm: string): string {
  return AUFS.map((after) => topColorPattern(caseState(algorithm, '', after))).sort()[0]!;
}

/** A key for an F2L case, the same however the U layer is turned before solving. */
export function f2lCaseKey(algorithm: string): string {
  return AUFS.map((after) => stateKey(caseState(algorithm, '', after))).sort()[0]!;
}
