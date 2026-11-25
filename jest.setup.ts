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
