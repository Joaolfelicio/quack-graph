import type { GraphAlgorithm } from './types';
import { neighbor, PriorityQueue } from '../lib/graph';

const prim: GraphAlgorithm = {
  meta: {
    id: 'prim',
    name: "Prim's Algorithm",
    category: 'mst',
    description: 'Builds a Minimum Spanning Tree by greedily adding the cheapest edge connecting the current tree to an unvisited node.',
    requiresWeighted: true,
    complexity: {
      time: { best: 'O(E log V)', average: 'O(E log V)', worst: 'O(E log V)' },
      space: 'O(V)',
    },
    stats: ['mstEdges', 'considered', 'relaxed'],
  },
  *run(graph, options = {}) {
    const source = options.source ?? 0;
    const { nodes, edges, adj } = graph;
    const V = nodes.length;
    const INF = Infinity;
    const key: number[] = new Array(V).fill(INF);
    const parent: (number | null)[] = new Array(V).fill(null);
    const parentEdge: (number | null)[] = new Array(V).fill(null);
    const inMST = new Set<number>();

    key[source] = 0;
    const pq = new PriorityQueue<number>();
    pq.push(0, source);
    yield { type: 'highlight-nodes', nodes: [source], role: 'source' };
    yield { type: 'set-dist', node: source, dist: 0, oldDist: null };

    while (pq.size > 0) {
      const [k, u] = pq.pop()!;
      if (inMST.has(u) || k > key[u]) continue;
      inMST.add(u);

      yield { type: 'dequeue', node: u };
      yield { type: 'visit-node', node: u };

      if (parentEdge[u] !== null) {
        yield { type: 'add-mst', edge: parentEdge[u]! };
      }

      for (const eid of adj[u]) {
        const e = edges[eid];
        const v = neighbor(e, u);
        if (inMST.has(v)) {
          yield { type: 'consider-edge', edge: eid };
          continue;
        }
        yield { type: 'consider-edge', edge: eid };
        if (e.weight < key[v]) {
          const oldDist = key[v] === INF ? null : key[v];
          const oldParent = parent[v];
          key[v] = e.weight;
          parent[v] = u;
          parentEdge[v] = eid;
          yield { type: 'relax-edge', edge: eid, to: v, newDist: e.weight, oldDist };
          yield { type: 'set-dist', node: v, dist: e.weight, oldDist };
          yield { type: 'set-parent', node: v, parent: u, oldParent };
          pq.push(key[v], v);
        }
      }
      yield { type: 'finish-node', node: u };
    }

    yield { type: 'mark-done' };
  },
};

export default prim;
