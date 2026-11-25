// Finds a short algorithm for each of the 41 F2L cases (front-right slot) with
// R, U and F turns, using IDA* search. Run once: `node scripts/generate-f2l.mjs`.
// Output is pasted into src/content/algorithms/f2l.ts; the Jest suite then checks every
// algorithm with the separate sticker model in src/lib/cube.

// Cubie model (Kociemba order).
// Corners: URF UFL ULB UBR DFR DLF DBL DRB. Edges: UR UF UL UB DR DF DL DB FR FL BL BR.
const MOVES = {
  U: {
    cp: [3, 0, 1, 2, 4, 5, 6, 7],
    co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [3, 0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11],
    eo: Array(12).fill(0),
  },
  R: {
    cp: [4, 1, 2, 0, 7, 5, 6, 3],
    co: [2, 0, 0, 1, 1, 0, 0, 2],
    ep: [8, 1, 2, 3, 11, 5, 6, 7, 4, 9, 10, 0],
    eo: Array(12).fill(0),
  },
  F: {
    cp: [1, 5, 2, 3, 0, 4, 6, 7],
    co: [1, 2, 0, 0, 2, 1, 0, 0],
    ep: [0, 9, 2, 3, 4, 8, 6, 7, 1, 5, 10, 11],
    eo: [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0],
  },
};
const solved = () => ({
  cp: [...Array(8).keys()],
  co: Array(8).fill(0),
  ep: [...Array(12).keys()],
  eo: Array(12).fill(0),
});
function mul(a, b) {
  return {
    cp: b.cp.map((p) => a.cp[p]),
    co: b.cp.map((p, i) => (a.co[p] + b.co[i]) % 3),
    ep: b.ep.map((p) => a.ep[p]),
    eo: b.ep.map((p, i) => (a.eo[p] + b.eo[i]) % 2),
  };
}
const moveList = [];
for (const face of ['U', 'R', 'F']) {
  let m = MOVES[face];
  const names = [face, face + '2', face + "'"];
  for (let k = 0; k < 3; k++) {
    moveList.push({ face, name: names[k], m });
    m = mul(m, MOVES[face]);
  }
}

// Where piece `piece` is and how it's twisted, as a number.
const cornerCoord = (s, piece) => {
  const i = s.cp.indexOf(piece);
  return i * 3 + s.co[i];
};
const edgeCoord = (s, piece) => {
  const i = s.ep.indexOf(piece);
  return i * 2 + s.eo[i];
};

const DFR = 4,
  DLF = 5,
  DRB = 7,
  DF = 5,
  DR = 4,
  FR = 8,
  FL = 9,
  BR = 11;
// The pieces that must end solved. (U-layer pieces may end anywhere.) R, U and F never
// move DL, DB, BL or DBL, so they stay solved without being checked.
const EDGES = [DR, DF, FR, FL, BR];
const CORNERS = [DFR, DLF, DRB];

function bfsTable(coordsOf, size) {
  const table = new Uint8Array(size).fill(255);
  let frontier = [solved()];
  table[coordsOf(frontier[0])] = 0;
  let depth = 0;
  while (frontier.length) {
    const next = [];
    for (const s of frontier) {
      for (const { m } of moveList) {
        const t = mul(s, m);
        const k = coordsOf(t);
        if (table[k] === 255) {
          table[k] = depth + 1;
          next.push(t);
        }
      }
    }
    frontier = next;
    depth++;
  }
  return table;
}
const edgeKey = (s) => EDGES.reduce((k, e) => k * 24 + edgeCoord(s, e), 0);
const cornerKey = (s) =>
  CORNERS.reduce((k, c) => k * 24 + cornerCoord(s, c), 0) * 24 + edgeCoord(s, FR);
console.error('building tables…');
const edgeTable = bfsTable(edgeKey, 24 ** 5);
const cornerTable = bfsTable(cornerKey, 24 ** 4);
const h = (s) => Math.max(edgeTable[edgeKey(s)], cornerTable[cornerKey(s)]);
const isGoal = (s) => h(s) === 0;

function solve(start, maxDepth = 14) {
  const path = [];
  const found = [];
  function search(s, g, bound, lastFace) {
    const f = g + h(s);
    if (f > bound) return f;
    if (isGoal(s)) {
      found.push([...path]);
      return -1;
    }
    let min = Infinity;
    for (const mv of moveList) {
      if (mv.face === lastFace) continue;
      // Solutions never need to start with U: the case is the same after any U turn.
      if (g === 0 && mv.face === 'U') continue;
      path.push(mv.name);
      const r = search(mul(s, mv.m), g + 1, bound, mv.face);
      path.pop();
      if (r === -1) return -1;
      if (r < min) min = r;
    }
    return min;
  }
  for (let bound = h(start); bound <= maxDepth;) {
    const r = search(start, 0, bound, null);
    if (r === -1) return found[0];
    bound = r;
  }
  return null;
}

// Enumerate cases: DFR corner and FR edge placed anywhere in the U layer or their slot.
const cornerSpots = [0, 1, 2, 3, DFR];
const edgeSpots = [0, 1, 2, 3, FR];
function place(cornerPos, cornerOri, edgePos, edgeOri) {
  const s = solved();
  // Swap the DFR corner into cornerPos, the FR edge into edgePos.
  const swap = (arr, i, j) => {
    [arr[i], arr[j]] = [arr[j], arr[i]];
  };
  swap(s.cp, DFR, cornerPos);
  s.co[cornerPos] = cornerOri;
  swap(s.ep, FR, edgePos);
  s.eo[edgePos] = edgeOri;
  return s;
}
const uMove = moveList.find((m) => m.name === 'U').m;
const seen = new Set();
const results = [];
for (const cp of cornerSpots)
  for (let co = 0; co < 3; co++)
    for (const ep of edgeSpots)
      for (let eo = 0; eo < 2; eo++) {
        let s = place(cp, co, ep, eo);
        if (isGoal(s)) continue;
        // Group by U turns; key on the pair's coordinates.
        const u2 = mul(uMove, uMove);
        const variants = [s, mul(s, uMove), mul(s, u2), mul(mul(s, u2), uMove)];
        const keys = variants.map((v) => `${cornerCoord(v, DFR)}-${edgeCoord(v, FR)}`);
        const key = [...keys].sort()[0];
        if (seen.has(key)) continue;
        seen.add(key);
        // Solve every U-turned version and keep the shortest.
        let best = null;
        for (const v of variants) {
          const sol = solve(v);
          if (sol && (!best || sol.length < best.length)) best = sol;
        }
        results.push({
          corner: cp === DFR ? 'slot' : 'top',
          cornerOri: co,
          edge: ep === FR ? 'slot' : 'top',
          edgeOri: eo,
          alg: best.join(' '),
          length: best.length,
        });
        console.error(results.length, best.join(' '));
      }
console.log(JSON.stringify(results, null, 1));
