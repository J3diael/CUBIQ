import type { CubeDiagramSpec } from '@/lib/cube/diagram';

/** One piece of a lesson step. Diagrams are computed from moves, never drawn by hand. */
export type LessonBlock =
  | { type: 'text'; text: string }
  | { type: 'tip'; text: string }
  | { type: 'diagram'; diagram: CubeDiagramSpec; caption: string }
  | { type: 'algorithm'; name: string; moves: string; note?: string };

export interface LessonStep {
  title: string;
  blocks: readonly LessonBlock[];
}

/** A multiple-choice practice question at the end of a lesson. */
export interface PracticeQuestion {
  question: string;
  diagram?: CubeDiagramSpec;
  options: readonly string[];
  /** Index into `options`. */
  answer: number;
  /** Shown after answering, right or wrong. */
  explanation: string;
}

export interface Lesson {
  /** Stable id stored with progress, e.g. "beginner.cross". */
  id: string;
  title: string;
  summary: string;
  minutes: number;
  steps: readonly LessonStep[];
  practice: readonly PracticeQuestion[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  lessons: readonly Lesson[];
}
