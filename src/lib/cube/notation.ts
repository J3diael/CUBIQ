/**
 * 3x3 move notation: outer turns (U D R L F B), wide turns (Rw or r), slices (M E S)
 * and rotations (x y z), each optionally followed by 2, ' or 2'. Parentheses and
 * extra spaces are allowed and ignored.
 */
export type Face = 'U' | 'D' | 'R' | 'L' | 'F' | 'B';
export type MoveFamily =
  Face | 'Uw' | 'Dw' | 'Rw' | 'Lw' | 'Fw' | 'Bw' | 'M' | 'E' | 'S' | 'x' | 'y' | 'z';

export interface Move {
  family: MoveFamily;
  /** Quarter turns clockwise: 1, 2 or 3 (3 is a prime move). */
  amount: 1 | 2 | 3;
}

const TOKEN = /^([UDRLFB]w|[UDRLFB]|[udrlfb]|[MESxyz])(2'|2|'|)$/;

export class NotationError extends Error {}

export function parseAlgorithm(text: string): Move[] {
  const cleaned = text.replace(/[()[\]]/g, ' ').trim();
  if (!cleaned) return [];
  return cleaned.split(/\s+/).map((token) => {
    const match = TOKEN.exec(token);
    if (!match) throw new NotationError(`Unknown move "${token}"`);
    const [, base = '', suffix] = match;
    const family = (/^[udrlfb]$/.test(base) ? `${base.toUpperCase()}w` : base) as MoveFamily;
    const amount = suffix === "'" ? 3 : suffix === '2' || suffix === "2'" ? 2 : 1;
    return { family, amount };
  });
}

export function formatMove(move: Move): string {
  const suffix = move.amount === 1 ? '' : move.amount === 2 ? '2' : "'";
  return `${move.family}${suffix}`;
}

export function formatAlgorithm(moves: readonly Move[]): string {
  return moves.map(formatMove).join(' ');
}

export function invertMoves(moves: readonly Move[]): Move[] {
  return [...moves].reverse().map((m) => ({ ...m, amount: (4 - m.amount) as 1 | 2 | 3 }));
}

/** "R U R' U'" → "U R U' R'". */
export function invertAlgorithm(text: string): string {
  return formatAlgorithm(invertMoves(parseAlgorithm(text)));
}

/** Number of moves in half-turn metric, not counting rotations. */
export function moveCount(text: string): number {
  return parseAlgorithm(text).filter((m) => !['x', 'y', 'z'].includes(m.family)).length;
}
