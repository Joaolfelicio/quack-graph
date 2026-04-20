import { makeGraph, buildAdj } from './graph';
import type { Graph, Node, Edge } from './graph';
import { autoLayout, applyLayout, mulberry32 } from './layout';

// ---------------------------------------------------------------------------
// Preset graphs
// ---------------------------------------------------------------------------

function nodes(coords: [number, number][]): Node[] {
  return coords.map(([x, y], id) => ({ id, x, y }));
}
function edges(defs: [number, number, number?, number?][]): Edge[] {
  return defs.map(([u, v, w = 1, cap], id) => ({ id, u, v, weight: w, capacity: cap }));
}

const PRESETS: Record<string, () => Graph> = {
  'tree-8': () =>
    makeGraph(
      nodes([
        [400, 60],
        [220, 170], [580, 170],
        [120, 290], [310, 290], [480, 290], [660, 290],
        [60, 410],
      ]),
      edges([[0,1],[0,2],[1,3],[1,4],[2,5],[2,6],[3,7]]),
      false, false,
    ),

  'dag-10': () =>
    makeGraph(
      nodes([
        [100, 120], [100, 300],
        [270, 60], [270, 210], [270, 380],
        [430, 120], [430, 300],
        [590, 60], [590, 210],
        [590, 380],
      ]),
      edges([
        [0,2],[0,3],[1,3],[1,4],
        [2,5],[2,7],[3,5],[3,6],[4,6],
        [5,7],[5,8],[6,8],[6,9],[7,9],
      ]),
      true, false,
    ),

  'weighted-mesh-9': () =>
    makeGraph(
      nodes([
        [110, 120], [320, 60], [530, 120],
        [110, 300], [320, 260], [530, 300],
        [150, 450], [320, 480], [500, 450],
      ]),
      edges([
        [0,1,4],[0,3,2],[1,2,5],[1,4,3],[2,5,6],
        [3,4,1],[3,6,7],[4,5,2],[4,7,4],[5,8,5],
        [6,7,3],[7,8,6],
      ]),
      false, true,
    ),

  'neg-cycle-6': () =>
    makeGraph(
      nodes([
        [200, 80], [440, 80],
        [100, 260], [340, 260], [560, 260],
        [320, 420],
      ]),
      edges([
        [0,1,5],[0,2,4],[1,3,3],[2,3,2],[2,5,6],
        [3,4,7],[3,5,-3],[4,5,1],[5,3,-1],
      ]),
      true, true,
    ),

  'grid-4x4': () => {
    const ns: Node[] = [];
    const es: Edge[] = [];
    const W = 4, cellSize = 120, offX = 80, offY = 60;
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        ns.push({ id: r * W + c, x: offX + c * cellSize, y: offY + r * cellSize });
    let eid = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (c < 3) es.push({ id: eid++, u: r*W+c, v: r*W+c+1, weight: 1 });
        if (r < 3) es.push({ id: eid++, u: r*W+c, v: (r+1)*W+c, weight: 1 });
      }
    }
    return makeGraph(ns, es, false, true);
  },

  'scc-8': () =>
    makeGraph(
      nodes([
        [130, 100], [310, 60], [490, 120],
        [130, 280], [310, 260],
        [490, 300], [650, 200],
        [650, 400],
      ]),
      edges([
        [0,1],[1,2],[2,0],
        [1,3],[3,4],[4,1],
        [2,5],[5,6],[6,5],
        [6,7],[7,6],
      ]),
      true, false,
    ),

  'flow-net': () =>
    makeGraph(
      nodes([
        [80, 240],
        [240, 100], [240, 380],
        [420, 100], [420, 380],
        [580, 240],
      ]),
      edges([
        [0,1,10,10],[0,2,8,8],
        [1,2,2,2],[1,3,7,7],[1,4,5,5],
        [2,4,6,6],
        [3,5,9,9],[4,5,8,8],
      ]),
      true, true,
    ),

  'disconnected-9': () =>
    makeGraph(
      nodes([
        [120, 140], [290, 80], [290, 200], [430, 140],
        [560, 80], [700, 140], [560, 200],
        [240, 380], [430, 380],
      ]),
      edges([
        [0,1],[0,2],[1,3],[2,3],
        [4,5],[5,6],[4,6],
      ]),
      false, false,
    ),
};

