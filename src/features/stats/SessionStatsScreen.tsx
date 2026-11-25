import { useMemo } from 'react';
import { View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { ChartLine } from 'lucide-react-native';

import { DistributionChart, TrendChart } from '@/components/charts';
import { Card, Divider, EmptyState, Screen, SectionHeader, StatTile, Text } from '@/components/ui';
import { getSession } from '@/database/repositories/sessions-repository';
import { listSolves } from '@/database/repositories/solves-repository';
import { AVERAGES, computeSessionStats, formatStat } from '@/lib/stats';
import { bucketWidth, histogram, trendSeries } from '@/lib/stats/chart-data';
import { useDbQuery } from '@/store/data-store';
import { useSettingsStore } from '@/store/settings-store';
import { useTheme } from '@/theme';

/** Charts need a few points before they say anything. */
const MIN_SOLVES_FOR_CHARTS = 3;

export function SessionStatsScreen() {
  const theme = useTheme();
  const { sessionId = '' } = useLocalSearchParams<{ sessionId: string }>();
  const session = useDbQuery((db) => getSession(db, sessionId));
  const solves = useDbQuery((db) => listSolves(db, sessionId));
  const decimals = useSettingsStore((s) => s.timer.decimals);

  const stats = useMemo(() => computeSessionStats(solves), [solves]);
  const trend = useMemo(() => trendSeries(solves), [solves]);
  const buckets = useMemo(() => histogram(solves), [solves]);

  if (!session) {
    return (
      <Screen edges={[]}>
        <EmptyState
          icon={ChartLine}
          title="Session not found"
          message="It may have been deleted."
          actionLabel="Back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const f = (v: number | null) => formatStat(v, decimals);
  const dnfRate = stats.count ? Math.round((stats.dnfCount / stats.count) * 100) : 0;

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: `${session.name} · Statistics` }} />

      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        <StatTile label="Solves" value={String(stats.count)} />
        <StatTile label="Best" value={f(stats.bestSingle)} />
        <StatTile
          label="Mean"
          value={f(stats.mean)}
          hint={stats.dnfCount ? 'DNFs left out' : undefined}
        />
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Averages" />
        <Card flush>
          <AverageRow label="" current="Current" best="Best" header />
          {AVERAGES.map(({ kind, label }) => (
            <View key={kind}>
              <Divider />
              <AverageRow
                label={label}
                current={f(stats.averages[kind].current)}
                best={f(stats.averages[kind].best)}
              />
            </View>
          ))}
        </Card>
        <Text variant="caption" color="textSecondary">
          Averages drop the fastest and slowest 5% (one each for Ao5 and Ao12), as in WCA
          competitions. Mo3 is a plain mean of 3. More DNFs than dropped solves make the average a
          DNF.
        </Text>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <SectionHeader title="Consistency" />
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <StatTile label="Std dev" value={f(stats.standardDeviation)} />
          <StatTile label="Worst" value={f(stats.worstSingle)} />
          <StatTile label="DNF rate" value={stats.count ? `${dnfRate}%` : '—'} />
        </View>
      </View>

      {stats.count < MIN_SOLVES_FOR_CHARTS ? (
        <Card>
          <EmptyState
            icon={ChartLine}
            title="Charts need a few solves"
            message={`Do ${MIN_SOLVES_FOR_CHARTS - stats.count} more ${MIN_SOLVES_FOR_CHARTS - stats.count === 1 ? 'solve' : 'solves'} in this session to see your trend and time spread.`}
          />
        </Card>
      ) : (
        <>
          <View style={{ gap: theme.spacing.sm }}>
            <SectionHeader title="Trend" />
            <Card>
              <TrendChart
                data={trend}
                accessibilityLabel={`Trend of ${stats.count} solves. Current Ao5 ${f(stats.averages.ao5.current)}, current Ao12 ${f(stats.averages.ao12.current)}.`}
              />
              <Legend
                items={[
                  { label: 'Solve', color: theme.colors.textSecondary },
                  { label: 'Ao5', color: theme.colors.accent },
                  { label: 'Ao12', color: theme.colors.success },
                ]}
              />
            </Card>
          </View>
          <View style={{ gap: theme.spacing.sm }}>
            <SectionHeader title="Time spread" />
            <Card>
              <DistributionChart
                data={buckets}
                bucketWidth={bucketWidth(buckets)}
                accessibilityLabel={`Time spread: ${buckets
                  .filter((b) => b.count > 0)
                  .map((b) => `${b.count} from ${b.from} seconds`)
                  .join(', ')}.`}
              />
              <Text variant="caption" color="textSecondary" align="center">
                Solves per {bucketWidth(buckets) || 1} s range, DNFs left out
              </Text>
            </Card>
          </View>
        </>
      )}
    </Screen>
  );
}

function AverageRow({
  label,
  current,
  best,
  header = false,
}: {
  label: string;
  current: string;
  best: string;
  header?: boolean;
}) {
  const theme = useTheme();
  const variant = header ? 'overline' : 'stat';
  const color = header ? 'textSecondary' : 'textPrimary';
  return (
    <View
      accessible={!header}
      accessibilityLabel={header ? undefined : `${label}: current ${current}, best ${best}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.xs,
      }}
    >
      <Text variant={header ? 'overline' : 'bodyStrong'} color="textSecondary" style={{ flex: 1 }}>
        {label}
      </Text>
      <Text variant={variant} color={color} align="right" style={{ flex: 1.2 }}>
        {current}
      </Text>
      <Text variant={variant} color={color} align="right" style={{ flex: 1.2 }}>
        {best}
      </Text>
    </View>
  );
}

function Legend({ items }: { items: { label: string; color: string }[] }) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'center',
        gap: theme.spacing.md,
        marginTop: theme.spacing.xs,
      }}
    >
      {items.map((item) => (
        <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 12, height: 3, borderRadius: 2, backgroundColor: item.color }} />
          <Text variant="caption" color="textSecondary">
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}
