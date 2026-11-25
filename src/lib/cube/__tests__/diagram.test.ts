import { caseDiagram } from '../diagram';

describe('case diagrams', () => {
  it('shows a solved top for a PLL with permuted sides', () => {
    const d = caseDiagram("R U R' U' R' F R2 U' R' U' R U R' F'", 'pll');
    expect(d.kind).toBe('last-layer');
    if (d.kind !== 'last-layer') return;
    expect(d.top.every((c) => c === 'U')).toBe(true);
    // T-perm swaps two corners and two edges, so some side stickers are out of place.
    expect([...d.front, ...d.right, ...d.back, ...d.left].every((c) => c !== null)).toBe(true);
    expect(d.front.join('') + d.right.join('') + d.back.join('') + d.left.join('')).not.toBe(
      'FFFRRRBBBLLL',
    );
  });

  it('greys out everything but the top colour for OLL', () => {
    const d = caseDiagram("F R U R' U' F'", 'oll'); // OLL 45, T shape
    if (d.kind !== 'last-layer') throw new Error('wrong kind');
    // A T shape: five yellow stickers on top.
    expect(d.top.filter((c) => c === 'U').length).toBe(5);
    expect(
      [...d.front, ...d.right, ...d.back, ...d.left].every((c) => c === null || c === 'U'),
    ).toBe(true);
  });

  it('colours the cross and slots in F2L and greys the last layer', () => {
    const d = caseDiagram("R U R'", 'f2l');
    if (d.kind !== 'f2l') throw new Error('wrong kind');
    // The cross edge and the other front corner stay solved and coloured.
    expect(d.F[6]).toBe('F');
    expect(d.F[7]).toBe('F');
    expect(d.U.filter((c) => c === null).length).toBeGreaterThan(5);
  });
});
