import type { PuzzleId } from '@/constants/puzzles';

export interface Scramble {
  puzzleId: PuzzleId;
  notation: string;
  /** Epoch milliseconds when the scramble was generated. */
  generatedAt: number;
}

export type GenerateFn = (puzzleId: PuzzleId) => Promise<string>;

export interface ScrambleQueueOptions {
  generate: GenerateFn;
  /** How many ready scrambles to keep per puzzle. */
  targetSize?: number;
  now?: () => number;
}

/**
 * Keeps a few scrambles ready per puzzle so the timer never waits for the solver.
 * Each scramble is handed out exactly once. Generation runs one at a time, because
 * the engine works serially anyway and this keeps `take()` requests first in line.
 */
export class ScrambleQueue {
  private readonly generate: GenerateFn;
  private readonly targetSize: number;
  private readonly now: () => number;
  private ready = new Map<PuzzleId, Scramble[]>();
  private waiting = new Map<PuzzleId, ((s: Scramble) => void)[]>();
  private failures = new Map<PuzzleId, ((e: Error) => void)[]>();
  private generating: Promise<void> | null = null;

  constructor(options: ScrambleQueueOptions) {
    this.generate = options.generate;
    this.targetSize = options.targetSize ?? 3;
    this.now = options.now ?? Date.now;
  }

  /** Number of ready scrambles for a puzzle. */
  size(puzzleId: PuzzleId): number {
    return this.ready.get(puzzleId)?.length ?? 0;
  }

  /** Starts filling the queue for a puzzle without taking anything. */
  prefill(puzzleId: PuzzleId): void {
    void this.pump(puzzleId);
  }

  /** Returns the next scramble, waiting for generation only if none is ready. */
  take(puzzleId: PuzzleId): Promise<Scramble> {
    const list = this.ready.get(puzzleId);
    const next = list?.shift();
    if (next) {
      void this.pump(puzzleId);
      return Promise.resolve(next);
    }
    return new Promise<Scramble>((resolve, reject) => {
      this.push(this.waiting, puzzleId, resolve);
      this.push(this.failures, puzzleId, reject);
      void this.pump(puzzleId);
    });
  }

  private push<T>(map: Map<PuzzleId, T[]>, key: PuzzleId, value: T) {
    const list = map.get(key) ?? [];
    list.push(value);
    map.set(key, list);
  }

  private needed(puzzleId: PuzzleId): number {
    return (this.waiting.get(puzzleId)?.length ?? 0) + this.targetSize - this.size(puzzleId);
  }

  private async pump(puzzleId: PuzzleId): Promise<void> {
    if (this.generating) {
      await this.generating;
      if (this.needed(puzzleId) > 0) return this.pump(puzzleId);
      return;
    }
    if (this.needed(puzzleId) <= 0) return;

    this.generating = (async () => {
      try {
        while (this.needed(puzzleId) > 0) {
          const notation = await this.generate(puzzleId);
          const scramble: Scramble = { puzzleId, notation, generatedAt: this.now() };
          const resolve = this.waiting.get(puzzleId)?.shift();
          if (resolve) {
            this.failures.get(puzzleId)?.shift();
            resolve(scramble);
          } else {
            this.push(this.ready, puzzleId, scramble);
          }
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        // Fail only the callers who are actually waiting; the ready queue is kept.
        this.failures.get(puzzleId)?.forEach((reject) => reject(err));
        this.failures.set(puzzleId, []);
        this.waiting.set(puzzleId, []);
      } finally {
        this.generating = null;
      }
    })();
    await this.generating;
  }
}
