import type { GraphAlgorithm } from './types';
import { neighbor, PriorityQueue } from '../lib/graph';

function heuristic(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2) / 100;
}

const aStar: GraphAlgorithm = {
  meta: {
    id: 'aStar',
    name: 'A* Search',
    category: 'shortest-path',
    description: 'Guided shortest-path search using a heuristic (Euclidean distance on node coordinates) to prioritize promising paths.',
    requiresWeighted: true,
    complexity: {
      time: { best: 'O(E)', average: 'O((V+E) log V)', worst: 'O((V+E) log V)' },
      space: 'O(V)',
    },
    stats: ['relaxed', 'considered', 'dequeued'],
  },
  *run(graph, options = {}) {
    const source = options.source ?? 0;
    const target = options.target ?? graph.nodes.length - 1;
    const { nodes, edges, adj } = graph;
    const INF = Infinity;
    const gScore: number[] = new Array(nodes.length).fill(INF);
    const fScore: number[] = new Array(nodes.length).fill(INF);
    const parent: (number | null)[] = new Array(nodes.length).fill(null);
    const closed = new Set<number>();

    gScore[source] = 0;
    const h0 = heuristic(nodes[source].x, nodes[source].y, nodes[target].x, nodes[target].y);
    fScore[source] = h0;
    const pq = new PriorityQueue<number>();
    pq.push(fScore[source], source);

    yield { type: 'highlight-nodes', nodes: [source], role: 'source' };
    yield { type: 'highlight-nodes', nodes: [target], role: 'target' };
    yield { type: 'set-dist', node: source, dist: 0, oldDist: null };

    while (pq.size > 0) {
      const [, u] = pq.pop()!;
      if (closed.has(u)) continue;
      closed.add(u);

      yield { type: 'dequeue', node: u };
      yield { type: 'visit-node', node: u };

      if (u === target) break;

      for (const eid of adj[u]) {
        const e = edges[eid];
        const v = neighbor(e, u);
        if (closed.has(v)) continue;
        yield { type: 'consider-edge', edge: eid };
        const tentG = gScore[u] + e.weight;
        if (tentG < gScore[v]) {
          const oldDist = gScore[v] === INF ? null : gScore[v];
          const oldParent = parent[v];
          gScore[v] = tentG;
          parent[v] = u;
          const h = heuristic(nodes[v].x, nodes[v].y, nodes[target].x, nodes[target].y);
          fScore[v] = tentG + h;
          yield { type: 'relax-edge', edge: eid, to: v, newDist: tentG, oldDist };
          yield { type: 'set-dist', node: v, dist: tentG, oldDist };
          yield { type: 'set-parent', node: v, parent: u, oldParent };
          pq.push(fScore[v], v);
        }
      }
      yield { type: 'finish-node', node: u };
    }

    if (gScore[target] < INF) {
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

export default aStar;
