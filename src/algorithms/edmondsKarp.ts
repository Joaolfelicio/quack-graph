import type { GraphAlgorithm } from './types';

const edmondsKarp: GraphAlgorithm = {
  meta: {
    id: 'edmondsKarp',
    name: 'Edmonds-Karp (Max Flow)',
    category: 'advanced',
    description: 'Computes maximum flow using BFS to find augmenting paths in the residual graph (Edmonds-Karp = Ford-Fulkerson with BFS).',
    requiresDirected: true,
    requiresCapacities: true,
    complexity: {
      time: { best: 'O(VE)', average: 'O(VE²)', worst: 'O(VE²)' },
      space: 'O(V+E)',
    },
    stats: ['maxFlow', 'augmentations', 'considered'],
  },
  *run(graph, options = {}) {
    const source = options.source ?? 0;
    const target = options.target ?? graph.nodes.length - 1;
    const { nodes, edges } = graph;
    const V = nodes.length;

    // Build residual graph with forward and backward edges
    const cap: number[][] = Array.from({ length: V }, () => new Array(V).fill(0));
    const edgeId: number[][] = Array.from({ length: V }, () => new Array(V).fill(-1));

    for (const e of edges) {
      const c = e.capacity ?? e.weight;
      cap[e.u][e.v] += c;
      edgeId[e.u][e.v] = e.id;
    }

    yield { type: 'highlight-nodes', nodes: [source], role: 'source' };
    yield { type: 'highlight-nodes', nodes: [target], role: 'target' };

    let maxFlow = 0;

    while (true) {
      // BFS to find augmenting path
      const parent: number[] = new Array(V).fill(-1);
      parent[source] = source;
      const queue = [source];
      yield { type: 'enqueue', node: source };

      while (queue.length > 0 && parent[target] === -1) {
        const u = queue.shift()!;
        yield { type: 'dequeue', node: u };
        yield { type: 'visit-node', node: u };

        for (let v = 0; v < V; v++) {
          if (parent[v] === -1 && cap[u][v] > 0) {
            parent[v] = u;
            const eid = edgeId[u][v];
            if (eid !== -1) yield { type: 'consider-edge', edge: eid };
            yield { type: 'enqueue', node: v };
            queue.push(v);
          }
        }
      }

      if (parent[target] === -1) break;

      // Find bottleneck
      let bottleneck = Infinity;
      let v = target;
      while (v !== source) {
        const u = parent[v];
        bottleneck = Math.min(bottleneck, cap[u][v]);
        v = u;
      }

      // Collect path edges and update flows
      const pathEdges: number[] = [];
      const oldFlows: Record<number, number> = {};
      v = target;
      while (v !== source) {
        const u = parent[v];
        cap[u][v] -= bottleneck;
        cap[v][u] += bottleneck;
        const eid = edgeId[u][v];
        if (eid !== -1) {
          oldFlows[eid] = edges[eid].capacity! - (cap[u][v] + bottleneck);
          pathEdges.push(eid);
          const flow = (edges[eid].capacity ?? edges[eid].weight) - cap[u][v];
          yield {
            type: 'update-flow',
            edge: eid,
            flow,
            capacity: edges[eid].capacity ?? edges[eid].weight,
            oldFlow: oldFlows[eid],
          };
        }
        v = u;
      }

      maxFlow += bottleneck;
      yield { type: 'augment-path', edges: pathEdges, bottleneck, oldFlows };
      yield { type: 'highlight-edges', edges: pathEdges, role: 'path' };
    }

    yield { type: 'mark-done' };
  },
};

export default edmondsKarp;
