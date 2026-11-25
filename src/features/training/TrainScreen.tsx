import { View } from 'react-native';
import { router } from 'expo-router';
import {
  BookOpen,
  Box,
  Grid3x3,
  Layers2,
  Library,
  Shapes,
  Sparkles,
  Type,
  Zap,
} from 'lucide-react-native';

import { Button, Card, Chip, Divider, ListRow, Screen, SectionHeader, Text } from '@/components/ui';
import { BEGINNER_COURSE } from '@/content/lessons';
import { listLessonProgress } from '@/database/repositories/learning-repository';
import { ALGORITHM_SET_ORDER, ALGORITHM_SETS, type AlgorithmSetId } from '@/content/algorithms';
import { listCustomAlgorithms, listProgress } from '@/database/repositories/training-repository';
import { courseSummary } from '@/features/learning/progress';
import { useNow } from '@/hooks/use-now';
import { useDbQuery } from '@/store/data-store';
import { useTheme } from '@/theme';

import { summarizeSet } from './progress';

const SET_ICONS: Record<AlgorithmSetId, typeof Box> = { f2l: Layers2, oll: Grid3x3, pll: Box };

export function TrainScreen() {
  const theme = useTheme();
  const progress = useDbQuery(listProgress);
  const customCount = useDbQuery((db) => listCustomAlgorithms(db).length);
  const now = useNow();
  const summaries = ALGORITHM_SET_ORDER.map((id) => ({ id, ...summarizeSet(id, progress, now) }));
  const due = summaries.reduce((n, s) => n + s.due, 0);
  const course = courseSummary(BEGINNER_COURSE, useDbQuery(listLessonProgress));

  return (
    <Screen title="Train" subtitle="Learn algorithms and build speed">
      <Card style={{ gap: theme.spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
          <Zap size={22} color={theme.colors.accent} />
          <View style={{ flex: 1 }}>
            <Text variant="heading">Flashcards</Text>
            <Text variant="caption" color="textSecondary">
              {due > 0
                ? `${due} ${due === 1 ? 'case is' : 'cases are'} due for review`
                : 'Recognise a case, recall its algorithm, rate yourself'}
            </Text>
          </View>
        </View>
        <Button
          label="Start flashcards"
          fullWidth
          onPress={() => router.push('/train/flashcards')}
        />
      </Card>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="CFOP" />
        <Card flush>
          <ListRow
            title="Cross"
            subtitle="Planning practice arrives later"
            icon={Shapes}
            trailing={<Chip label="Later" />}
          />
          {summaries.map((s) => (
            <View key={s.id}>
              <Divider inset={48} />
              <ListRow
                title={ALGORITHM_SETS[s.id].name}
                subtitle={`${s.learned}/${s.total} learned${s.learning ? ` · ${s.learning} learning` : ''}${s.due ? ` · ${s.due} due` : ''}`}
                icon={SET_ICONS[s.id]}
                onPress={() => router.push({ pathname: '/train/[setId]', params: { setId: s.id } })}
              />
            </View>
          ))}
        </Card>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Your library" />
        <Card flush>
          <ListRow
            title="My algorithms"
            subtitle={
              customCount ? `${customCount} saved` : 'Save your own algorithms and alternatives'
            }
            icon={Library}
            onPress={() => router.push('/train/custom')}
          />
        </Card>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Learn" />
        <Card flush>
          <ListRow
            title="Beginner course"
            subtitle={
              course.completed === 0
                ? 'Notation, layers and your first full solve'
                : `${course.completed} of ${course.total} lessons completed`
            }
            icon={BookOpen}
            onPress={() => router.push('/train/learn')}
          />
          <Divider inset={48} />
          <ListRow
            title="Notation guide"
            subtitle="What R, U' and F2 mean, with pictures"
            icon={Type}
            onPress={() => router.push('/train/notation')}
          />
        </Card>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Other methods" />
        <Card flush>
          <ListRow title="Roux" icon={Sparkles} trailing={<Chip label="Later" />} />
          <Divider inset={48} />
          <ListRow title="ZZ" icon={Sparkles} trailing={<Chip label="Later" />} />
        </Card>
        <Text variant="caption" color="textSecondary">
          Roux and ZZ algorithms can already be saved in My algorithms.
        </Text>
      </View>
    </Screen>
  );
}
