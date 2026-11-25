import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Check, SearchX, X } from 'lucide-react-native';

import { CubeDiagram } from '@/components/cube/CubeDiagram';
import { Button, Card, EmptyState, Screen, Text } from '@/components/ui';
import { getLesson, nextLesson, type Lesson } from '@/content/lessons';
import { getLessonProgress } from '@/database/repositories/learning-repository';
import { useDbQuery } from '@/store/data-store';
import { useTheme } from '@/theme';

import { learning } from './actions';
import { LessonBlockView } from './components/LessonBlockView';

type Phase =
  | { kind: 'steps'; step: number }
  | { kind: 'practice'; question: number; chosen: number | null; correct: number }
  | { kind: 'done'; correct: number };

export function LessonScreen() {
  const { lessonId = '' } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = getLesson(lessonId);
  if (!lesson) {
    return (
      <Screen edges={[]}>
        <EmptyState
          icon={SearchX}
          title="Lesson not found"
          message="It may have been renamed."
          actionLabel="Back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }
  // Keyed so that moving to the next lesson starts fresh.
  return <LessonView key={lesson.id} lesson={lesson} />;
}

function LessonView({ lesson }: { lesson: Lesson }) {
  const theme = useTheme();
  const progress = useDbQuery((db) => getLessonProgress(db, lesson.id));
  const [phase, setPhase] = useState<Phase>(() => ({
    kind: 'steps',
    step: Math.min(progress.lastStep, lesson.steps.length - 1),
  }));

  const header = <Stack.Screen options={{ title: lesson.title }} />;

  if (phase.kind === 'steps') {
    const step = lesson.steps[phase.step]!;
    const last = phase.step === lesson.steps.length - 1;
    const goTo = (index: number) => {
      learning.setStep(lesson.id, index);
      setPhase({ kind: 'steps', step: index });
    };
    return (
      <Screen edges={[]}>
        {header}
        <StepDots count={lesson.steps.length + 1} current={phase.step} />
        <Text variant="title">{step.title}</Text>
        {step.blocks.map((block, i) => (
          <LessonBlockView key={i} block={block} />
        ))}
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {phase.step > 0 ? (
            <View style={{ flex: 1 }}>
              <Button
                label="Back"
                variant="secondary"
                fullWidth
                onPress={() => goTo(phase.step - 1)}
              />
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Button
              label={last ? 'Practice' : 'Next'}
              fullWidth
              onPress={() =>
                last
                  ? setPhase({ kind: 'practice', question: 0, chosen: null, correct: 0 })
                  : goTo(phase.step + 1)
              }
            />
          </View>
        </View>
      </Screen>
    );
  }

  if (phase.kind === 'practice') {
    const q = lesson.practice[phase.question]!;
    const answered = phase.chosen !== null;
    const isLast = phase.question === lesson.practice.length - 1;
    return (
      <Screen edges={[]}>
        {header}
        <StepDots count={lesson.steps.length + 1} current={lesson.steps.length} />
        <Text variant="caption" color="textSecondary">
          {`Practice · question ${phase.question + 1} of ${lesson.practice.length}`}
        </Text>
        <Text variant="title">{q.question}</Text>
        {q.diagram ? (
          <View style={{ alignItems: 'center' }}>
            <CubeDiagram
              spec={q.diagram}
              size={150}
              accessibilityLabel="Picture for the question"
            />
          </View>
        ) : null}
        <View style={{ gap: theme.spacing.xs }}>
          {q.options.map((option, i) => {
            const isAnswer = i === q.answer;
            const isChosen = i === phase.chosen;
            const color = !answered
              ? theme.colors.surface
              : isAnswer
                ? theme.colors.successMuted
                : isChosen
                  ? theme.colors.dangerMuted
                  : theme.colors.surface;
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ checked: isChosen, disabled: answered }}
                accessibilityLabel={option}
                disabled={answered}
                onPress={() =>
                  setPhase({
                    ...phase,
                    chosen: i,
                    correct: phase.correct + (isAnswer ? 1 : 0),
                  })
                }
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.spacing.sm,
                  padding: theme.spacing.md,
                  borderRadius: theme.radius.md,
                  backgroundColor: color,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}
              >
                <Text variant="body" style={{ flex: 1 }}>
                  {option}
                </Text>
                {answered && isAnswer ? <Check size={18} color={theme.colors.success} /> : null}
                {answered && isChosen && !isAnswer ? (
                  <X size={18} color={theme.colors.danger} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
        {answered ? (
          <>
            <Text
              variant="body"
              color={phase.chosen === q.answer ? 'success' : 'danger'}
              accessibilityRole="alert"
            >
              {`${phase.chosen === q.answer ? 'Correct.' : 'Not quite.'} ${q.explanation}`}
            </Text>
            <Button
              label={isLast ? 'Finish' : 'Next question'}
              fullWidth
              onPress={() => {
                if (isLast) {
                  learning.practice(lesson.id, {
                    correct: phase.correct,
                    total: lesson.practice.length,
                  });
                  setPhase({ kind: 'done', correct: phase.correct });
                } else {
                  setPhase({ ...phase, question: phase.question + 1, chosen: null });
                }
              }}
            />
          </>
        ) : null}
      </Screen>
    );
  }

  const next = nextLesson(lesson.id);
  return (
    <Screen edges={[]}>
      {header}
      <Card style={{ alignItems: 'center', gap: theme.spacing.sm }}>
        <Check size={32} color={theme.colors.success} />
        <Text variant="title" align="center">
          Lesson complete
        </Text>
        <Text variant="body" color="textSecondary" align="center">
          {`${phase.correct} of ${lesson.practice.length} answers right`}
        </Text>
      </Card>
      {next ? (
        <Button
          label={`Next: ${next.title}`}
          fullWidth
          onPress={() =>
            router.replace({ pathname: '/train/learn/[lessonId]', params: { lessonId: next.id } })
          }
        />
      ) : null}
      <Button
        label="Practise again"
        variant="secondary"
        fullWidth
        onPress={() => setPhase({ kind: 'practice', question: 0, chosen: null, correct: 0 })}
      />
      <Button label="Back to the course" variant="ghost" fullWidth onPress={() => router.back()} />
    </Screen>
  );
}

function StepDots({ count, current }: { count: number; current: number }) {
  const theme = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`Part ${current + 1} of ${count}`}
      style={{ flexDirection: 'row', gap: theme.spacing.xxs }}
    >
      {Array.from({ length: count }, (_, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            backgroundColor: i <= current ? theme.colors.accent : theme.colors.surfaceRaised,
          }}
        />
      ))}
    </View>
  );
}
