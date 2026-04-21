export type NodeId = number;
export type EdgeId = number;

export type NodeRole =
  | 'default'
  | 'frontier'
  | 'visited'
  | 'finished'
  | 'current'
  | 'path'
  | 'source'
  | 'target'
  | 'scc0'
  | 'scc1'
  | 'scc2'
  | 'scc3'
  | 'scc4'
  | 'scc5';

export type EdgeRole =
  | 'default'
  | 'considered'
  | 'relaxed'
  | 'tree'
  | 'mst'
  | 'path'
  | 'cross'
  | 'back'
  | 'forward'
  | 'cut'
  | 'residual';

export type GraphEvent =
  | { type: 'visit-node'; node: NodeId }
  | { type: 'finish-node'; node: NodeId }
  | { type: 'enqueue'; node: NodeId; from?: NodeId }
  | { type: 'dequeue'; node: NodeId }
  | { type: 'consider-edge'; edge: EdgeId }
  | {
      type: 'relax-edge';
      edge: EdgeId;
      to: NodeId;
      newDist: number;
      oldDist: number | null;
    }
  | { type: 'set-dist'; node: NodeId; dist: number | null; oldDist: number | null }
  | { type: 'set-parent'; node: NodeId; parent: NodeId | null; oldParent: NodeId | null }
  | { type: 'add-mst'; edge: EdgeId }
  | { type: 'reject-edge'; edge: EdgeId; reason: 'cycle' | 'not-lightest' }
  | { type: 'union'; a: NodeId; b: NodeId; root: NodeId; oldRootA: NodeId; oldRootB: NodeId }
  | { type: 'find'; node: NodeId; root: NodeId }
  | { type: 'push-stack'; node: NodeId }
  | { type: 'pop-stack'; node: NodeId }
  | { type: 'set-disc'; node: NodeId; value: number }
  | { type: 'set-fin'; node: NodeId; value: number }
  | { type: 'set-lowlink'; node: NodeId; low: number; index: number; oldLow: number; oldIndex: number }
  | { type: 'emit-scc'; nodes: NodeId[]; group: number }
  | { type: 'topo-emit'; node: NodeId; order: number }
  | {
      type: 'augment-path';
      edges: EdgeId[];
      bottleneck: number;
      oldFlows: Record<EdgeId, number>;
    }
  | { type: 'update-flow'; edge: EdgeId; flow: number; capacity: number; oldFlow: number }
  | { type: 'highlight-nodes'; nodes: NodeId[]; role: NodeRole }
  | { type: 'highlight-edges'; edges: EdgeId[]; role: EdgeRole }
  | { type: 'clear-highlights'; scope?: 'nodes' | 'edges' | 'transient' }
  | { type: 'mark-done' };

export type AlgorithmCategory =
  | 'traversal'
  | 'shortest-path'
  | 'mst'
  | 'advanced';

export interface AlgorithmComplexity {
  time: { best?: string; average: string; worst: string };
  space: string;
}

export interface GraphAlgorithmMeta {
  id: string;
  name: string;
  category: AlgorithmCategory;
  description: string;
  requiresDirected?: boolean;
  requiresWeighted?: boolean;
  requiresDAG?: boolean;
  requiresCapacities?: boolean;
  allowsNegativeWeights?: boolean;
  complexity: AlgorithmComplexity;
  stats: string[];
}

export type AlgorithmStats = Record<string, number>;

export interface GraphAlgorithm {
  meta: GraphAlgorithmMeta;
  run: (graph: import('../lib/graph').Graph, options?: AlgorithmOptions) => Generator<GraphEvent>;
}

export interface AlgorithmOptions {
  source?: NodeId;
  target?: NodeId;
}
