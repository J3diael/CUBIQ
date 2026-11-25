import {
  recordPractice,
  resetLesson,
  setLessonStep,
} from '@/database/repositories/learning-repository';
import { useDataStore } from '@/store/data-store';

/** Lesson progress writes. Each saves to SQLite and refreshes open screens. */
export const learning = {
  setStep: (lessonId: string, step: number) =>
    useDataStore.getState().write((db) => setLessonStep(db, lessonId, step)),
  practice: (lessonId: string, result: { correct: number; total: number }) =>
    useDataStore.getState().write((db) => recordPractice(db, lessonId, result)),
  reset: (lessonId: string) => useDataStore.getState().write((db) => resetLesson(db, lessonId)),
};
