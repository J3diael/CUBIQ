import { isF2LSolved } from './analysis';
import { caseFromAlgorithm, faceStickers, type CubeState } from './cube';
import type { Face } from './notation';

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
