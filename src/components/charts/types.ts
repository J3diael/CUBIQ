import type { HistogramBucket, TrendPoint } from '@/lib/stats/chart-data';

export interface TrendChartProps {
  data: TrendPoint[];
  /** Text read by screen readers instead of the drawing. */
  accessibilityLabel: string;
}

export interface DistributionChartProps {
  data: HistogramBucket[];
  /** Bucket width in seconds, for the bar positions. */
  bucketWidth: number;
  accessibilityLabel: string;
}
