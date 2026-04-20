import type { GraphAlgorithm } from './types';
import { neighbor } from '../lib/graph';

const tarjanScc: GraphAlgorithm = {
  meta: {
    id: 'tarjanScc',
    name: 'Tarjan SCC',
    category: 'advanced',
    description: "Finds all Strongly Connected Components in a directed graph using Tarjan's single-pass DFS with lowlink values.",
    requiresDirected: true,
    complexity: {
      time: { best: 'O(V+E)', average: 'O(V+E)', worst: 'O(V+E)' },
      space: 'O(V)',
    },
    stats: ['sccCount', 'visited', 'considered'],
  },
  *run(graph, _options = {}) {
    const { nodes, edges, adj } = graph;
    const V = nodes.length;
    const index: number[] = new Array(V).fill(-1);
    const lowlink: number[] = new Array(V).fill(-1);
    const onStack: boolean[] = new Array(V).fill(false);
    const stack: number[] = [];
    let timer = 0;
    let sccCount = 0;

    function* strongconnect(u: number): Generator<import('./types').GraphEvent> {
      const idx = timer++;
      index[u] = idx;
      lowlink[u] = idx;
      yield { type: 'visit-node', node: u };
      yield { type: 'set-lowlink', node: u, low: idx, index: idx, oldLow: -1, oldIndex: -1 };
      stack.push(u);
      onStack[u] = true;
      yield { type: 'push-stack', node: u };

      for (const eid of adj[u]) {
        const e = edges[eid];
        const v = neighbor(e, u);
        yield { type: 'consider-edge', edge: eid };

        if (index[v] === -1) {
          yield* strongconnect(v);
          if (lowlink[v] < lowlink[u]) {
            const oldLow = lowlink[u];
            lowlink[u] = lowlink[v];
            yield { type: 'set-lowlink', node: u, low: lowlink[u], index: index[u], oldLow, oldIndex: index[u] };
          }
        } else if (onStack[v]) {
          if (index[v] < lowlink[u]) {
            const oldLow = lowlink[u];
            lowlink[u] = index[v];
            yield { type: 'set-lowlink', node: u, low: lowlink[u], index: index[u], oldLow, oldIndex: index[u] };
          }
        }
      }

      // If u is an SCC root, pop and emit
      if (lowlink[u] === index[u]) {
        const sccNodes: number[] = [];
        let w: number;
        do {
          w = stack.pop()!;
          onStack[w] = false;
          sccNodes.push(w);
          yield { type: 'pop-stack', node: w };
        } while (w !== u);
        yield { type: 'emit-scc', nodes: sccNodes, group: sccCount++ };
      }
      yield { type: 'finish-node', node: u };
    }

    for (let u = 0; u < V; u++) {
      if (index[u] === -1) yield* strongconnect(u);
    }

    yield { type: 'mark-done' };
  },
};

export default tarjanScc;
