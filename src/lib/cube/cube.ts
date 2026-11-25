import { invertMoves, parseAlgorithm, type Face, type Move, type MoveFamily } from './notation';

/**
 * A 3x3 cube as 54 stickers in 3D. Coordinates: x right, y up, z towards the viewer
 * (front). Each sticker remembers its colour (its home face) and its piece's home
 * position, so we can tell which pieces moved. Moves are rotations of the stickers
 * in a layer, which keeps the model short and easy to trust.
 */
type Vec = readonly [number, number, number];

export interface Sticker {
  pos: Vec;
  normal: Vec;
  /** Face the sticker belongs to on a solved cube, i.e. its colour. */
  color: Face;
  /** Home position of the piece this sticker is part of. */
  home: Vec;
}

export type CubeState = readonly Sticker[];

const FACE_NORMALS: Record<Face, Vec> = {
  U: [0, 1, 0],
  D: [0, -1, 0],
  R: [1, 0, 0],
  L: [-1, 0, 0],
  F: [0, 0, 1],
  B: [0, 0, -1],
};
export const FACES: Face[] = ['U', 'D', 'R', 'L', 'F', 'B'];

export function solvedCube(): CubeState {
  const stickers: Sticker[] = [];
  for (const face of FACES) {
    const n = FACE_NORMALS[face];
    for (let a = -1; a <= 1; a++) {
      for (let b = -1; b <= 1; b++) {
        const pos: Vec = n[0] !== 0 ? [n[0], a, b] : n[1] !== 0 ? [a, n[1], b] : [a, b, n[2]];
        stickers.push({ pos, normal: n, color: face, home: pos });
      }
    }
  }
  return stickers;
}

type Axis = 0 | 1 | 2;
/** Which layers a move turns, around which axis, and its clockwise direction. */
const MOVE_DEFS: Record<MoveFamily, { axis: Axis; layers: number[]; sign: 1 | -1 }> = {
  // Clockwise when looking at the face = negative rotation about its outward axis.
  R: { axis: 0, layers: [1], sign: -1 },
  L: { axis: 0, layers: [-1], sign: 1 },
  U: { axis: 1, layers: [1], sign: -1 },
  D: { axis: 1, layers: [-1], sign: 1 },
  F: { axis: 2, layers: [1], sign: -1 },
  B: { axis: 2, layers: [-1], sign: 1 },
  Rw: { axis: 0, layers: [1, 0], sign: -1 },
  Lw: { axis: 0, layers: [-1, 0], sign: 1 },
  Uw: { axis: 1, layers: [1, 0], sign: -1 },
  Dw: { axis: 1, layers: [-1, 0], sign: 1 },
  Fw: { axis: 2, layers: [1, 0], sign: -1 },
  Bw: { axis: 2, layers: [-1, 0], sign: 1 },
  // Slices follow L, D and F.
  M: { axis: 0, layers: [0], sign: 1 },
  E: { axis: 1, layers: [0], sign: 1 },
  S: { axis: 2, layers: [0], sign: -1 },
  // Rotations follow R, U and F.
  x: { axis: 0, layers: [-1, 0, 1], sign: -1 },
  y: { axis: 1, layers: [-1, 0, 1], sign: -1 },
  z: { axis: 2, layers: [-1, 0, 1], sign: -1 },
};

/** Rotates a vector by sign × 90° about an axis (right-handed). */
function rotate(v: Vec, axis: Axis, sign: 1 | -1): Vec {
  const [x, y, z] = v;
  if (axis === 0) return sign === 1 ? [x, -z, y] : [x, z, -y];
  if (axis === 1) return sign === 1 ? [z, y, -x] : [-z, y, x];
  return sign === 1 ? [-y, x, z] : [y, -x, z];
}

