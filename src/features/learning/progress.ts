import type { Course, Lesson } from '@/content/lessons';
import type { LessonProgress } from '@/database/repositories/learning-repository';

export type LessonState = 'new' | 'started' | 'completed';

export function lessonState(p: LessonProgress | undefined): LessonState {
  if (!p) return 'new';
  if (p.completedAt !== null) return 'completed';
  return 'started';
}

/** Completed count and the first lesson not yet completed. */
export function courseSummary(
  course: Course,
  progress: Map<string, LessonProgress>,
): { completed: number; total: number; next: Lesson | undefined } {
  const completed = course.lessons.filter((l) => lessonState(progress.get(l.id)) === 'completed');
  return {
    completed: completed.length,
    total: course.lessons.length,
    next: course.lessons.find((l) => lessonState(progress.get(l.id)) !== 'completed'),
  };
}
