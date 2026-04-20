import type { GraphAlgorithm } from './types';
import { neighbor } from '../lib/graph';

const topoDfs: GraphAlgorithm = {
  meta: {
    id: 'topoDfs',
    name: 'Topological Sort (DFS)',
    category: 'advanced',
    description: 'DFS-based topological sort: nodes are emitted in reverse post-order. Works on DAGs only.',
    requiresDirected: true,
    requiresDAG: true,
    complexity: {
      time: { best: 'O(V+E)', average: 'O(V+E)', worst: 'O(V+E)' },
      space: 'O(V)',
    },
    stats: ['emitted', 'visited', 'considered'],
  },
  *run(graph, _options = {}) {
    const { nodes, edges, adj } = graph;
    const V = nodes.length;
    const color: ('white' | 'gray' | 'black')[] = new Array(V).fill('white');
    const topoOrder: number[] = [];

    function* visit(u: number): Generator<import('./types').GraphEvent> {
      color[u] = 'gray';
      yield { type: 'visit-node', node: u };
      yield { type: 'push-stack', node: u };

      for (const eid of adj[u]) {
        const e = edges[eid];
        const v = neighbor(e, u);
        yield { type: 'consider-edge', edge: eid };
        if (color[v] === 'white') yield* visit(v);
      }

      color[u] = 'black';
      topoOrder.unshift(u);
      yield { type: 'finish-node', node: u };
      yield { type: 'pop-stack', node: u };
    }

    for (let u = 0; u < V; u++) {
      if (color[u] === 'white') yield* visit(u);
    }

    for (let i = 0; i < topoOrder.length; i++) {
      yield { type: 'topo-emit', node: topoOrder[i], order: i };
    }

    yield { type: 'mark-done' };
  },
};

export default topoDfs;
