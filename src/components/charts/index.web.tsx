import { lazy, Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Asset } from 'expo-asset';

import type { DistributionChartProps, TrendChartProps } from './types';

/**
 * In the browser preview, Skia runs on CanvasKit (WebAssembly), which has to load
 * before any chart code is imported. The .wasm file is bundled, so this works offline.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const wasmModule = require('canvaskit-wasm/bin/full/canvaskit.wasm');

let skiaReady: Promise<void> | null = null;
function loadSkia(): Promise<void> {
  skiaReady ??= (async () => {
    const { LoadSkiaWeb } = await import('@shopify/react-native-skia/lib/module/web');
    const uri = Asset.fromModule(wasmModule).uri;
    await LoadSkiaWeb({ locateFile: () => uri });
  })();
  return skiaReady;
}

const Impl = {
  TrendChart: lazy(() =>
    loadSkia()
      .then(() => import('./charts-impl'))
      .then((m) => ({ default: m.TrendChart })),
  ),
  DistributionChart: lazy(() =>
    loadSkia()
      .then(() => import('./charts-impl'))
      .then((m) => ({ default: m.DistributionChart })),
  ),
};

function Loading() {
  return (
    <View style={{ height: 220, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator />
    </View>
  );
}

export function TrendChart(props: TrendChartProps) {
  return (
    <Suspense fallback={<Loading />}>
      <Impl.TrendChart {...props} />
    </Suspense>
  );
}

export function DistributionChart(props: DistributionChartProps) {
  return (
    <Suspense fallback={<Loading />}>
      <Impl.DistributionChart {...props} />
    </Suspense>
  );
}

export type { DistributionChartProps, TrendChartProps } from './types';
