import { View } from 'react-native';
import { router } from 'expo-router';
import { BookOpen, CheckCircle2, Circle, CircleDot } from 'lucide-react-native';

import { Button, Card, Divider, ListRow, Screen, SectionHeader, Text } from '@/components/ui';
import { BEGINNER_COURSE } from '@/content/lessons';
import { listLessonProgress } from '@/database/repositories/learning-repository';
import { useDbQuery } from '@/store/data-store';
import { useTheme } from '@/theme';

import { courseSummary, lessonState } from './progress';

/** The beginner course: lessons in order, with progress and a "continue" button. */
export function LearnScreen() {
  const theme = useTheme();
  const progress = useDbQuery(listLessonProgress);
  const course = BEGINNER_COURSE;
  const summary = courseSummary(course, progress);

  return (
    <Screen edges={[]}>
      <View style={{ gap: theme.spacing.xs }}>
        <Text variant="body" color="textSecondary">
          {course.description}
        </Text>
        <Text variant="caption" color="textSecondary">
          {`${summary.completed} of ${summary.total} lessons completed`}
        </Text>
        <View
          accessibilityRole="progressbar"
          accessibilityLabel="Course progress"
          accessibilityValue={{ min: 0, max: summary.total, now: summary.completed }}
          style={{ height: 6, borderRadius: 3, backgroundColor: theme.colors.surfaceRaised }}
        >
          <View
            style={{
              width: `${(summary.completed / summary.total) * 100}%`,
              height: 6,
              borderRadius: 3,
              backgroundColor: theme.colors.accent,
            }}
          />
        </View>
      </View>

      {summary.next ? (
        <Button
          label={summary.completed === 0 ? 'Start the course' : `Continue: ${summary.next.title}`}
          fullWidth
          onPress={() =>
            router.push({
              pathname: '/train/learn/[lessonId]',
              params: { lessonId: summary.next!.id },
            })
          }
        />
      ) : (
        <Card>
          <Text variant="bodyStrong" align="center">
            Course complete. You can solve the cube!
          </Text>
        </Card>
      )}

      <Card flush>
        <ListRow
          title="Notation guide"
          subtitle="Every move letter, with pictures"
          icon={BookOpen}
          onPress={() => router.push('/train/notation')}
        />
      </Card>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Lessons" />
        <Card flush>
          {course.lessons.map((lesson, i) => {
            const state = lessonState(progress.get(lesson.id));
            const p = progress.get(lesson.id);
            return (
              <View key={lesson.id}>
                {i > 0 ? <Divider inset={48} /> : null}
                <ListRow
                  title={lesson.title}
                  subtitle={
                    state === 'completed' && p?.bestScore != null
                      ? `Completed · best ${p.bestScore}/${p.practiceTotal}`
                      : `${lesson.summary} · ${lesson.minutes} min`
                  }
                  icon={
                    state === 'completed' ? CheckCircle2 : state === 'started' ? CircleDot : Circle
                  }
                  onPress={() =>
                    router.push({
                      pathname: '/train/learn/[lessonId]',
                      params: { lessonId: lesson.id },
                    })
                  }
                />
              </View>
            );
          })}
        </Card>
      </View>
    </Screen>
  );
}
