import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { SearchX } from 'lucide-react-native';

import {
  Button,
  Card,
  Chip,
  Divider,
  EmptyState,
  Screen,
  SectionHeader,
  Text,
  TextField,
} from '@/components/ui';
import { ALGORITHM_SETS, type AlgorithmSetId } from '@/content/algorithms';
import { listCustomAlgorithms, listProgress } from '@/database/repositories/training-repository';
import { useNow } from '@/hooks/use-now';
import { useDbQuery } from '@/store/data-store';
import { useTheme } from '@/theme';

import { CaseRow } from './components/CaseRow';
import { chosenAlgorithm, progressFor, STATUS_LABELS, summarizeSet } from './progress';

type Filter = 'all' | 'new' | 'learning' | 'learned' | 'favorites';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'new', label: 'Not started' },
  { value: 'learning', label: 'Learning' },
  { value: 'learned', label: 'Learned' },
  { value: 'favorites', label: 'Favourites' },
];

const isSetId = (v: string): v is AlgorithmSetId => v in ALGORITHM_SETS;

export function AlgorithmSetScreen() {
  const theme = useTheme();
  const { setId = '' } = useLocalSearchParams<{ setId: string }>();
  const progress = useDbQuery(listProgress);
  const custom = useDbQuery(listCustomAlgorithms);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const now = useNow();

  const set = isSetId(setId) ? ALGORITHM_SETS[setId] : null;

  const visible = useMemo(() => {
    if (!set) return [];
    const q = query.trim().toLowerCase();
    return set.cases.filter((c) => {
      const p = progressFor(progress, c.id);
      if (filter === 'favorites' && !p.isFavorite) return false;
      if (filter !== 'all' && filter !== 'favorites' && p.status !== filter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.group.toLowerCase().includes(q) ||
        c.algorithms.some((a) => a.toLowerCase().includes(q))
      );
    });
  }, [set, query, filter, progress]);

  if (!set) {
    return (
      <Screen edges={[]}>
        <EmptyState
          icon={SearchX}
          title="Set not found"
          message="Go back and pick F2L, OLL or PLL."
        />
      </Screen>
    );
  }

  const summary = summarizeSet(set.id, progress, now);
  const groups = set.groups
    .map((g) => ({ ...g, cases: visible.filter((c) => c.group === g.name) }))
    .filter((g) => g.cases.length > 0);

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: `${set.name} · ${set.fullName}` }} />
      <View style={{ gap: theme.spacing.xs }}>
        <Text variant="body" color="textSecondary">
          {set.description}
        </Text>
        <Text variant="caption" color="textSecondary">
          {`${summary.learned} of ${summary.total} learned · ${summary.learning} learning`}
        </Text>
      </View>
      <Button
        label={`Flashcards for ${set.name}`}
        variant="secondary"
        fullWidth
        onPress={() => router.push({ pathname: '/train/flashcards', params: { set: set.id } })}
      />
      <TextField
        label="Search"
        placeholder="Name, group or moves"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        autoCapitalize="none"
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
        {FILTERS.map((f) => (
          <Chip
            key={f.value}
            label={f.label}
            selected={filter === f.value}
            onPress={() => setFilter(f.value)}
          />
        ))}
      </View>

      {groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={SearchX}
            title="No cases match"
            message="Try another search or filter."
          />
        </Card>
      ) : (
        groups.map((g) => (
          <View key={g.name} style={{ gap: theme.spacing.sm }}>
            <SectionHeader title={`${g.name} · ${g.cases.length}`} />
            <Text variant="caption" color="textSecondary">
              {g.description}
            </Text>
            <Card flush>
              {g.cases.map((c, i) => {
                const p = progressFor(progress, c.id);
                const alts = custom.filter((a) => a.caseId === c.id).map((a) => a.algorithm);
                return (
                  <View key={c.id}>
                    {i > 0 ? <Divider inset={76} /> : null}
                    <CaseRow
                      name={c.name}
                      algorithm={chosenAlgorithm(c, p, alts)}
                      diagramAlgorithm={c.algorithms[0]}
                      set={set.id}
                      status={p.status === 'new' ? undefined : STATUS_LABELS[p.status]}
                      isFavorite={p.isFavorite}
                      onPress={() =>
                        router.push({ pathname: '/train/case/[caseId]', params: { caseId: c.id } })
                      }
                    />
                  </View>
                );
              })}
            </Card>
          </View>
        ))
      )}
    </Screen>
  );
}
