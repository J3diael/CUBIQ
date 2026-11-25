import type { AlgorithmCase, AlgorithmGroup } from './types';

/**
 * F2L cases for the front-right slot, with the cross on the bottom.
 *
 * The algorithms were found by computer search (scripts/generate-f2l.mjs) as the
 * shortest solutions using R, U and F turns, so they need no cube rotations. Numbers
 * follow CUBIQ’s grouping, not the speedsolving.com list.
 */
export const F2L_GROUPS: AlgorithmGroup[] = [
  {
    name: 'Basic inserts',
    description: 'The pair is ready, or one move from ready: insert it straight away.',
  },
  {
    name: 'White sticker on top',
    description: 'Both pieces are on top and the corner’s white sticker faces up.',
  },
  {
    name: 'Corner and edge on top',
    description: 'Both pieces are on top and the corner’s white sticker faces the side.',
  },
  {
    name: 'Edge in its slot',
    description: 'The corner is on top and the edge is already in the slot, solved or flipped.',
  },
  {
    name: 'Corner in its slot',
    description: 'The corner is in the slot, solved or twisted, and the edge is on top.',
  },
  {
    name: 'Both in the slot',
    description: 'Both pieces are in the slot but not solved correctly.',
  },
];

const c = (n: number, group: string, algorithms: AlgorithmCase['algorithms']): AlgorithmCase => ({
  id: `f2l.${n}`,
  set: 'f2l',
  name: `F2L ${n}`,
  group,
  algorithms,
});

export const F2L_CASES: AlgorithmCase[] = [
  c(1, 'Basic inserts', ["F' U' F"]),
  c(2, 'Basic inserts', ["F' U2 F"]),
  c(3, 'Basic inserts', ["R U R'"]),
  c(4, 'Basic inserts', ["R U' R'"]),
  c(5, 'White sticker on top', ["F' U2 F2 R' F' R"]),
  c(6, 'White sticker on top', ["R U R' F' U' F"]),
  c(7, 'White sticker on top', ["R U R2 F R F'"]),
  c(8, 'White sticker on top', ["R U2 R2 F R F'"]),
  c(9, 'White sticker on top', ["F' U2 F U F' U' F"]),
  c(10, 'White sticker on top', ["F2 U2 F U F' U F2"]),
  c(11, 'White sticker on top', ["R U2 R' U' R U R'"]),
  c(12, 'White sticker on top', ["R2 U2 R' U' R U' R2"]),
  c(13, 'Corner and edge on top', ["F U2 F2 U' F2 U' F'"]),
  c(14, 'Corner and edge on top', ["F' U F U' F' U' F"]),
  c(15, 'Corner and edge on top', ["F' U F U' R U R'"]),
  c(16, 'Corner and edge on top', ["F' U F U2 R U R'"]),
  c(17, 'Corner and edge on top', ["F' U' F U F' U2 F"]),
  c(18, 'Corner and edge on top', ["F2 U2 R' F2 R U2 F2"]),
  c(19, 'Corner and edge on top', ["R U R' U2 F' U' F"]),
  c(20, 'Corner and edge on top', ["R U' R' U2 F' U' F"]),
  c(21, 'Corner and edge on top', ["R' U2 R2 U R2 U R"]),
  c(22, 'Corner and edge on top', ["R2 U R' U R U2 R2"]),
  c(23, 'Corner and edge on top', ["R2 U2 F R' F' U2 R2"]),
  c(24, 'Corner and edge on top', ["R2 U2 F R2 F' U2 R2"]),
  c(25, 'Edge in its slot', ["R U' R' F' U2 F"]),
  c(26, 'Edge in its slot', ["F' U' F U' R U R'"]),
  c(27, 'Edge in its slot', ["F' U2 F U' F' U' F"]),
  c(28, 'Edge in its slot', ["R U R' U2 F' U2 F"]),
  c(29, 'Edge in its slot', ["R U R' U2 R U R'"]),
  c(30, 'Edge in its slot', ['R2 U R2 U R2 U2 R2']),
  c(31, 'Corner in its slot', ["F' U F R U R'"]),
  c(32, 'Corner in its slot', ["R U' R2 F R F'"]),
  c(33, 'Corner in its slot', ["R U2 R' F' U2 F"]),
  c(34, 'Corner in its slot', ["R' F R F2 U' F"]),
  c(35, 'Corner in its slot', ["F' U2 F U2 R U R'"]),
  c(36, 'Corner in its slot', ["R U2 R' U2 F' U' F"]),
  c(37, 'Both in the slot', ["R F U R U' R' F' U' R'"]),
  c(38, 'Both in the slot', ["R U F R U R' U' F' R'"]),
  c(39, 'Both in the slot', ["R U' R U2 F R2 F' U2 R2"]),
  c(40, 'Both in the slot', ["R U2 R U R' U R U2 R2"]),
  c(41, 'Both in the slot', ["R U2 R U2 F R F' U2 R2"]),
];
