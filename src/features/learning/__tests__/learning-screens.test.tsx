import { fireEvent, screen } from 'expo-router/testing-library';

import { renderTrain } from '@/test-utils/render-train';

import { BEGINNER_COURSE, getLesson } from '@/content/lessons';
import { getDatabase } from '@/database/client';
import { getLessonProgress } from '@/database/repositories/learning-repository';
import { learning } from '@/features/learning/actions';

const progress = (id: string) => getLessonProgress(getDatabase(), id);

describe('beginner course', () => {
  it('opens from the Train tab and starts at the first lesson', async () => {
    await renderTrain();
    await fireEvent.press(screen.getByRole('button', { name: /^Beginner course/ }));
    expect(screen).toHavePathname('/train/learn');
    expect(
      screen.getByText(`0 of ${BEGINNER_COURSE.lessons.length} lessons completed`),
    ).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Start the course' }));
    expect(screen).toHavePathname('/train/learn/beginner.meet');
    expect(screen.getByText('Centres never move')).toBeOnTheScreen();
  });

  it('walks through the steps, answers the practice and completes the lesson', async () => {
    const lesson = getLesson('beginner.notation')!;
    await renderTrain('/train/learn/beginner.notation');
    expect(screen.getByText(lesson.steps[0]!.title)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText(lesson.steps[1]!.title)).toBeOnTheScreen();
    expect(progress(lesson.id).lastStep).toBe(1);

    await fireEvent.press(screen.getByRole('button', { name: 'Practice' }));
    for (const [i, q] of lesson.practice.entries()) {
      expect(screen.getByText(q.question)).toBeOnTheScreen();
      // Answer the first question wrongly (if possible) and the rest correctly.
      const pick = i === 0 ? (q.answer + 1) % q.options.length : q.answer;
      await fireEvent.press(screen.getByRole('radio', { name: q.options[pick]! }));
      expect(screen.getByText(new RegExp(q.explanation.slice(0, 20)))).toBeOnTheScreen();
      await fireEvent.press(
        screen.getByRole('button', {
          name: i === lesson.practice.length - 1 ? 'Finish' : 'Next question',
        }),
      );
    }
    expect(screen.getByText('Lesson complete')).toBeOnTheScreen();
    const total = lesson.practice.length;
    expect(screen.getByText(`${total - 1} of ${total} answers right`)).toBeOnTheScreen();
    expect(progress(lesson.id)).toMatchObject({
      bestScore: total - 1,
      practiceTotal: total,
      attempts: 1,
    });
    expect(progress(lesson.id).completedAt).not.toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: /^Next: The plan/ }));
    expect(screen).toHavePathname('/train/learn/beginner.layers');
    expect(screen.getByText('Bottom, middle, top')).toBeOnTheScreen();
  });

  it('shows progress on the course and resumes at the step reached', async () => {
    learning.practice('beginner.meet', { correct: 4, total: 4 });
    learning.setStep('beginner.notation', 1);
    await renderTrain('/train/learn');
    expect(screen.getByText('1 of 11 lessons completed')).toBeOnTheScreen();
    expect(screen.getByText('Completed · best 4/4')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: /^Continue: Reading moves/ }));
    expect(screen.getByText('Primes and twos')).toBeOnTheScreen();
  });
});

describe('notation guide', () => {
  it('lists every move with before and after pictures', async () => {
    await renderTrain('/train/notation');
    expect(screen.getByText('Face turns')).toBeOnTheScreen();
    expect(screen.getByLabelText(/^R', R prime\./)).toBeTruthy();
    expect(screen.getByLabelText("After R'")).toBeTruthy();
    expect(screen.getByLabelText('Before M')).toBeTruthy();
  });
});
