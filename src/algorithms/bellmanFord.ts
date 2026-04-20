import type { GraphAlgorithm } from './types';
const bellmanFord: GraphAlgorithm = {
  meta: {
    id: 'bellmanFord',
    name: 'Bellman-Ford',
    category: 'shortest-path',
    description: 'Shortest-path algorithm that handles negative edge weights and detects negative cycles.',
    requiresWeighted: true,
    requiresDirected: true,
    allowsNegativeWeights: true,
    complexity: {
      time: { best: 'O(E)', average: 'O(VE)', worst: 'O(VE)' },
      space: 'O(V)',
    },
    stats: ['relaxed', 'considered', 'passes'],
  },
  *run(graph, options = {}) {
    const source = options.source ?? 0;
    const { nodes, edges } = graph;
    const V = nodes.length;
    const INF = Infinity;
    const dist: number[] = new Array(V).fill(INF);
    const parent: (number | null)[] = new Array(V).fill(null);

    dist[source] = 0;
    yield { type: 'highlight-nodes', nodes: [source], role: 'source' };
    yield { type: 'set-dist', node: source, dist: 0, oldDist: null };

    for (let pass = 1; pass < V; pass++) {
      let updated = false;
      for (const e of edges) {
        yield { type: 'consider-edge', edge: e.id };
        if (dist[e.u] === INF) continue;
        const newDist = dist[e.u] + e.weight;
        if (newDist < dist[e.v]) {
          const oldDist = dist[e.v] === INF ? null : dist[e.v];
          const oldParent = parent[e.v];
          dist[e.v] = newDist;
          parent[e.v] = e.u;
          updated = true;
          yield { type: 'relax-edge', edge: e.id, to: e.v, newDist, oldDist };
          yield { type: 'set-dist', node: e.v, dist: newDist, oldDist };
          yield { type: 'set-parent', node: e.v, parent: e.u, oldParent };
        }
      }
      if (!updated) break;
    }

    // Detect negative cycle
    const negCycleEdges: number[] = [];
    for (const e of edges) {
      if (dist[e.u] !== INF && dist[e.u] + e.weight < dist[e.v]) {
        negCycleEdges.push(e.id);
      }
    }
    if (negCycleEdges.length > 0) {
      yield { type: 'highlight-edges', edges: negCycleEdges, role: 'cut' };
    }

    yield { type: 'mark-done' };
  },
};

export default bellmanFord;