export const PRESET_IDS = Object.keys(PRESETS) as PresetId[];
export type PresetId = keyof typeof PRESETS;

export function getPreset(id: PresetId): Graph {
  return PRESETS[id]();
}

// ---------------------------------------------------------------------------
// Random graph generator
// ---------------------------------------------------------------------------

export interface RandomGraphOptions {
  nodeCount: number;
  density: number;
  weightMin: number;
  weightMax: number;
  directed: boolean;
  allowNegative: boolean;
  weighted: boolean;
  seed: number;
}

export const DEFAULT_RANDOM_OPTIONS: RandomGraphOptions = {
  nodeCount: 10,
  density: 0.4,
  weightMin: 1,
  weightMax: 20,
  directed: false,
  allowNegative: false,
  weighted: true,
  seed: 42,
};

export function generateRandom(opts: Partial<RandomGraphOptions> = {}): Graph {
  const o = { ...DEFAULT_RANDOM_OPTIONS, ...opts };
  const rand = mulberry32(o.seed);
  const n = Math.max(3, Math.min(30, o.nodeCount));

  const rawNodes: Node[] = Array.from({ length: n }, (_, id) => ({ id, x: 0, y: 0 }));
  const rawEdges: Edge[] = [];
  const seen = new Set<string>();
  let eid = 0;

  for (let u = 0; u < n; u++) {
    for (let v = o.directed ? 0 : u + 1; v < n; v++) {
      if (u === v) continue;
      const key = o.directed ? `${u}-${v}` : `${Math.min(u,v)}-${Math.max(u,v)}`;
      if (seen.has(key)) continue;
      if (rand() > o.density) continue;
      seen.add(key);
      const range = o.weightMax - o.weightMin + 1;
      let w = o.weightMin + Math.floor(rand() * range);
      if (o.allowNegative && rand() < 0.2) w = -Math.abs(w);
      rawEdges.push({ id: eid++, u, v, weight: o.weighted ? w : 1 });
    }
  }

  // Ensure connectivity: span a random spanning tree first
  if (!o.directed) {
    const visited = new Set([0]);
    const unvisited = new Set(Array.from({ length: n - 1 }, (_, i) => i + 1));
    while (unvisited.size > 0) {
      const u = [...visited][Math.floor(rand() * visited.size)];
      const v = [...unvisited][Math.floor(rand() * unvisited.size)];
      const key = `${Math.min(u,v)}-${Math.max(u,v)}`;
      if (!seen.has(key)) {
        seen.add(key);
        const w = o.weightMin + Math.floor(rand() * (o.weightMax - o.weightMin + 1));
        rawEdges.push({ id: eid++, u, v, weight: o.weighted ? w : 1 });
      }
      visited.add(v);
      unvisited.delete(v);
    }
  }

  // Compute layout with temp placeholder edges
  const positions = autoLayout(n, rawEdges, o.seed);
  const ns = applyLayout(rawNodes, positions);

  return makeGraph(ns, rawEdges, o.directed, o.weighted);
}

// ---------------------------------------------------------------------------
// Graph type coercion utilities
// ---------------------------------------------------------------------------

export function coerceDirected(g: Graph): Graph {
  if (g.directed) return g;
  const newEdges: Edge[] = [];
  let eid = 0;
  for (const e of g.edges) {
    newEdges.push({ ...e, id: eid++ });
    if (e.u !== e.v) newEdges.push({ id: eid++, u: e.v, v: e.u, weight: e.weight, capacity: e.capacity });
  }
  return { ...g, edges: newEdges, directed: true, adj: buildAdj(g.nodes, newEdges, true) };
}

export function coerceWeighted(g: Graph): Graph {
  if (g.weighted) return g;
  const newEdges = g.edges.map(e => ({ ...e, weight: e.weight === 1 ? 1 : e.weight }));
  return { ...g, edges: newEdges, weighted: true };
}

export function stripNegativeWeights(g: Graph): Graph {
  const newEdges = g.edges.map(e => ({ ...e, weight: Math.max(1, e.weight) }));
  return { ...g, edges: newEdges };
}
