import type { GraphAlgorithm } from './types';
import { neighbor, PriorityQueue } from '../lib/graph';

const dijkstra: GraphAlgorithm = {
  meta: {
    id: 'dijkstra',
    name: "Dijkstra's Algorithm",
    category: 'shortest-path',
    description: 'Greedy shortest-path algorithm for non-negative edge weights using a priority queue.',
    requiresWeighted: true,
    complexity: {
      time: { best: 'O((V+E) log V)', average: 'O((V+E) log V)', worst: 'O((V+E) log V)' },
      space: 'O(V)',
    },
    stats: ['relaxed', 'considered', 'dequeued'],
  },
  *run(graph, options = {}) {
    const source = options.source ?? 0;
    const target = options.target;
    const { nodes, edges, adj } = graph;
    const INF = Infinity;
    const dist: number[] = new Array(nodes.length).fill(INF);
    const parent: (number | null)[] = new Array(nodes.length).fill(null);

    dist[source] = 0;
    const pq = new PriorityQueue<number>();
    pq.push(0, source);

    yield { type: 'highlight-nodes', nodes: [source], role: 'source' };
    yield { type: 'set-dist', node: source, dist: 0, oldDist: null };

    while (pq.size > 0) {
      const [d, u] = pq.pop()!;
      if (d > dist[u]) continue;

      yield { type: 'dequeue', node: u };
      yield { type: 'visit-node', node: u };

      if (u === target) break;

      for (const eid of adj[u]) {
        const e = edges[eid];
        const v = neighbor(e, u);
        yield { type: 'consider-edge', edge: eid };
        const newDist = dist[u] + e.weight;
        if (newDist < dist[v]) {
          const oldDist = dist[v] === INF ? null : dist[v];
          const oldParent = parent[v];
          dist[v] = newDist;
          parent[v] = u;
          yield { type: 'relax-edge', edge: eid, to: v, newDist, oldDist };
          yield { type: 'set-dist', node: v, dist: newDist, oldDist };
          yield { type: 'set-parent', node: v, parent: u, oldParent };
          pq.push(newDist, v);
        }
      }
      yield { type: 'finish-node', node: u };
    }

    if (target !== undefined && dist[target] < INF) {
      const path: number[] = [];
      let cur: number | null = target;
      while (cur !== null) { path.unshift(cur); cur = parent[cur]; }
      yield { type: 'highlight-nodes', nodes: path, role: 'path' };
      const pathEdges: number[] = [];
      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i], v = path[i + 1];
        const eid = adj[u].find(id => neighbor(edges[id], u) === v);
        if (eid !== undefined) pathEdges.push(eid);
      }
      if (pathEdges.length) yield { type: 'highlight-edges', edges: pathEdges, role: 'path' };
    }

    yield { type: 'mark-done' };
  },
};

export default dijkstra;
