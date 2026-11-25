import type { Course } from './types';

/**
 * The beginner course: the layer-by-layer method, white cross first, yellow on top.
 * Every algorithm and diagram here is checked by tests in __tests__, including a
 * simulation of each step's instructions on the cube model.
 */
export const BEGINNER_COURSE: Course = {
  id: 'beginner',
  title: 'Beginner course',
  description:
    'Learn to solve the cube from scratch, one layer at a time. No experience needed: you will learn seven short move sequences, one step at a time.',
  lessons: [
    {
      id: 'beginner.meet',
      title: 'Meet the cube',
      summary: 'The three kinds of pieces, and why the centres matter.',
      minutes: 3,
      steps: [
        {
          title: 'Centres never move',
          blocks: [
            {
              type: 'text',
              text: 'The cube has six centre pieces, one in the middle of each face. They can spin in place, but they never change places with each other.',
            },
            {
              type: 'diagram',
              diagram: { show: 'centers' },
              caption: 'The centres, coloured. Everything else is grey.',
            },
            {
              type: 'text',
              text: "So the centre tells you the colour of its face. A face with a green centre is the green face, even when it's scrambled.",
            },
            {
              type: 'tip',
              text: 'Opposite colours are always the same: white opposite yellow, green opposite blue, red opposite orange.',
            },
          ],
        },
        {
          title: 'Edges and corners',
          blocks: [
            {
              type: 'text',
              text: 'Edges sit between two centres and have two colours. There are 12 of them.',
            },
            { type: 'diagram', diagram: { show: 'edges' }, caption: 'The edges.' },
            {
              type: 'text',
              text: 'Corners have three colours. There are 8 of them.',
            },
            { type: 'diagram', diagram: { show: 'corners' }, caption: 'The corners.' },
            {
              type: 'tip',
              text: "You never solve stickers, you solve pieces. An edge can't become a corner, and a white-red edge always stays a white-red edge.",
            },
          ],
        },
      ],
      practice: [
        {
          question: 'How many edge pieces does a 3x3 cube have?',
          options: ['8', '12', '6', '24'],
          answer: 1,
          explanation:
            'Edges have two colours and there are 12 of them. The 8 pieces with three colours are corners.',
        },
        {
          question: 'Which colour is opposite white?',
          options: ['Green', 'Red', 'Yellow', 'Blue'],
          answer: 2,
          explanation: 'White and yellow are always opposite each other.',
        },
        {
          question: 'Can two centre pieces swap places?',
          options: ['Yes, with the right moves', 'No, never'],
          answer: 1,
          explanation:
            'Centres only spin in place, so each centre always shows which colour its face should be.',
        },
        {
          question: 'Which pieces are coloured in this picture?',
          diagram: { show: 'corners' },
          options: ['Corners', 'Edges', 'Centres'],
          answer: 0,
          explanation: 'Each coloured piece shows three colours at a corner of the cube.',
        },
      ],
    },
    {
      id: 'beginner.notation',
      title: 'Reading moves',
      summary: 'The letters R, L, U, D, F and B, and what the extra marks mean.',
      minutes: 4,
      steps: [
        {
          title: 'One letter per face',
          blocks: [
            {
              type: 'text',
              text: 'Each face has a letter: R (right), L (left), U (up, the top), D (down, the bottom), F (front, facing you) and B (back).',
            },
            {
              type: 'diagram',
              diagram: { setup: 'R', highlightMove: 'R' },
              caption: 'R: the right face turned once.',
            },
            {
              type: 'text',
              text: 'A letter on its own means a quarter turn clockwise, as if you were looking straight at that face.',
            },
            {
              type: 'tip',
              text: 'For R, the front of the right face moves up. For L it moves down, because you look at the left face from the other side.',
            },
          ],
        },
        {
          title: 'Primes and twos',
          blocks: [
            {
              type: 'text',
              text: 'A mark after the letter (R\', said "R prime") means counter-clockwise. A 2 (R2) means a half turn; the direction doesn\'t matter.',
            },
            {
              type: 'diagram',
              diagram: { setup: "U'", highlightMove: 'U' },
              caption: "U': the top turned counter-clockwise.",
            },
            {
              type: 'diagram',
              diagram: { setup: 'F2', highlightMove: 'F' },
              caption: 'F2: the front turned twice.',
            },
            {
              type: 'text',
              text: "A sequence like R U R' U' is read left to right: right face clockwise, top clockwise, right face back, top back.",
            },
            {
              type: 'tip',
              text: 'Keep the same side facing you through a whole sequence. Turning the whole cube by accident is the most common beginner mistake.',
            },
          ],
        },
      ],
      practice: [
        {
          question: "What does R' mean?",
          options: [
            'Right face clockwise',
            'Right face counter-clockwise',
            'Right face twice',
            'Turn the whole cube right',
          ],
          answer: 1,
          explanation: "The prime mark ' means counter-clockwise, looking at that face.",
        },
        {
          question: 'Which face is U?',
          options: ['The bottom', 'The top', 'The face towards you', 'The back'],
          answer: 1,
          explanation: 'U is up, the top face. D is down, the bottom face.',
        },
        {
          question: 'Which move made this?',
          diagram: { setup: 'F', highlightMove: 'F' },
          options: ['F', 'R', 'U', 'F2'],
          answer: 0,
          explanation: 'Only the front layer moved, by a quarter turn: that is F.',
        },
        {
          question: "Is U2 the same as U' U'?",
          options: ['Yes', 'No'],
          answer: 0,
          explanation: 'Two quarter turns either way make a half turn.',
        },
      ],
    },
    {
      id: 'beginner.layers',
      title: 'The plan: three layers',
      summary: 'How the method builds the cube up from the bottom.',
      minutes: 2,
      steps: [
        {
          title: 'Bottom, middle, top',
          blocks: [
            {
              type: 'text',
              text: 'Think of the cube as three layers stacked on top of each other. We solve them in order, from the bottom up, without breaking what is already done.',
            },
            {
              type: 'diagram',
              diagram: { setup: 'x2', show: 'first-layer' },
              caption: 'Layer 1, the white layer (shown upside down so you can see it).',
            },
            {
              type: 'diagram',
              diagram: { show: 'f2l' },
              caption: 'Layers 1 and 2 done: only the yellow top is left.',
            },
          ],
        },
        {
          title: 'The eight steps',
          blocks: [
            {
              type: 'text',
              text: 'White layer: 1. the daisy, 2. the white cross, 3. the white corners. Middle layer: 4. the middle edges. Yellow layer: 5. the yellow cross, 6. the yellow face, 7. the yellow corners, 8. the last edges.',
            },
            {
              type: 'tip',
              text: 'Hold the cube with yellow on top and white at the bottom for the whole solve. You only turn it over to check the white cross.',
            },
          ],
        },
      ],
      practice: [
        {
          question: 'Which layer do we solve first?',
          options: ['The yellow top layer', 'The middle layer', 'The white bottom layer'],
          answer: 2,
          explanation: 'We build up from the white layer, then the middle, then yellow.',
        },
        {
          question: 'During the solve, where is the yellow face?',
          options: ['On top', 'At the bottom', 'Facing you'],
          answer: 0,
          explanation: 'Yellow stays on top and white at the bottom.',
        },
      ],
    },
    {
      id: 'beginner.daisy',
      title: 'Step 1: The daisy',
      summary: 'Gather the four white edges around the yellow centre.',
      minutes: 5,
      steps: [
        {
          title: 'The goal',
          blocks: [
            {
              type: 'text',
              text: 'Hold the cube with the yellow centre on top. Move the four edges that have white on them up next to it, with white facing up. It looks like a flower: the daisy.',
            },
            {
              type: 'diagram',
              diagram: { setup: 'F2 R2 B2 L2', show: 'cross' },
              caption: 'A finished daisy: four white petals around the yellow centre.',
            },
          ],
        },
        {
          title: 'Bringing petals up',
          blocks: [
            {
              type: 'text',
              text: 'Find a white edge. If it is in the bottom layer with white facing down, turn the top so the spot above it has no white petal, then turn that side twice to bring it up.',
            },
            {
              type: 'text',
              text: 'If it is in the middle layer, turn the top until the spot it will move into is free, then turn that side once to lift it up with white facing up.',
            },
            {
              type: 'tip',
              text: 'Before lifting a new petal, always turn the top so you don’t knock an existing petal back down.',
            },
            {
              type: 'tip',
              text: 'This step is solved by feel, not by a sequence. It gets quick with practice.',
            },
          ],
        },
      ],
      practice: [
        {
          question: 'Which centre do the white petals go around?',
          options: ['White', 'Yellow', 'Green'],
          answer: 1,
          explanation: 'The daisy is built around the yellow centre, with white facing up.',
        },
        {
          question:
            'A white edge is in the bottom layer, white facing down. How do you bring it up?',
          options: ['Turn that side twice', 'Turn the bottom once', 'Turn the whole cube over'],
          answer: 0,
          explanation:
            'A half turn of that side lifts it straight up. Check the spot above is free first.',
        },
      ],
    },
    {
      id: 'beginner.cross',
      title: 'Step 2: The white cross',
      summary: 'Send each petal down to its matching centre.',
      minutes: 4,
      steps: [
        {
          title: 'Match, then turn twice',
          blocks: [
            {
              type: 'text',
              text: 'Look at the side colour of one petal. Turn the top until that colour sits above the centre of the same colour. Then turn that side twice: the edge goes down with white at the bottom.',
            },
            {
              type: 'diagram',
              diagram: { setup: 'F2', show: 'cross' },
              caption: 'The green petal is above the green centre. Turn F twice to send it down.',
            },
            { type: 'text', text: 'Do the same for the other three petals.' },
          ],
        },
        {
          title: 'Check your cross',
          blocks: [
            {
              type: 'diagram',
              diagram: { setup: 'x2', show: 'cross' },
              caption:
                'The bottom, turned up to look at: a white cross, each arm matching its side centre.',
            },
            {
              type: 'tip',
              text: "A white cross whose arms don't match the side centres won't work later. Matching the centre before turning twice prevents that.",
            },
          ],
        },
      ],
      practice: [
        {
          question: 'Before sending a petal down, what must line up?',
          options: [
            "Its side colour with that side's centre",
            'Its white sticker with the white centre',
            'Nothing, just turn twice',
          ],
          answer: 0,
          explanation: 'Match the side colour to its centre first, then turn that face twice.',
        },
        {
          question: 'The petal is lined up above the front centre. Which move sends it down?',
          options: ['F', 'F2', 'U2', "F'"],
          answer: 1,
          explanation: 'A half turn of the front, F2, takes the edge from the top to the bottom.',
        },
      ],
    },
    {
      id: 'beginner.corners',
      title: 'Step 3: The white corners',
      summary: 'Finish the white layer with one short sequence.',
      minutes: 6,
      steps: [
        {
          title: 'Find a white corner on top',
          blocks: [
            {
              type: 'text',
              text: 'Keep white at the bottom. Find a corner in the top layer that has white on it. Its other two colours tell you where it belongs: between those two centres.',
            },
            {
              type: 'text',
              text: 'Turn the top until the corner is right above that spot. Then turn the whole cube so that spot is at the front right.',
            },
            {
              type: 'diagram',
              diagram: { setup: "R U R' U'", show: 'first-layer' },
              caption: 'The white corner is above its spot at the front right.',
            },
          ],
        },
        {
          title: 'Repeat until it drops in',
          blocks: [
            { type: 'algorithm', name: 'The sequence', moves: "R U R' U'" },
            {
              type: 'text',
              text: 'Do this sequence, then look at the corner. Repeat until the corner is in the bottom with white facing down. It never takes more than five times.',
            },
            {
              type: 'tip',
              text: 'A white corner already in the bottom but in the wrong spot or twisted: hold it at the front right and do the sequence once. It comes up to the top, and you can place it properly.',
            },
          ],
        },
      ],
      practice: [
        {
          question: 'Where do you hold the corner before repeating the sequence?',
          options: ['Above its spot, at the front right', 'At the back left', 'Anywhere on top'],
          answer: 0,
          explanation:
            'Put it right above where it belongs, then turn the cube so that is the front right.',
        },
        {
          question: "How many times can you need R U R' U' for one corner?",
          options: ['Once', 'Up to 5 times', 'Up to 20 times'],
          answer: 1,
          explanation:
            "Doing R U R' U' six times brings the cube back to where it started, so a corner is always in after at most five.",
        },
      ],
    },
    {
      id: 'beginner.middle',
      title: 'Step 4: Middle layer edges',
      summary: 'Slot the four middle edges in from the top.',
      minutes: 7,
      steps: [
        {
          title: 'Line the edge up',
          blocks: [
            {
              type: 'text',
              text: 'Find an edge in the top layer with no yellow on it. Turn the top until its front colour matches the front centre. Now look at its top colour: it tells you whether the edge goes right or left.',
            },
          ],
        },
        {
          title: 'Going right',
          blocks: [
            {
              type: 'diagram',
              diagram: { solvedBy: "U R U' R' U' F' U F", show: 'f2l' },
              caption: 'Front colour matches the front. Top colour matches the right centre.',
            },
            {
              type: 'algorithm',
              name: 'Edge to the right',
              moves: "U R U' R' U' F' U F",
            },
          ],
        },
        {
          title: 'Going left',
          blocks: [
            {
              type: 'diagram',
              diagram: { solvedBy: "U' L' U L U F U' F'", show: 'f2l' },
              caption: 'Front colour matches the front. Top colour matches the left centre.',
            },
            {
              type: 'algorithm',
              name: 'Edge to the left',
              moves: "U' L' U L U F U' F'",
            },
            {
              type: 'tip',
              text: 'An edge stuck in the middle layer in the wrong place or flipped: do either sequence with it at that spot. It comes out to the top, then insert it properly.',
            },
          ],
        },
      ],
      practice: [
        {
          question: 'The edge’s top colour matches the right centre. Which sequence?',
          options: ["U R U' R' U' F' U F", "U' L' U L U F U' F'"],
          answer: 0,
          explanation: 'The top colour shows where the edge goes: right centre, so it goes right.',
        },
        {
          question: 'Which edges belong in the middle layer?',
          options: ['Edges with yellow', 'Edges without yellow or white', 'Edges with white'],
          answer: 1,
          explanation:
            'White edges are in the cross and yellow edges belong on top. The other four go in the middle.',
        },
      ],
    },
    {
      id: 'beginner.yellow-cross',
      title: 'Step 5: The yellow cross',
      summary: 'Make a yellow cross on top with one sequence.',
      minutes: 5,
      steps: [
        {
          title: 'Three possible shapes',
          blocks: [
            {
              type: 'text',
              text: 'Look only at the yellow edges on top (ignore the corners). You will see a dot, an L or a line, or the cross is already there.',
            },
            { type: 'algorithm', name: 'Yellow cross', moves: "F R U R' U' F'" },
          ],
        },
        {
          title: 'Dot, L, line',
          blocks: [
            {
              type: 'diagram',
              diagram: { solvedBy: "F R U R' U' F' U2 F U R U' R' F'", view: 'top-oll' },
              caption: 'Dot: do the sequence once. You get an L.',
            },
            {
              type: 'diagram',
              diagram: { solvedBy: "F U R U' R' F'", view: 'top-oll' },
              caption:
                'L: hold it at the back left, like this, and do the sequence. You get a line.',
            },
            {
              type: 'diagram',
              diagram: { solvedBy: "F R U R' U' F'", view: 'top-oll' },
              caption: 'Line: hold it left to right and do the sequence. You get the cross.',
            },
          ],
        },
      ],
      practice: [
        {
          question: 'You have an L. Where should it point before the sequence?',
          options: ['Back and left', 'Front and right', 'It doesn’t matter'],
          answer: 0,
          explanation: 'Hold the L at the back left. Then one sequence makes a line.',
        },
        {
          question: 'Which shape needs the most sequences?',
          options: ['Line', 'L', 'Dot'],
          answer: 2,
          explanation: 'Dot to L, L to line, line to cross: three times.',
        },
      ],
    },
    {
      id: 'beginner.yellow-face',
      title: 'Step 6: The yellow face',
      summary: 'Turn every yellow corner to face up.',
      minutes: 6,
      steps: [
        {
          title: 'The sequence',
          blocks: [
            { type: 'algorithm', name: 'Yellow face', moves: "R U R' U R U2 R'" },
            {
              type: 'text',
              text: 'Repeat the sequence, holding the cube the right way each time, until the whole top is yellow.',
            },
          ],
        },
        {
          title: 'How to hold it',
          blocks: [
            {
              type: 'diagram',
              diagram: { solvedBy: "R U R' U R U2 R'", view: 'top-oll' },
              caption: 'One yellow corner on top: put it at the front left.',
            },
            {
              type: 'text',
              text: 'No yellow corners on top: turn the top until the front-left corner has its yellow facing left.',
            },
            {
              type: 'text',
              text: 'Two yellow corners on top: turn the top until the front-left corner has its yellow facing you.',
            },
            {
              type: 'tip',
              text: 'Count yellow corners again after every sequence, then hold the cube for that case.',
            },
          ],
        },
      ],
      practice: [
        {
          question: 'One corner on top is yellow. Where do you put it?',
          options: ['Front left', 'Front right', 'Back right'],
          answer: 0,
          explanation: 'Put the one yellow corner at the front left, then do the sequence.',
        },
        {
          question: 'No corners are yellow on top. What do you look for?',
          options: [
            'Yellow facing left on the front-left corner',
            'Yellow facing you on the front-right corner',
            'Nothing, any way works',
          ],
          answer: 0,
          explanation: 'Turn the top until the front-left corner shows yellow on its left side.',
        },
      ],
    },
    {
      id: 'beginner.yellow-corners',
      title: 'Step 7: Place the yellow corners',
      summary: 'Move the top corners to their right places.',
      minutes: 6,
      steps: [
        {
          title: 'Look for headlights',
          blocks: [
            {
              type: 'text',
              text: 'Look at the sides of the top layer. Two corners on one side with the same colour are called headlights.',
            },
            {
              type: 'diagram',
              diagram: { solvedBy: "R' F R' B2 R F' R' B2 R2", view: 'top' },
              caption: 'Headlights at the back: both back corners show the same colour.',
            },
          ],
        },
        {
          title: 'Headlights to the back',
          blocks: [
            {
              type: 'text',
              text: 'Turn the top to put the headlights at the back, then do the sequence. Turn the top until the corners match their sides.',
            },
            {
              type: 'algorithm',
              name: 'Corners',
              moves: "R' F R' B2 R F' R' B2 R2",
              note: 'B2 turns the back face twice.',
            },
            {
              type: 'text',
              text: 'No headlights anywhere: do the sequence once from any side. You will then have headlights.',
            },
            {
              type: 'tip',
              text: 'Headlights on every side means the corners are already placed. Just turn the top to line them up.',
            },
          ],
        },
      ],
      practice: [
        {
          question: 'What are headlights?',
          options: [
            'Two corners on one side with the same colour',
            'Two yellow edges next to each other',
            'A solved middle layer',
          ],
          answer: 0,
          explanation:
            'Two matching corner stickers on the same side look like a pair of headlights.',
        },
        {
          question: 'Where do the headlights go before the sequence?',
          options: ['At the back', 'At the front', 'On the right'],
          answer: 0,
          explanation: 'Put them at the back, then do the sequence.',
        },
      ],
    },
    {
      id: 'beginner.last-edges',
      title: 'Step 8: Finish the cube',
      summary: 'Cycle the last edges and solve it.',
      minutes: 5,
      steps: [
        {
          title: 'The solved side goes at the back',
          blocks: [
            {
              type: 'text',
              text: 'With the corners placed, look for a side whose top row is all one colour. Put that side at the back.',
            },
            {
              type: 'diagram',
              diagram: { solvedBy: "R U' R U R U R U' R' U' R2", view: 'top' },
              caption: 'The back is finished. The other three edges need to swap round.',
            },
            { type: 'algorithm', name: 'Last edges', moves: "R U' R U R U R U' R' U' R2" },
            {
              type: 'text',
              text: 'Not solved yet? Do it once more with the solved side still at the back.',
            },
          ],
        },
        {
          title: 'No finished side',
          blocks: [
            {
              type: 'text',
              text: 'If no side is finished, do the sequence once from anywhere. Then one side will be finished.',
            },
            {
              type: 'tip',
              text: 'Congratulations: you can solve the cube. Time a few solves on the Timer tab, then try the F2L, OLL and PLL sets when you want to get faster.',
            },
          ],
        },
      ],
      practice: [
        {
          question: 'Where does the finished side go?',
          options: ['At the back', 'At the front', 'On top'],
          answer: 0,
          explanation: 'Keep the finished side at the back for the sequence.',
        },
        {
          question: 'No side is finished. What do you do?',
          options: [
            'Do the sequence once from anywhere',
            'Start over from the cross',
            'Turn the middle layer',
          ],
          answer: 0,
          explanation: 'One sequence from any side always gives you a finished side.',
        },
      ],
    },
  ],
};
