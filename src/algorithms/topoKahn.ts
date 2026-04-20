import type { GraphAlgorithm } from './types';
import { neighbor } from '../lib/graph';

const topoKahn: GraphAlgorithm = {
  meta: {
    id: 'topoKahn',
    name: 'Topological Sort (Kahn)',
    category: 'advanced',
    description: "Kahn's BFS-based topological sort: repeatedly enqueue nodes with in-degree 0. Detects cycles if not all nodes are emitted.",
    requiresDirected: true,
    requiresDAG: true,
    complexity: {
      time: { best: 'O(V+E)', average: 'O(V+E)', worst: 'O(V+E)' },
      space: 'O(V)',
    },
    stats: ['emitted', 'enqueued', 'considered'],
  },
  *run(graph, _options = {}) {
    const { nodes, edges, adj } = graph;
    const V = nodes.length;
    const inDeg = new Array(V).fill(0);
    for (const e of edges) inDeg[e.v]++;

    const queue: number[] = [];
    for (let u = 0; u < V; u++) {
      if (inDeg[u] === 0) {
        queue.push(u);
        yield { type: 'enqueue', node: u };
      }
    }

    let order = 0;
    while (queue.length > 0) {
      const u = queue.shift()!;
      yield { type: 'dequeue', node: u };
      yield { type: 'visit-node', node: u };
      yield { type: 'topo-emit', node: u, order: order++ };

      for (const eid of adj[u]) {
        const e = edges[eid];
        const v = neighbor(e, u);
        yield { type: 'consider-edge', edge: eid };
        inDeg[v]--;
        if (inDeg[v] === 0) {
          queue.push(v);
          yield { type: 'enqueue', node: v };
        }
      }
      yield { type: 'finish-node', node: u };
    }

    yield { type: 'mark-done' };
  },
};

export default topoKahn;
