import { View } from 'react-native';
import { useFont } from '@shopify/react-native-skia';
import { Bar, CartesianChart, Line } from 'victory-native';

import { useTheme } from '@/theme';

import type { DistributionChartProps, TrendChartProps } from './types';

const CHART_HEIGHT = 220;
const fontSource = require('@expo-google-fonts/inter/400Regular/Inter_400Regular.ttf');

/** Seconds as a short axis label: "12", "12.5", "1:05". */
function axisSeconds(value: number): string {
  if (value >= 60) {
    const m = Math.floor(value / 60);
    const s = Math.round(value % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

/** Each solve as a thin line, with Ao5 and Ao12 drawn over it. */
export function TrendChart({ data, accessibilityLabel }: TrendChartProps) {
  const theme = useTheme();
  const font = useFont(fontSource, 11);
  const axis = {
    font,
    labelColor: theme.colors.textSecondary,
    lineColor: theme.colors.border,
  };
  return (
    <View style={{ height: CHART_HEIGHT }} accessible accessibilityLabel={accessibilityLabel}>
      <CartesianChart
        data={data}
        xKey="solve"
        yKeys={['time', 'ao5', 'ao12']}
        domainPadding={{ top: 12, bottom: 12 }}
        xAxis={{ ...axis, tickCount: Math.min(6, data.length), formatXLabel: (v) => String(v) }}
        yAxis={[{ ...axis, tickCount: 5, formatYLabel: (v) => axisSeconds(Number(v)) }]}
      >
        {({ points }) => (
          <>
            <Line
              points={points.time}
              color={theme.colors.textSecondary}
              strokeWidth={1}
              opacity={0.6}
              connectMissingData
            />
            <Line points={points.ao12} color={theme.colors.success} strokeWidth={2} />
            <Line points={points.ao5} color={theme.colors.accent} strokeWidth={2} />
          </>
        )}
      </CartesianChart>
    </View>
  );
}

/** How many solves fell into each time range. */
export function DistributionChart({
  data,
  bucketWidth,
  accessibilityLabel,
}: DistributionChartProps) {
  const theme = useTheme();
  const font = useFont(fontSource, 11);
  const axis = {
    font,
    labelColor: theme.colors.textSecondary,
    lineColor: theme.colors.border,
  };
  return (
    <View style={{ height: CHART_HEIGHT }} accessible accessibilityLabel={accessibilityLabel}>
      <CartesianChart
        data={data}
        xKey="mid"
        yKeys={['count']}
        domain={{ y: [0] }}
        domainPadding={{ left: 24, right: 24, top: 12 }}
        xAxis={{
          ...axis,
          // One label per bar (every other bar when crowded), showing where its range starts.
          tickValues: data.filter((_, i) => data.length <= 8 || i % 2 === 0).map((d) => d.mid),
          formatXLabel: (v) => axisSeconds(Math.round((Number(v) - bucketWidth / 2) * 10) / 10),
        }}
        yAxis={[{ ...axis, tickCount: 4, formatYLabel: (v) => String(Math.round(Number(v))) }]}
      >
        {({ points, chartBounds }) => (
          <Bar
            points={points.count}
            chartBounds={chartBounds}
            color={theme.colors.accent}
            innerPadding={0.2}
            roundedCorners={{ topLeft: 4, topRight: 4 }}
          />
        )}
      </CartesianChart>
    </View>
  );
}
