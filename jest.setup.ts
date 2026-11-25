// Gesture Handler ships a Jest setup that mocks its native module.
import 'react-native-gesture-handler/jestSetup';

// The real scramble engine runs in a WebView, which doesn't exist in Jest.
// Tests get a queue with predictable scrambles instead.
jest.mock('@/features/scrambles/scramble-service', () => {
  const { ScrambleQueue } = jest.requireActual('@/features/scrambles/scramble-queue');
  let count = 0;
  return {
    scrambleQueue: new ScrambleQueue({
      generate: async () => `R U R' U' test-${++count}`,
      targetSize: 1,
    }),
  };
});

// Charts draw with Skia, which needs a GPU canvas. Tests check the data and labels
// passed to the charts instead; the data shaping is unit tested in lib/stats.
jest.mock('@/components/charts', () => {
  const { createElement } = jest.requireActual('react');
  const { View } = jest.requireActual('react-native');
  const chart = (name: string) =>
    function MockChart(props: { accessibilityLabel: string }) {
      return createElement(View, {
        testID: name,
        accessible: true,
        accessibilityLabel: props.accessibilityLabel,
      });
    };
  return { TrendChart: chart('trend-chart'), DistributionChart: chart('distribution-chart') };
});
