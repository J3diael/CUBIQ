import type { AlgorithmCase, AlgorithmGroup } from './types';

export const PLL_GROUPS: AlgorithmGroup[] = [
  { name: 'Edges only', description: 'Corners are already solved; only edges move.' },
  { name: 'Corners only', description: 'Edges are already solved; only corners move.' },
  {
    name: 'Adjacent swap',
    description: 'Two neighbouring corners swap. Look for headlights or a solved bar.',
  },
  { name: 'Diagonal swap', description: 'Two opposite corners swap. No headlights anywhere.' },
  { name: 'G perms', description: 'A corner and edge cycle. One pair of headlights.' },
];

const c = (
  id: string,
  name: string,
  group: string,
  algorithms: AlgorithmCase['algorithms'],
  recognition?: string,
): AlgorithmCase => ({ id: `pll.${id}`, set: 'pll', name, group, algorithms, recognition });

export const PLL_CASES: AlgorithmCase[] = [
  c(
    'ua',
    'Ua',
    'Edges only',
    ["M2 U M U2 M' U M2", "R U' R U R U R U' R' U' R2"],
    'One side is fully solved and the other three edges cycle. The solved side goes at the back.',
  ),
  c(
    'ub',
    'Ub',
    'Edges only',
    ["M2 U' M U2 M' U' M2", "R2 U R U R' U' R' U' R' U R'"],
    'One side is fully solved and the other three edges cycle. The solved side goes at the back.',
  ),
  c(
    'h',
    'H',
    'Edges only',
    ['M2 U M2 U2 M2 U M2'],
    'Opposite edges swap: every side shows the opposite colour in the middle.',
  ),
  c(
    'z',
    'Z',
    'Edges only',
    ["M' U M2 U M2 U M' U2 M2"],
    'Neighbouring edges swap in pairs: two sides show the colour of the side next to them.',
  ),
  c(
    'aa',
    'Aa',
    'Corners only',
    ["x R' U R' D2 R U' R' D2 R2 x'"],
    'Corners only: one side shows headlights and the edges are all solved.',
  ),
  c(
    'ab',
    'Ab',
    'Corners only',
    ["x R2 D2 R U R' D2 R U' R x'"],
    'Corners only: one side shows headlights and the edges are all solved.',
  ),
  c(
    'e',
    'E',
    'Corners only',
    ["x' R U' R' D R U R' D' R U R' D R U' R' D' x"],
    'Two diagonal corner swaps; no headlights on any side.',
  ),
  c('t', 'T', 'Adjacent swap', ["R U R' U' R' F R2 U' R' U' R U R' F'"]),
  c('f', 'F', 'Adjacent swap', ["R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R"]),
  c('ja', 'Ja', 'Adjacent swap', ["x R2 F R F' R U2 r' U r U2 x'", "R' U L' U2 R U' R' U2 R L U'"]),
  c('jb', 'Jb', 'Adjacent swap', ["R U R' F' R U R' U' R' F R2 U' R'"]),
  c('ra', 'Ra', 'Adjacent swap', ["R U' R' U' R U R D R' U' R D' R' U2 R'"]),
  c('rb', 'Rb', 'Adjacent swap', ["R2 F R U R U' R' F' R U2 R' U2 R"]),
  c(
    'v',
    'V',
    'Diagonal swap',
    ["R' U R' U' y R' F' R2 U' R' U R' F R F"],
    'No headlights; a 2x2 block sits in one corner.',
  ),
  c(
    'y',
    'Y',
    'Diagonal swap',
    ["F R U' R' U' R U R' F' R U R' U' R' F R F'"],
    'No headlights; two 1x2 blocks meet at one corner.',
  ),
  c(
    'na',
    'Na',
    'Diagonal swap',
    ["R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'"],
    'Every side shows the same zigzag pattern: two 1x2 blocks and no headlights.',
  ),
  c(
    'nb',
    'Nb',
    'Diagonal swap',
    ["R' U R U' R' F' U' F R U R' F R' F' R U' R"],
    'Every side shows the same zigzag pattern: two 1x2 blocks and no headlights.',
  ),
  c('ga', 'Ga', 'G perms', ["R2 U R' U R' U' R U' R2 U' D R' U R D'"]),
  c('gb', 'Gb', 'G perms', ["R' U' R U D' R2 U R' U R U' R U' R2 D"]),
  c('gc', 'Gc', 'G perms', ["R2 U' R U' R U R' U R2 U D' R U' R' D"]),
  c('gd', 'Gd', 'G perms', ["R U R' U' D R2 U' R U' R' U R' U R2 D'"]),
];
