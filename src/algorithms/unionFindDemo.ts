import type { GraphAlgorithm } from './types';

const unionFindDemo: GraphAlgorithm = {
  meta: {
    id: 'unionFindDemo',
    name: 'Union-Find',
    category: 'advanced',
    description: 'Demonstrates the Union-Find (Disjoint Set Union) data structure with path compression and union by rank on the graph edges.',
    complexity: {
      time: { best: 'O(α(V))', average: 'O(α(V))', worst: 'O(α(V))' },
      space: 'O(V)',
    },
    stats: ['unions', 'finds', 'components'],
  },
  *run(graph, _options = {}) {
    const { nodes, edges } = graph;
    const V = nodes.length;
    const parent = Array.from({ length: V }, (_, i) => i);
    const rank = new Array(V).fill(0);

    function find(x: number): number {
      while (parent[x] !== x) {
        parent[x] = parent[parent[x]];
        x = parent[x];
      }
      return x;
    }

    // Show initial state: each node is its own component
    for (let i = 0; i < V; i++) {
      yield { type: 'visit-node', node: i };
    }

    for (const e of edges) {
      yield { type: 'consider-edge', edge: e.id };

      const ra = find(e.u);
      yield { type: 'find', node: e.u, root: ra };
      const rb = find(e.v);
      yield { type: 'find', node: e.v, root: rb };

      if (ra !== rb) {
        const oldRootA = ra;
        const oldRootB = rb;
        if (rank[ra] < rank[rb]) parent[ra] = rb;
        else if (rank[ra] > rank[rb]) parent[rb] = ra;
        else { parent[rb] = ra; rank[ra]++; }
        const newRoot = find(e.u);
        yield { type: 'union', a: e.u, b: e.v, root: newRoot, oldRootA, oldRootB };
        yield { type: 'add-mst', edge: e.id };
      } else {
        yield { type: 'reject-edge', edge: e.id, reason: 'cycle' };
      }
    }

    yield { type: 'mark-done' };
  },
};

export default unionFindDemo;
