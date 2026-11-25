import type { PuzzleId } from '@/constants/puzzles';

export interface Scramble {
  id: string;
  puzzleId: PuzzleId;
  notation: string;
  /** Epoch milliseconds when the scramble was generated. */
  generatedAt: number;
}

export type GenerateFn = (puzzleId: PuzzleId) => Promise<string>;

/** Optional storage so ready scrambles survive an app restart. */
export interface ScramblePersistence {
  load(puzzleId: PuzzleId): Scramble[];
  add(scramble: Scramble): void;
  remove(id: string): void;
}

export interface ScrambleQueueOptions {
  generate: GenerateFn;
  persistence?: ScramblePersistence;
  createId?: () => string;
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
  private readonly persistence: ScramblePersistence | undefined;
  private readonly createId: () => string;
  private loaded = new Set<PuzzleId>();
  private ready = new Map<PuzzleId, Scramble[]>();
  private waiting = new Map<PuzzleId, ((s: Scramble) => void)[]>();
  private failures = new Map<PuzzleId, ((e: Error) => void)[]>();
  private generating: Promise<void> | null = null;

  constructor(options: ScrambleQueueOptions) {
    this.generate = options.generate;
    this.targetSize = options.targetSize ?? 3;
    this.now = options.now ?? Date.now;
    this.persistence = options.persistence;
    let counter = 0;
    this.createId = options.createId ?? (() => `scramble-${Date.now()}-${++counter}`);
  }

  /** Loads saved scrambles for a puzzle the first time it is used. */
  private ensureLoaded(puzzleId: PuzzleId): void {
    if (this.loaded.has(puzzleId)) return;
    this.loaded.add(puzzleId);
    if (!this.persistence) return;
    try {
      const saved = this.persistence.load(puzzleId);
      if (saved.length) this.ready.set(puzzleId, [...saved, ...(this.ready.get(puzzleId) ?? [])]);
    } catch {
      // A storage problem only means generating fresh scrambles.
    }
  }

  private persist(action: () => void): void {
    try {
      action();
    } catch {
      // Losing a queued scramble is harmless; never block the timer on storage.
    }
  }

  /** Number of ready scrambles for a puzzle. */
  size(puzzleId: PuzzleId): number {
    this.ensureLoaded(puzzleId);
    return this.ready.get(puzzleId)?.length ?? 0;
  }

  /** Starts filling the queue for a puzzle without taking anything. */
  prefill(puzzleId: PuzzleId): void {
    this.ensureLoaded(puzzleId);
    void this.pump(puzzleId);
  }

  /** Returns the next scramble, waiting for generation only if none is ready. */
  take(puzzleId: PuzzleId): Promise<Scramble> {
    this.ensureLoaded(puzzleId);
    const list = this.ready.get(puzzleId);
    const next = list?.shift();
    if (next) {
      // Removed from storage the moment it is handed out, so it is never shown twice.
      this.persist(() => this.persistence?.remove(next.id));
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
          const scramble: Scramble = {
            id: this.createId(),
            puzzleId,
            notation,
            generatedAt: this.now(),
          };
          const resolve = this.waiting.get(puzzleId)?.shift();
          if (resolve) {
            this.failures.get(puzzleId)?.shift();
            resolve(scramble);
          } else {
            this.push(this.ready, puzzleId, scramble);
            this.persist(() => this.persistence?.add(scramble));
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
