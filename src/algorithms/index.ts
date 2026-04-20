import type { GraphAlgorithm } from './types';
import bfs from './bfs';
import dfs from './dfs';
import dijkstra from './dijkstra';
import bellmanFord from './bellmanFord';
import aStar from './aStar';
import prim from './prim';
import kruskal from './kruskal';
import topoKahn from './topoKahn';
import topoDfs from './topoDfs';
import tarjanScc from './tarjanScc';
import unionFindDemo from './unionFindDemo';
import edmondsKarp from './edmondsKarp';

export const ALGORITHMS: GraphAlgorithm[] = [
  bfs,
  dfs,
  dijkstra,
  bellmanFord,
  aStar,
  prim,
  kruskal,
  topoKahn,
  topoDfs,
  tarjanScc,
  unionFindDemo,
  edmondsKarp,
];

export const ALGORITHMS_BY_ID = Object.fromEntries(
  ALGORITHMS.map(a => [a.meta.id, a]),
) as Record<string, GraphAlgorithm>;

export type AlgorithmId = typeof ALGORITHMS[number]['meta']['id'];
