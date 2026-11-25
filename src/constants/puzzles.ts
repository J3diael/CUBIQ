/**
 * Puzzle (event) definitions. Ids are WCA event ids, which cubing.js also uses.
 * `available` marks puzzles selectable in the app today; the rest are already
 * supported by the scramble engine and get enabled in Phase 7.
 */
export type PuzzleId =
  '222' | '333' | '444' | '555' | '666' | '777' | 'pyram' | 'skewb' | 'minx' | 'sq1';

export interface PuzzleDefinition {
  id: PuzzleId;
  name: string;
  shortName: string;
  /** How cubing.js generates this event's scramble, following WCA practice. */
  scrambleType: 'random-state' | 'random-move';
  available: boolean;
}

export const PUZZLES: Record<PuzzleId, PuzzleDefinition> = {
  '222': {
    id: '222',
    name: '2x2x2 Cube',
    shortName: '2x2',
    scrambleType: 'random-state',
    available: false,
  },
  '333': {
    id: '333',
    name: '3x3x3 Cube',
    shortName: '3x3',
    scrambleType: 'random-state',
    available: true,
  },
  '444': {
    id: '444',
    name: '4x4x4 Cube',
    shortName: '4x4',
    scrambleType: 'random-state',
    available: false,
  },
  '555': {
    id: '555',
    name: '5x5x5 Cube',
    shortName: '5x5',
    scrambleType: 'random-move',
    available: false,
  },
  '666': {
    id: '666',
    name: '6x6x6 Cube',
    shortName: '6x6',
    scrambleType: 'random-move',
    available: false,
  },
  '777': {
    id: '777',
    name: '7x7x7 Cube',
    shortName: '7x7',
    scrambleType: 'random-move',
    available: false,
  },
  pyram: {
    id: 'pyram',
    name: 'Pyraminx',
    shortName: 'Pyra',
    scrambleType: 'random-state',
    available: false,
  },
  skewb: {
    id: 'skewb',
    name: 'Skewb',
    shortName: 'Skewb',
    scrambleType: 'random-state',
    available: false,
  },
  minx: {
    id: 'minx',
    name: 'Megaminx',
    shortName: 'Mega',
    scrambleType: 'random-move',
    available: false,
  },
  sq1: {
    id: 'sq1',
    name: 'Square-1',
    shortName: 'SQ-1',
    scrambleType: 'random-state',
    available: false,
  },
};

export const DEFAULT_PUZZLE_ID: PuzzleId = '333';
