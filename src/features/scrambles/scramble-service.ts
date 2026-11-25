import type { PuzzleId } from '@/constants/puzzles';
import { getDatabase } from '@/database/client';
import {
  addQueuedScramble,
  listQueuedScrambles,
  removeQueuedScramble,
} from '@/database/repositories/scramble-queue-repository';
import { scrambleEngine } from '@/services/scramble-engine/engine-client';
import { newId } from '@/utils/id';

import { ScrambleQueue } from './scramble-queue';

/**
 * App-wide scramble queue backed by the cubing.js engine. Ready scrambles are saved
 * to SQLite, so the first scramble after a cold start appears instantly.
 */
export const scrambleQueue = new ScrambleQueue({
  generate: (puzzleId: PuzzleId) => scrambleEngine.generate(puzzleId),
  persistence: {
    load: (puzzleId) => listQueuedScrambles(getDatabase(), puzzleId),
    add: (scramble) => addQueuedScramble(getDatabase(), scramble),
    remove: (id) => removeQueuedScramble(getDatabase(), id),
  },
  createId: newId,
  targetSize: 3,
});
