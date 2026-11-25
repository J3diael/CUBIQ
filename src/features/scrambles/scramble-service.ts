import type { PuzzleId } from '@/constants/puzzles';
import { scrambleEngine } from '@/services/scramble-engine/engine-client';

import { ScrambleQueue } from './scramble-queue';

/** App-wide scramble queue backed by the cubing.js engine. */
export const scrambleQueue = new ScrambleQueue({
  generate: (puzzleId: PuzzleId) => scrambleEngine.generate(puzzleId),
  targetSize: 3,
});
