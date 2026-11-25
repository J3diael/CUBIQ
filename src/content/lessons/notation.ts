import type { MoveFamily } from '@/lib/cube/notation';

export interface NotationEntry {
  /** The move as written, e.g. "R'". Parsed by the cube model in tests. */
  move: string;
  /** The layer to highlight in the picture. */
  layer: MoveFamily;
  name: string;
  description: string;
}

export interface NotationGroup {
  title: string;
  intro: string;
  entries: readonly NotationEntry[];
}

/** The notation guide: every kind of move CUBIQ's algorithms use. */
export const NOTATION_GUIDE: readonly NotationGroup[] = [
  {
    title: 'Face turns',
    intro:
      'A letter alone is a quarter turn clockwise, as if you were looking straight at that face.',
    entries: [
      {
        move: 'R',
        layer: 'R',
        name: 'Right',
        description: 'The right face. Its front edge moves up.',
      },
      {
        move: 'L',
        layer: 'L',
        name: 'Left',
        description: 'The left face. Its front edge moves down.',
      },
      {
        move: 'U',
        layer: 'U',
        name: 'Up',
        description: 'The top face. Its front edge moves left.',
      },
      {
        move: 'D',
        layer: 'D',
        name: 'Down',
        description: 'The bottom face. Its front edge moves right.',
      },
      {
        move: 'F',
        layer: 'F',
        name: 'Front',
        description: 'The face towards you. Its top edge moves right.',
      },
      {
        move: 'B',
        layer: 'B',
        name: 'Back',
        description: 'The back face. Its top edge moves left, seen from the front.',
      },
    ],
  },
  {
    title: 'Primes and doubles',
    intro: "A ' (prime) reverses the direction. A 2 is a half turn.",
    entries: [
      {
        move: "R'",
        layer: 'R',
        name: 'R prime',
        description: 'Right face counter-clockwise: its front edge moves down.',
      },
      {
        move: 'R2',
        layer: 'R',
        name: 'R two',
        description: 'Right face half turn. Either direction gives the same result.',
      },
      {
        move: "U'",
        layer: 'U',
        name: 'U prime',
        description: 'Top face counter-clockwise: its front edge moves right.',
      },
    ],
  },
  {
    title: 'Wide turns',
    intro:
      'A lowercase letter (or w, as in Rw) turns the face and the middle layer next to it together.',
    entries: [
      {
        move: 'r',
        layer: 'Rw',
        name: 'Wide right',
        description: 'Right face plus the middle layer, in the direction of R.',
      },
      {
        move: 'u',
        layer: 'Uw',
        name: 'Wide up',
        description: 'Top face plus the middle layer, in the direction of U.',
      },
      {
        move: 'f',
        layer: 'Fw',
        name: 'Wide front',
        description: 'Front face plus the middle layer, in the direction of F.',
      },
    ],
  },
  {
    title: 'Middle slices',
    intro: 'These turn only a middle layer.',
    entries: [
      {
        move: 'M',
        layer: 'M',
        name: 'Middle',
        description: 'The layer between L and R, in the direction of L: its front moves down.',
      },
      {
        move: 'E',
        layer: 'E',
        name: 'Equator',
        description: 'The layer between U and D, in the direction of D: its front moves right.',
      },
      {
        move: 'S',
        layer: 'S',
        name: 'Standing',
        description: 'The layer between F and B, in the direction of F: its top moves right.',
      },
    ],
  },
  {
    title: 'Whole-cube rotations',
    intro:
      "These turn the whole cube in your hands. Nothing is solved or unsolved; you're just holding it differently.",
    entries: [
      {
        move: 'x',
        layer: 'x',
        name: 'x',
        description: 'Turn the whole cube like R: the front goes to the top.',
      },
      {
        move: 'y',
        layer: 'y',
        name: 'y',
        description: 'Turn the whole cube like U: the front goes to the left.',
      },
      {
        move: 'z',
        layer: 'z',
        name: 'z',
        description: 'Turn the whole cube like F: the top goes to the right.',
      },
    ],
  },
];
