import { BEGINNER_COURSE } from './beginner';
import type { Lesson } from './types';

export { BEGINNER_COURSE } from './beginner';
export { NOTATION_GUIDE, type NotationEntry, type NotationGroup } from './notation';
export type { Course, Lesson, LessonBlock, LessonStep, PracticeQuestion } from './types';

export const ALL_LESSONS: readonly Lesson[] = BEGINNER_COURSE.lessons;

export function getLesson(id: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}

/** The lesson after this one in its course, if any. */
export function nextLesson(id: string): Lesson | undefined {
  const i = ALL_LESSONS.findIndex((l) => l.id === id);
  return i >= 0 ? ALL_LESSONS[i + 1] : undefined;
}
