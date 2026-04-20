import type { GraphAlgorithm } from './types';
import { UnionFind } from '../lib/graph';

const kruskal: GraphAlgorithm = {
  meta: {
    id: 'kruskal',
    name: "Kruskal's Algorithm",
    category: 'mst',
    description: 'Builds a Minimum Spanning Tree by sorting edges by weight and adding each if it does not form a cycle (using Union-Find).',
    requiresWeighted: true,
    complexity: {
      time: { best: 'O(E log E)', average: 'O(E log E)', worst: 'O(E log E)' },
      space: 'O(V)',
    },
    stats: ['mstEdges', 'considered', 'rejected'],
  },
  *run(graph, _options = {}) {
    const { nodes, edges } = graph;
    const sorted = [...edges].sort((a, b) => a.weight - b.weight);
    const uf = new UnionFind(nodes.length);

    for (const e of sorted) {
      yield { type: 'consider-edge', edge: e.id };

      const ra = uf.find(e.u);
      const rb = uf.find(e.v);
      yield { type: 'find', node: e.u, root: ra };
      yield { type: 'find', node: e.v, root: rb };

      if (ra !== rb) {
        const oldRootA = uf.parent[e.u];
        const oldRootB = uf.parent[e.v];
        uf.union(e.u, e.v);
        const newRoot = uf.find(e.u);
        yield { type: 'union', a: e.u, b: e.v, root: newRoot, oldRootA, oldRootB };
        yield { type: 'add-mst', edge: e.id };
      } else {
        yield { type: 'reject-edge', edge: e.id, reason: 'cycle' };
      }
    }

    yield { type: 'mark-done' };
  },
};

export default kruskal;
