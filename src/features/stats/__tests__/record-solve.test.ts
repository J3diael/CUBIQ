/**
 * @jest-environment node
 */
import { useUiStore } from '@/store/ui-store';

import { saveSolveAndCheckRecords } from '../record-solve';

const save = (sec: number, i: number) =>
  saveSolveAndCheckRecords({
    puzzleId: '333',
    scramble: 'R U',
    rawTimeMs: sec * 1000,
    solvedAt: 1_000 + i,
  });

describe('saveSolveAndCheckRecords', () => {
  it('does not celebrate the very first solve', () => {
    expect(save(12, 0).records).toEqual([]);
    expect(useUiStore.getState().toast).toBeNull();
  });

  it('announces a new best single and a new best Ao5', () => {
    [12, 12, 12, 12, 12].forEach(save);
    expect(save(13, 5).records).toEqual([]);
    const result = save(9, 6);
    expect(result.records).toEqual(['single']);
    expect(useUiStore.getState().toast?.message).toBe('New personal best: single 9.000');

    // Ao5 was 12.000; last five are 12, 12, 13, 9, 9 → drop 9 and 13 → mean(12, 12, 9) = 11.000
    expect(save(9, 7).records).toEqual(['ao5']);
    expect(useUiStore.getState().toast?.message).toBe('New personal best: Ao5 11.000');
  });
});
