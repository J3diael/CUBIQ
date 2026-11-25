export type AlgorithmSetId = 'f2l' | 'oll' | 'pll';

/** One case of a built-in algorithm set. Keys are stable: progress in SQLite refers to them. */
export interface AlgorithmCase {
  /** Stable key, e.g. "pll.ua". Never rename: saved progress uses it. */
  id: string;
  set: AlgorithmSetId;
  /** Short name, e.g. "Ua" or "OLL 21". */
  name: string;
  /** Recognition group, e.g. "Edges only" or "Dot". */
  group: string;
  /** The first algorithm is the recommended one; the rest are alternatives. */
  algorithms: readonly [string, ...string[]];
  /** How to spot the case, in plain words. */
  recognition?: string;
}

export interface AlgorithmGroup {
  name: string;
  description: string;
}

export interface AlgorithmSet {
  id: AlgorithmSetId;
  name: string;
  fullName: string;
  description: string;
  groups: readonly AlgorithmGroup[];
  cases: readonly AlgorithmCase[];
}
