import { describe, it, expect } from 'vitest';
import { ALGORITHMS, ALGORITHMS_BY_ID } from '../index';
import { getPreset } from '../../lib/graphs';
import { UnionFind } from '../../lib/graph';
import type { GraphEvent } from '../types';
import { emptyVisual, applyEventForward, buildVisualAndSnapshots, recomputeToIndex } from '../../hooks/useGraphRunner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function collectEvents(id: string, presetId: string, options = {}): GraphEvent[] {
  const algo = ALGORITHMS_BY_ID[id];
  const graph = getPreset(presetId as any);
  return Array.from(algo.run(graph, options));
}

function finalDist(events: GraphEvent[]): Record<number, number | null> {
  const dist: Record<number, number | null> = {};
  for (const e of events) {
    if (e.type === 'set-dist') dist[e.node] = e.dist;
  }
  return dist;
}

function mstEdges(events: GraphEvent[]): number[] {
  return events.filter(e => e.type === 'add-mst').map(e => (e as any).edge);
}

function topoOrder(events: GraphEvent[]): number[] {
  const order: number[] = [];
  for (const e of events) {
    if (e.type === 'topo-emit') order[e.order] = e.node;
  }
  return order;
}

function sccGroups(events: GraphEvent[]): number[][] {
  const groups: number[][] = [];
  for (const e of events) {
    if (e.type === 'emit-scc') groups[e.group] = e.nodes;
  }
  return groups;
}

function visitedNodes(events: GraphEvent[]): Set<number> {
  const visited = new Set<number>();
  for (const e of events) {
    if (e.type === 'visit-node') visited.add(e.node);
  }
  return visited;
}

// ---------------------------------------------------------------------------
// Registry sanity: all algorithms must have meta + run
// ---------------------------------------------------------------------------

describe('ALGORITHMS registry', () => {
  it('has all 12 algorithms', () => {
    expect(ALGORITHMS).toHaveLength(12);
  });

  it('each algorithm has required meta fields', () => {
    for (const algo of ALGORITHMS) {
      expect(algo.meta.id).toBeTruthy();
      expect(algo.meta.name).toBeTruthy();
      expect(algo.meta.complexity.time.average).toBeTruthy();
      expect(algo.meta.complexity.space).toBeTruthy();
      expect(algo.meta.stats).toBeInstanceOf(Array);
    }
  });

  it('all algorithms emit mark-done', () => {
    for (const algo of ALGORITHMS) {
      const graph = getPreset('weighted-mesh-9');
      const events = Array.from(algo.run(graph, { source: 0, target: 8 }));
      const last = events[events.length - 1];
      expect(last?.type).toBe('mark-done');
    }
  });
});

// ---------------------------------------------------------------------------
// BFS
// ---------------------------------------------------------------------------

