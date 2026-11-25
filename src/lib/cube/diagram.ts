import { isF2LSolved } from './analysis';
import { caseFromAlgorithm, faceStickers, type CubeState } from './cube';
import type { Face, MoveFamily } from './notation';

/** A sticker's colour in a diagram: a face colour, or `null` for "doesn't matter" (grey). */
export type DiagramColor = Face | null;

export interface LastLayerDiagram {
  /** The U face in reading order (back row first). */
  top: DiagramColor[];
  /** Top row of each side as seen from above, left to right when facing that side. */
  front: DiagramColor[];
  right: DiagramColor[];
  back: DiagramColor[];
  left: DiagramColor[];
}

/**
 * Last-layer view. For OLL only the top colour matters, so everything else is grey;
 * for PLL every sticker is coloured.
 */
export function lastLayerDiagram(state: CubeState, mode: 'oll' | 'pll'): LastLayerDiagram {
  const paint = (face: Face): DiagramColor => (mode === 'pll' || face === 'U' ? face : null);
  const row = (f: Face) =>
    faceStickers(state, f)
      .slice(0, 3)
      .map((s) => paint(s.color));
  return {
    top: faceStickers(state, 'U').map((s) => paint(s.color)),
    front: row('F'),
    right: row('R'),
    back: row('B'),
    left: row('L'),
  };
}

export interface F2LDiagram {
  U: DiagramColor[];
  F: DiagramColor[];
  R: DiagramColor[];
}

/**
 * Three-face view (top, front, right) for F2L. Pieces that belong in the last layer
 * are grey so the eye goes to the cross, the solved slots and the pair.
 */
export function f2lDiagram(state: CubeState): F2LDiagram {
  const paint = (face: Face) =>
    faceStickers(state, face).map((s) => (s.home[1] === 1 ? null : s.color));
  return { U: paint('U'), F: paint('F'), R: paint('R') };
}

/** Three-face view with every sticker coloured, for algorithms of unknown type. */
export function fullColorDiagram(state: CubeState): F2LDiagram {
  const paint = (face: Face) => faceStickers(state, face).map((s) => s.color);
  return { U: paint('U'), F: paint('F'), R: paint('R') };
}

/**
 * The diagram for a case. `other` (a user's own algorithm) shows the last-layer view
 * when the algorithm keeps the first two layers solved, otherwise the whole cube.
 */
export function caseDiagram(algorithm: string, set: 'f2l' | 'oll' | 'pll' | 'other') {
  const state = caseFromAlgorithm(algorithm);
  if (set === 'f2l') return { kind: 'f2l', ...f2lDiagram(state) } as const;
  if (set === 'other') {
    return isF2LSolved(state)
      ? ({ kind: 'last-layer', ...lastLayerDiagram(state, 'pll') } as const)
      : ({ kind: 'f2l', ...fullColorDiagram(state) } as const);
  }
  return { kind: 'last-layer', ...lastLayerDiagram(state, set) } as const;
}

/** Which pieces a lesson diagram colours; the rest are grey. */
export type PieceMask =
  'all' | 'centers' | 'edges' | 'corners' | 'cross' | 'first-layer' | 'f2l' | 'none';

const nonZero = (home: readonly number[]) => home.filter((c) => c !== 0).length;

/** True when the piece whose home is `home` belongs to the mask. */
export function inMask(mask: PieceMask, home: readonly number[]): boolean {
  const kind = nonZero(home); // 1 centre, 2 edge, 3 corner
  switch (mask) {
    case 'all':
      return true;
    case 'none':
      return false;
    case 'centers':
      return kind === 1;
    case 'edges':
      return kind === 2;
    case 'corners':
      return kind === 3;
    case 'cross':
      return kind === 1 || (kind === 2 && home[1] === -1);
    case 'first-layer':
      return kind === 1 || home[1] === -1;
    case 'f2l':
      return home[1] !== 1;
  }
}

export interface IsoDiagram {
  U: DiagramColor[];
  F: DiagramColor[];
  R: DiagramColor[];
  /** Stickers drawn faded, e.g. layers a move doesn't turn. Same order as the faces. */
  faded?: { U: boolean[]; F: boolean[]; R: boolean[] };
}

/**
 * Three-face view for lessons. `mask` picks which pieces keep their colour (by piece,
 * wherever it is now); `layer` fades every sticker outside one layer, to show which
 * part of the cube a move turns.
 */
export function isoDiagram(
  state: CubeState,
  mask: PieceMask = 'all',
  layer?: { axis: 0 | 1 | 2; values: number[] },
): IsoDiagram {
  const faces = ['U', 'F', 'R'] as const;
  const [U, F, R] = faces.map((face) =>
    faceStickers(state, face).map((s) => (inMask(mask, s.home) ? s.color : null)),
  ) as [DiagramColor[], DiagramColor[], DiagramColor[]];
  if (!layer) return { U, F, R };
  const [fU, fF, fR] = faces.map((face) =>
    faceStickers(state, face).map((s) => !layer.values.includes(s.pos[layer.axis])),
  ) as [boolean[], boolean[], boolean[]];
  return { U, F, R, faded: { U: fU, F: fF, R: fR } };
}

/** A lesson or notation-guide picture, described by moves so it is always correct. */
export interface CubeDiagramSpec {
  /** Moves done from solved to reach the pictured state. */
  setup?: string;
  /** Or: the state this algorithm solves. */
  solvedBy?: string;
  /** Which pieces keep their colours (default all). */
  show?: PieceMask;
  /** 3D view (default) or the top-face view; `top-oll` shows only the top colour. */
  view?: 'iso' | 'top' | 'top-oll';
  /** Fades everything outside the layer this move turns. */
  highlightMove?: MoveFamily;
}