function applyMove(state: CubeState, move: Move): CubeState {
  const def = MOVE_DEFS[move.family];
  return state.map((s) => {
    if (!def.layers.includes(s.pos[def.axis])) return s;
    let pos = s.pos;
    let normal = s.normal;
    for (let i = 0; i < move.amount; i++) {
      pos = rotate(pos, def.axis, def.sign);
      normal = rotate(normal, def.axis, def.sign);
    }
    return { ...s, pos, normal };
  });
}

export function applyMoves(state: CubeState, moves: readonly Move[]): CubeState {
  return moves.reduce(applyMove, state);
}

export function applyAlgorithm(state: CubeState, algorithm: string): CubeState {
  return applyMoves(state, parseAlgorithm(algorithm));
}

/** Rotates the whole cube so that each centre is back on its home face. */
export function normalizeOrientation(state: CubeState): CubeState {
  let current = state;
  const rotations: Move[][] = [];
  for (const first of ['', 'x', 'x2', "x'", 'z', "z'"]) {
    for (const second of ['', 'y', 'y2', "y'"]) {
      rotations.push(parseAlgorithm(`${first} ${second}`));
    }
  }
  for (const rotation of rotations) {
    current = applyMoves(state, rotation);
    if (centersHome(current)) return current;
  }
  throw new Error('Could not normalise cube orientation');
}

function centersHome(state: CubeState): boolean {
  return state.every((s) => {
    const isCenter = s.pos.filter((c) => c === 0).length === 2;
    return !isCenter || sameVec(s.normal, FACE_NORMALS[s.color]);
  });
}

const sameVec = (a: Vec, b: Vec) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

/**
 * The case an algorithm solves: the inverse algorithm applied to a solved cube,
 * with the cube turned back to the standard orientation.
 */
export function caseFromAlgorithm(algorithm: string): CubeState {
  return normalizeOrientation(applyMoves(solvedCube(), invertMoves(parseAlgorithm(algorithm))));
}

/** The colour of the sticker at a position, facing a direction. */
export function stickerAt(state: CubeState, pos: Vec, normal: Vec): Sticker {
  const found = state.find((s) => sameVec(s.pos, pos) && sameVec(s.normal, normal));
  if (!found) throw new Error(`No sticker at ${pos.join(',')} facing ${normal.join(',')}`);
  return found;
}

/**
 * A face as 9 stickers in reading order, as you'd see it looking straight at it with U
 * on top (for U: B at the top; for D: F at the top).
 */
export function faceStickers(state: CubeState, face: Face): Sticker[] {
  const n = FACE_NORMALS[face];
  const result: Sticker[] = [];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const r = 1 - row; // top row first
      const c = col - 1; // left column first
      let pos: Vec;
      switch (face) {
        case 'U':
          pos = [c, 1, -r];
          break;
        case 'D':
          pos = [c, -1, r];
          break;
        case 'F':
          pos = [c, r, 1];
          break;
        case 'B':
          pos = [-c, r, -1];
          break;
        case 'R':
          pos = [1, r, -c];
          break;
        case 'L':
          pos = [-1, r, c];
          break;
      }
      result.push(stickerAt(state, pos, n));
    }
  }
  return result;
}

/** Compact text form of the colours, face by face (U R F D L B), for comparing states. */
export function stateKey(state: CubeState): string {
  return (['U', 'R', 'F', 'D', 'L', 'B'] as Face[])
    .map((f) =>
      faceStickers(state, f)
        .map((s) => s.color)
        .join(''),
    )
    .join('');
}

/** Every face is one colour (in any orientation of the whole cube). */
export function isSolved(state: CubeState): boolean {
  return FACES.every((f) => {
    const stickers = faceStickers(state, f);
    return stickers.every((s) => s.color === stickers[0]!.color);
  });
}

/** True when every sticker of the pieces matching `belongs` is at home. */
export function piecesSolved(state: CubeState, belongs: (home: Vec) => boolean): boolean {
  return state.every(
    (s) => !belongs(s.home) || (sameVec(s.pos, s.home) && sameVec(s.normal, FACE_NORMALS[s.color])),
  );
}

export type { Vec };