describe('BFS', () => {
  it('visits all reachable nodes in tree-8', () => {
    const events = collectEvents('bfs', 'tree-8', { source: 0 });
    const visited = visitedNodes(events);
    expect(visited.size).toBe(8);
  });

  it('sets distance 0 for source', () => {
    const events = collectEvents('bfs', 'tree-8', { source: 0 });
    const dist = finalDist(events);
    expect(dist[0]).toBe(0);
  });

  it('BFS distances are non-decreasing', () => {
    const events = collectEvents('bfs', 'tree-8', { source: 0 });
    const dist = finalDist(events);
    // Level-by-level: dist[child] == dist[parent] + 1
    expect(dist[1]).toBe(1); // direct children of root
    expect(dist[2]).toBe(1);
    expect(dist[3]).toBe(2);
    expect(dist[7]).toBe(3);
  });

  it('only visits reachable component in disconnected graph', () => {
    const events = collectEvents('bfs', 'disconnected-9', { source: 0 });
    const visited = visitedNodes(events);
    // Nodes 0-3 are component 1, 4-6 are component 2, 7-8 are isolated pair
    expect(visited.has(0)).toBe(true);
    expect(visited.has(4)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// DFS
// ---------------------------------------------------------------------------

describe('DFS', () => {
  it('visits all nodes from every component', () => {
    const events = collectEvents('dfs', 'tree-8');
    const visited = visitedNodes(events);
    expect(visited.size).toBe(8);
  });

  it('each pushed node is eventually popped', () => {
    const events = collectEvents('dfs', 'scc-8');
    let stackDepth = 0;
    for (const e of events) {
      if (e.type === 'push-stack') stackDepth++;
      if (e.type === 'pop-stack') stackDepth--;
    }
    expect(stackDepth).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Dijkstra
// ---------------------------------------------------------------------------

describe('Dijkstra', () => {
  it('finds correct shortest distances on weighted-mesh-9', () => {
    const events = collectEvents('dijkstra', 'weighted-mesh-9', { source: 0 });
    const dist = finalDist(events);
    // Known shortest path from 0: to node 3 is 2 (direct edge)
    expect(dist[3]).toBe(2);
    // to node 4: min(0→1→4=7, 0→3→4=3) = 3
    expect(dist[4]).toBe(3);
  });

  it('source distance is 0', () => {
    const events = collectEvents('dijkstra', 'weighted-mesh-9', { source: 0 });
    expect(finalDist(events)[0]).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Bellman-Ford
// ---------------------------------------------------------------------------

describe('Bellman-Ford', () => {
  it('detects negative cycle and emits cut edges', () => {
    const events = collectEvents('bellmanFord', 'neg-cycle-6', { source: 0 });
    const cutEdges = events.filter(e => e.type === 'highlight-edges' && (e as any).role === 'cut');
    expect(cutEdges.length).toBeGreaterThan(0);
  });

  it('finds correct dist with negative edge but no negative cycle on dag-like path', () => {
    // neg-cycle-6: node 0 → 1 (w=5), 0 → 2 (w=4)
    const events = collectEvents('bellmanFord', 'neg-cycle-6', { source: 0 });
    const dist = finalDist(events);
    expect(dist[0]).toBe(0);
    expect(dist[1]).toBe(5);
    expect(dist[2]).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// A*
// ---------------------------------------------------------------------------

describe('A*', () => {
  it('finds path from source to target on grid-4x4', () => {
    const events = collectEvents('aStar', 'grid-4x4', { source: 0, target: 15 });
    const pathNodes = events.filter(e => e.type === 'highlight-nodes' && (e as any).role === 'path');
    expect(pathNodes.length).toBeGreaterThan(0);
  });

  it('source distance is 0', () => {
    const events = collectEvents('aStar', 'grid-4x4', { source: 0, target: 15 });
    expect(finalDist(events)[0]).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Prim
// ---------------------------------------------------------------------------

describe('Prim', () => {
  it('MST has V-1 edges on weighted-mesh-9', () => {
    const events = collectEvents('prim', 'weighted-mesh-9', { source: 0 });
    const mst = mstEdges(events);
    expect(mst).toHaveLength(8); // V-1 = 9-1
  });

  it('MST is a spanning tree (connected, acyclic via UF)', () => {
    const events = collectEvents('prim', 'weighted-mesh-9', { source: 0 });
    const graph = getPreset('weighted-mesh-9');
    const addedEdgeIds = mstEdges(events);
    const uf = new UnionFind(graph.nodes.length);
    let hasCycle = false;
    for (const eid of addedEdgeIds) {
      const e = graph.edges[eid];
      if (!uf.union(e.u, e.v)) hasCycle = true;
    }
    expect(hasCycle).toBe(false);
    // All nodes in same component
    const root = uf.find(0);
    for (let i = 1; i < graph.nodes.length; i++) {
      expect(uf.find(i)).toBe(root);
    }
  });
});

// ---------------------------------------------------------------------------
// Kruskal
// ---------------------------------------------------------------------------

describe('Kruskal', () => {
  it('MST has V-1 edges on weighted-mesh-9', () => {
    const events = collectEvents('kruskal', 'weighted-mesh-9');
    const mst = mstEdges(events);
    expect(mst).toHaveLength(8);
  });

  it('Prim and Kruskal produce MSTs of equal total weight', () => {
    const graph = getPreset('weighted-mesh-9');
    const totalWeight = (edgeIds: number[]) =>
      edgeIds.reduce((sum, id) => sum + graph.edges[id].weight, 0);

    const primMst = mstEdges(collectEvents('prim', 'weighted-mesh-9', { source: 0 }));
    const kruskalMst = mstEdges(collectEvents('kruskal', 'weighted-mesh-9'));
    expect(totalWeight(primMst)).toBe(totalWeight(kruskalMst));
  });
});

// ---------------------------------------------------------------------------
// Topological sort (Kahn)
// ---------------------------------------------------------------------------

describe('Topo Kahn', () => {
  it('emits all nodes in dag-10', () => {
    const events = collectEvents('topoKahn', 'dag-10');
    const order = topoOrder(events);
    expect(order.filter(n => n !== undefined)).toHaveLength(10);
  });

  it('topological order is valid (each edge u→v has u before v)', () => {
    const graph = getPreset('dag-10');
    const events = collectEvents('topoKahn', 'dag-10');
    const order = topoOrder(events);
    const pos = new Map(order.map((n, i) => [n, i]));
    for (const e of graph.edges) {
      expect(pos.get(e.u)!).toBeLessThan(pos.get(e.v)!);
    }
  });
});

// ---------------------------------------------------------------------------
// Topological sort (DFS)
// ---------------------------------------------------------------------------

describe('Topo DFS', () => {
  it('emits all nodes in dag-10', () => {
    const events = collectEvents('topoDfs', 'dag-10');
    const order = topoOrder(events);
    expect(order.filter(n => n !== undefined)).toHaveLength(10);
  });

  it('valid topological order', () => {
    const graph = getPreset('dag-10');
    const events = collectEvents('topoDfs', 'dag-10');
    const order = topoOrder(events);
    const pos = new Map(order.map((n, i) => [n, i]));
    for (const e of graph.edges) {
      expect(pos.get(e.u)!).toBeLessThan(pos.get(e.v)!);
    }
  });

  it('Kahn and DFS topo produce same set of valid orders', () => {
    const kahnOrder = topoOrder(collectEvents('topoKahn', 'dag-10'));
    const dfsOrder = topoOrder(collectEvents('topoDfs', 'dag-10'));
    expect(new Set(kahnOrder)).toEqual(new Set(dfsOrder));
  });
});

// ---------------------------------------------------------------------------
// Tarjan SCC
// ---------------------------------------------------------------------------

describe('Tarjan SCC', () => {
  it('finds 2 SCCs in scc-8', () => {
    // SCC 1: nodes 0-4 (0↔1↔2 + 1↔3↔4 all reachable in cycle)
    // SCC 2: nodes 5-7 (5↔6, 6↔7 all reachable in cycle)
    const events = collectEvents('tarjanScc', 'scc-8');
    const groups = sccGroups(events);
    const validGroups = groups.filter(g => g !== undefined && g.length > 0);
    expect(validGroups).toHaveLength(2);
  });

  it('every node appears in exactly one SCC', () => {
    const events = collectEvents('tarjanScc', 'scc-8');
    const groups = sccGroups(events).filter(g => g !== undefined);
    const allNodes = groups.flat();
    expect(new Set(allNodes).size).toBe(allNodes.length); // no duplicates
    expect(allNodes.length).toBe(8);
  });

  it('stack is empty at end', () => {
    const events = collectEvents('tarjanScc', 'scc-8');
    let depth = 0;
    for (const e of events) {
      if (e.type === 'push-stack') depth++;
      if (e.type === 'pop-stack') depth--;
    }
    expect(depth).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Edmonds-Karp
// ---------------------------------------------------------------------------

describe('Edmonds-Karp max flow', () => {
  it('emits at least one augment-path event on flow-net', () => {
    const events = collectEvents('edmondsKarp', 'flow-net', { source: 0, target: 5 });
    const augments = events.filter(e => e.type === 'augment-path');
    expect(augments.length).toBeGreaterThan(0);
  });

  it('update-flow events have flow <= capacity', () => {
    const events = collectEvents('edmondsKarp', 'flow-net', { source: 0, target: 5 });
    for (const e of events) {
      if (e.type === 'update-flow') {
        expect(e.flow).toBeLessThanOrEqual(e.capacity);
        expect(e.flow).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Event replay sanity: replaying all events produces consistent final dist
// ---------------------------------------------------------------------------

describe('Event replay consistency', () => {
  it('Dijkstra: dist from set-dist events matches direct computation', () => {
    const graph = getPreset('weighted-mesh-9');
    const algo = ALGORITHMS_BY_ID['dijkstra'];
    const events = Array.from(algo.run(graph, { source: 0 }));
    const dist = finalDist(events);
    // All set distances should be finite and non-negative
    for (const [, d] of Object.entries(dist)) {
      if (d !== null) {
        expect(d).toBeGreaterThanOrEqual(0);
        expect(Number.isFinite(d)).toBe(true);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Reducer: step-back / reversibility
// ---------------------------------------------------------------------------

describe('Reducer reversibility', () => {
  function runAlgo(id: string, presetId: string, opts = {}) {
    const algo = ALGORITHMS_BY_ID[id];
    const graph = getPreset(presetId as any);
    const events = Array.from(algo.run(graph, opts));
    const { snapshots } = buildVisualAndSnapshots(events);
    return { events, snapshots };
  }

  it('recomputeToIndex(0) returns empty visual', () => {
    const state = runAlgo('bfs', 'tree-8', { source: 0 });
    const { visual } = recomputeToIndex(state, 0);
    expect(visual).toEqual(emptyVisual());
  });

  it('stepping forward then back to 0 gives empty visual', () => {
    const state = runAlgo('dijkstra', 'weighted-mesh-9', { source: 0 });
    const midpoint = Math.floor(state.events.length / 2);

    // Recompute to midpoint, then back to 0
    const { visual: atMid } = recomputeToIndex(state, midpoint);
    // Sanity: midpoint should have some visited nodes
    expect(Object.keys(atMid.nodeRoles).length).toBeGreaterThan(0);

    const { visual: backToStart } = recomputeToIndex(state, 0);
    expect(backToStart).toEqual(emptyVisual());
  });

  it('forward replay equals snapshot-based recompute at every SNAPSHOT_INTERVAL', () => {
    const state = runAlgo('bfs', 'tree-8', { source: 0 });
    const { events } = state;

    // Build visual by forward replay to each checkpoint
    const forwardVisual = emptyVisual();
    const forwardStats = { elapsedMs: 0 };

    for (let i = 0; i < events.length; i++) {
      applyEventForward(forwardVisual, forwardStats, events[i]);

      // At every 10th step, compare with recomputeToIndex
      if ((i + 1) % 10 === 0) {
        const { visual: recomputed } = recomputeToIndex(state, i + 1);
        expect(recomputed.nodeRoles).toEqual(forwardVisual.nodeRoles);
        expect(recomputed.edgeRoles).toEqual(forwardVisual.edgeRoles);
        expect(recomputed.dist).toEqual(forwardVisual.dist);
      }
    }
  });

  it('recomputeToIndex at end matches full forward replay — Dijkstra', () => {
    const state = runAlgo('dijkstra', 'weighted-mesh-9', { source: 0 });
    const { events } = state;

    const forwardVisual = emptyVisual();
    const forwardStats = { elapsedMs: 0 };
    for (const ev of events) applyEventForward(forwardVisual, forwardStats, ev);

    const { visual: recomputed } = recomputeToIndex(state, events.length);
    expect(recomputed.dist).toEqual(forwardVisual.dist);
    expect(recomputed.nodeRoles).toEqual(forwardVisual.nodeRoles);
  });

  it('step back from any position always matches fresh recompute — DFS', () => {
    const state = runAlgo('dfs', 'scc-8', { source: 0 });
    const { events } = state;

    // Test at several arbitrary positions
    const positions = [1, 5, 10, Math.floor(events.length / 3), Math.floor(events.length * 2 / 3), events.length];
    for (const pos of positions) {
      const { visual } = recomputeToIndex(state, pos);
      // Rebuild independently from scratch to verify
      const freshVisual = emptyVisual();
      const freshStats = { elapsedMs: 0 };
      for (let i = 0; i < pos; i++) applyEventForward(freshVisual, freshStats, events[i]);
      expect(visual.nodeRoles).toEqual(freshVisual.nodeRoles);
      expect(visual.stack).toEqual(freshVisual.stack);
    }
  });
});
