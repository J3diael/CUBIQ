import { act, renderHook } from '@testing-library/react-native';

import type { PuzzleId } from '@/constants/puzzles';

import { useScramble } from '../use-scramble';

describe('useScramble', () => {
  it("never shows the previous puzzle's scramble after switching puzzle", async () => {
    // Every render's puzzle and the scramble it showed.
    const renders: { id: PuzzleId; shown: PuzzleId | null }[] = [];
    const { result, rerender } = await renderHook(
      ({ id }: { id: PuzzleId }) => {
        const s = useScramble(id);
        renders.push({ id, shown: s.scramble?.puzzleId ?? null });
        return s;
      },
      { initialProps: { id: '333' } },
    );
    await act(async () => {});
    expect(result.current.scramble?.puzzleId).toBe('333');

    await rerender({ id: '222' });
    await act(async () => {});
    expect(result.current.scramble?.puzzleId).toBe('222');
    // No render ever showed a scramble for a puzzle other than the one asked for.
    expect(renders.every((r) => r.shown === null || r.shown === r.id)).toBe(true);
    expect(renders.some((r) => r.id === '222' && r.shown === null)).toBe(true);
  });
});
