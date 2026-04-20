import type { GraphAlgorithm } from './types';
import { neighbor } from '../lib/graph';

const dfs: GraphAlgorithm = {
  meta: {
    id: 'dfs',
    name: 'Depth-First Search',
    category: 'traversal',
    description: 'Explores as deep as possible before backtracking. Identifies back edges, discovery/finish times, and connected components.',
    complexity: {
      time: { best: 'O(1)', average: 'O(V+E)', worst: 'O(V+E)' },
      space: 'O(V)',
    },
    stats: ['visited', 'finished', 'considered'],
  },
  *run(graph, _options = {}) {
    const { nodes, edges, adj, directed } = graph;
    const color: ('white' | 'gray' | 'black')[] = new Array(nodes.length).fill('white');
    const discovery: number[] = new Array(nodes.length).fill(-1);
    const finish: number[] = new Array(nodes.length).fill(-1);
    let timer = 0;

    function* visit(u: number): Generator<import('./types').GraphEvent> {
      color[u] = 'gray';
      discovery[u] = timer++;
      yield { type: 'visit-node', node: u };
      yield { type: 'push-stack', node: u };

      for (const eid of adj[u]) {
        const e = edges[eid];
        const v = neighbor(e, u);
        yield { type: 'consider-edge', edge: eid };

        if (color[v] === 'white') {
          yield { type: 'set-parent', node: v, parent: u, oldParent: null };
          yield { type: 'highlight-edges', edges: [eid], role: 'tree' };
          yield* visit(v);
        } else if (color[v] === 'gray' && (directed || v !== u)) {
          yield { type: 'highlight-edges', edges: [eid], role: 'back' };
        } else if (directed) {
          const role = discovery[u] < discovery[v] ? 'forward' : 'cross';
          yield { type: 'highlight-edges', edges: [eid], role };
        }
      }

      color[u] = 'black';
      finish[u] = timer++;
      yield { type: 'finish-node', node: u };
      yield { type: 'pop-stack', node: u };
    }

    for (let u = 0; u < nodes.length; u++) {
      if (color[u] === 'white') yield* visit(u);
    }

    yield { type: 'mark-done' };
  },
};

export default dfs;
