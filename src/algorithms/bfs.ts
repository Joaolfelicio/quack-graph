import type { GraphAlgorithm } from './types';
import { neighbor } from '../lib/graph';

const bfs: GraphAlgorithm = {
  meta: {
    id: 'bfs',
    name: 'Breadth-First Search',
    category: 'traversal',
    description: 'Explores nodes level by level using a queue. Finds shortest paths in unweighted graphs.',
    complexity: {
      time: { best: 'O(1)', average: 'O(V+E)', worst: 'O(V+E)' },
      space: 'O(V)',
    },
    stats: ['enqueued', 'visited', 'considered'],
  },
  *run(graph, options = {}) {
    const source = options.source ?? 0;
    const target = options.target;
    const { nodes, edges, adj } = graph;
    const dist: (number | null)[] = new Array(nodes.length).fill(null);
    const parent: (number | null)[] = new Array(nodes.length).fill(null);

    dist[source] = 0;
    const queue: number[] = [source];

    yield { type: 'visit-node', node: source };
    yield { type: 'set-dist', node: source, dist: 0, oldDist: null };
    yield { type: 'highlight-nodes', nodes: [source], role: 'source' };

    while (queue.length > 0) {
      const u = queue.shift()!;
      yield { type: 'dequeue', node: u };
      yield { type: 'visit-node', node: u };

      if (u === target) break;

      for (const eid of adj[u]) {
        const e = edges[eid];
        const v = neighbor(e, u);
        yield { type: 'consider-edge', edge: eid };
        if (dist[v] === null) {
          dist[v] = dist[u]! + 1;
          parent[v] = u;
          yield { type: 'enqueue', node: v, from: u };
          yield { type: 'set-dist', node: v, dist: dist[v], oldDist: null };
          yield { type: 'set-parent', node: v, parent: u, oldParent: null };
          queue.push(v);
        }
      }
      yield { type: 'finish-node', node: u };
    }

    // Highlight path to target
    if (target !== undefined && dist[target] !== null) {
      const path: number[] = [];
      let cur: number | null = target;
      while (cur !== null) { path.unshift(cur); cur = parent[cur]; }
      yield { type: 'highlight-nodes', nodes: path, role: 'path' };
      const pathEdges: number[] = [];
      for (let i = 0; i < path.length - 1; i++) {
        const u = path[i], v = path[i + 1];
        const eid = adj[u].find(id => {
          const e = edges[id];
          return neighbor(e, u) === v;
        });
        if (eid !== undefined) pathEdges.push(eid);
      }
      if (pathEdges.length) yield { type: 'highlight-edges', edges: pathEdges, role: 'path' };
    }

    yield { type: 'mark-done' };
  },
};

export default bfs;
