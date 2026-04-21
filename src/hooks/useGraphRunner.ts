import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { ALGORITHMS_BY_ID } from '../algorithms';
import type { GraphEvent, NodeRole, EdgeRole } from '../algorithms/types';
import type { Graph } from '../lib/graph';
import { getPreset, generateRandom, type PresetId } from '../lib/graphs';
import { drip, quack, splash } from '../lib/sound';
import { useAnimationFrame } from './useAnimationFrame';

export type RunnerStatus = 'idle' | 'playing' | 'paused' | 'done';

export interface GraphVisualState {
  nodeRoles: Record<number, NodeRole>;
  edgeRoles: Record<number, EdgeRole>;
  dist: Record<number, number | null>;
  parent: Record<number, number | null>;
  mstEdges: number[];
  topoOrder: number[];
  sccGroup: Record<number, number>;
  stack: number[];
  flow: Record<number, { flow: number; capacity: number }>;
  disc: Record<number, number>;
  fin: Record<number, number>;
}

export interface RunnerStats {
  [key: string]: number;
  elapsedMs: number;
}

interface StateSnapshot {
  stepIndex: number;
  visual: GraphVisualState;
  stats: RunnerStats;
}

const SNAPSHOT_INTERVAL = 100;
const MAX_EVENTS = 50_000;

export type GraphSource =
  | { type: 'preset'; id: PresetId }
  | { type: 'random'; nodeCount: number; density: number; directed: boolean; weighted: boolean; seed: number };

export interface RunnerState {
  algorithmId: string;
  graphSource: GraphSource;
  graph: Graph;
  source: number;
  target: number;
  events: GraphEvent[];
  snapshots: StateSnapshot[];
  stepIndex: number;
  visual: GraphVisualState;
  status: RunnerStatus;
  stats: RunnerStats;
  speed: number;
  tooManyEvents: boolean;
}

type Action =
  | { type: 'set-algorithm'; algorithmId: string }
  | { type: 'set-graph-source'; source: GraphSource }
  | { type: 'set-speed'; speed: number }
  | { type: 'set-source-node'; node: number }
  | { type: 'set-target-node'; node: number }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'reset' }
  | { type: 'step-forward' }
  | { type: 'step-back' }
  | { type: 'advance'; steps: number; dtMs: number };

function emptyVisual(): GraphVisualState {
  return { nodeRoles: {}, edgeRoles: {}, dist: {}, parent: {}, mstEdges: [], topoOrder: [], sccGroup: {}, stack: [], flow: {}, disc: {}, fin: {} };
}

function cloneVisual(v: GraphVisualState): GraphVisualState {
  return {
    nodeRoles: { ...v.nodeRoles },
    edgeRoles: { ...v.edgeRoles },
    dist: { ...v.dist },
    parent: { ...v.parent },
    mstEdges: [...v.mstEdges],
    topoOrder: [...v.topoOrder],
    sccGroup: { ...v.sccGroup },
    stack: [...v.stack],
    flow: Object.fromEntries(Object.entries(v.flow).map(([k, val]) => [k, { ...val }])),
    disc: { ...v.disc },
    fin: { ...v.fin },
  };
}

function applyEventForward(visual: GraphVisualState, stats: RunnerStats, event: GraphEvent): void {
  switch (event.type) {
    case 'visit-node':
      visual.nodeRoles[event.node] = 'visited';
      stats.visited = (stats.visited ?? 0) + 1;
      break;
    case 'finish-node':
      visual.nodeRoles[event.node] = 'finished';
      stats.finished = (stats.finished ?? 0) + 1;
      break;
    case 'enqueue':
      if (visual.nodeRoles[event.node] !== 'visited' && visual.nodeRoles[event.node] !== 'finished') {
        visual.nodeRoles[event.node] = 'frontier';
      }
      stats.enqueued = (stats.enqueued ?? 0) + 1;
      break;
    case 'dequeue':
      visual.nodeRoles[event.node] = 'current';
      stats.dequeued = (stats.dequeued ?? 0) + 1;
      break;
    case 'consider-edge':
      if (visual.edgeRoles[event.edge] !== 'mst' && visual.edgeRoles[event.edge] !== 'tree' && visual.edgeRoles[event.edge] !== 'path') {
        visual.edgeRoles[event.edge] = 'considered';
      }
      stats.considered = (stats.considered ?? 0) + 1;
      break;
    case 'relax-edge':
      visual.edgeRoles[event.edge] = 'relaxed';
      stats.relaxed = (stats.relaxed ?? 0) + 1;
      break;
    case 'set-dist':
      visual.dist[event.node] = event.dist;
      break;
    case 'set-parent':
      visual.parent[event.node] = event.parent;
      break;
    case 'add-mst':
      visual.edgeRoles[event.edge] = 'mst';
      if (!visual.mstEdges.includes(event.edge)) visual.mstEdges.push(event.edge);
      stats.mstEdges = (stats.mstEdges ?? 0) + 1;
      break;
    case 'reject-edge':
      visual.edgeRoles[event.edge] = 'cut';
      stats.rejected = (stats.rejected ?? 0) + 1;
      break;
    case 'union':
      stats.unions = (stats.unions ?? 0) + 1;
      break;
    case 'find':
      stats.finds = (stats.finds ?? 0) + 1;
      break;
    case 'push-stack':
      if (!visual.stack.includes(event.node)) visual.stack.push(event.node);
      break;
    case 'pop-stack':
      visual.stack = visual.stack.filter(n => n !== event.node);
      break;
    case 'set-disc':
      visual.disc[event.node] = event.value;
      break;
    case 'set-fin':
      visual.fin[event.node] = event.value;
      break;
    case 'set-lowlink':
      break;
    case 'emit-scc':
      for (const n of event.nodes) visual.sccGroup[n] = event.group % 6;
      stats.sccCount = (stats.sccCount ?? 0) + 1;
      break;
    case 'topo-emit':
      visual.topoOrder[event.order] = event.node;
      stats.emitted = (stats.emitted ?? 0) + 1;
      break;
    case 'augment-path':
      stats.augmentations = (stats.augmentations ?? 0) + 1;
      stats.maxFlow = (stats.maxFlow ?? 0) + event.bottleneck;
      break;
    case 'update-flow':
      visual.flow[event.edge] = { flow: event.flow, capacity: event.capacity };
      break;
    case 'highlight-nodes':
      for (const n of event.nodes) visual.nodeRoles[n] = event.role;
      break;
    case 'highlight-edges':
      for (const e of event.edges) visual.edgeRoles[e] = event.role;
      break;
    case 'clear-highlights':
      if (!event.scope || event.scope === 'nodes') visual.nodeRoles = {};
      if (!event.scope || event.scope === 'edges') visual.edgeRoles = {};
      break;
    case 'mark-done':
      break;
  }
}

function buildVisualAndSnapshots(events: GraphEvent[]): { initial: GraphVisualState; snapshots: StateSnapshot[] } {
  const visual = emptyVisual();
  const stats: RunnerStats = { elapsedMs: 0 };
  const snapshots: StateSnapshot[] = [];

  snapshots.push({ stepIndex: 0, visual: cloneVisual(visual), stats: { ...stats } });

  for (let k = 0; k < events.length; k++) {
    applyEventForward(visual, stats, events[k]);
    if ((k + 1) % SNAPSHOT_INTERVAL === 0) {
      snapshots.push({ stepIndex: k + 1, visual: cloneVisual(visual), stats: { ...stats } });
    }
  }

  return { initial: emptyVisual(), snapshots };
}

function getGraph(source: GraphSource): Graph {
  if (source.type === 'preset') return getPreset(source.id);
  return generateRandom({
    nodeCount: source.nodeCount,
    density: source.density,
    directed: source.directed,
    weighted: source.weighted,
    seed: source.seed,
  });
}

function rebuild(state: RunnerState, graph: Graph, algorithmId: string, sourceNode: number, targetNode: number): RunnerState {
  const algo = ALGORITHMS_BY_ID[algorithmId];
  if (!algo) return state;

  const rawEvents = Array.from(algo.run(graph, { source: sourceNode, target: targetNode }));
  const tooManyEvents = rawEvents.length > MAX_EVENTS;
  const events = tooManyEvents ? [] : rawEvents;

  const { snapshots } = buildVisualAndSnapshots(events);

  return {
    ...state,
    algorithmId,
    graph,
    source: sourceNode,
    target: targetNode,
    events,
    snapshots,
    stepIndex: 0,
    visual: emptyVisual(),
    status: 'idle',
    stats: { elapsedMs: 0 },
    tooManyEvents,
  };
}

function recomputeToIndex(state: RunnerState, targetIndex: number): { visual: GraphVisualState; stats: RunnerStats } {
  const snapshotIdx = Math.max(0, Math.floor(targetIndex / SNAPSHOT_INTERVAL) - 1);
  const snap = state.snapshots[snapshotIdx] ?? state.snapshots[0];

  const visual = cloneVisual(snap.visual);
  const stats: RunnerStats = { ...snap.stats };

  for (let k = snap.stepIndex; k < targetIndex; k++) {
    applyEventForward(visual, stats, state.events[k]);
  }
  return { visual, stats };
}

function reducer(state: RunnerState, action: Action): RunnerState {
  switch (action.type) {
    case 'set-algorithm': {
      const graph = getGraph(state.graphSource);
      return rebuild(state, graph, action.algorithmId, state.source, state.target);
    }
    case 'set-graph-source': {
      const graph = getGraph(action.source);
      const source = Math.min(state.source, graph.nodes.length - 1);
      const target = Math.min(state.target, graph.nodes.length - 1);
      return rebuild({ ...state, graphSource: action.source }, graph, state.algorithmId, source, target);
    }
    case 'set-source-node':
      return rebuild(state, state.graph, state.algorithmId, action.node, state.target);
    case 'set-target-node':
      return rebuild(state, state.graph, state.algorithmId, state.source, action.node);
    case 'set-speed':
      return { ...state, speed: action.speed };
    case 'play':
      if (state.stepIndex >= state.events.length) return state;
      return { ...state, status: 'playing' };
    case 'pause':
      return state.status === 'playing' ? { ...state, status: 'paused' } : state;
    case 'reset':
      return rebuild(state, state.graph, state.algorithmId, state.source, state.target);
    case 'step-forward': {
      if (state.stepIndex >= state.events.length) return state;
      const ev = state.events[state.stepIndex];
      const visual = cloneVisual(state.visual);
      const stats = { ...state.stats };
      applyEventForward(visual, stats, ev);
      const stepIndex = state.stepIndex + 1;
      const done = stepIndex >= state.events.length;
      return {
        ...state,
        visual,
        stats,
        stepIndex,
        status: done ? 'done' : state.status === 'playing' ? 'playing' : 'paused',
      };
    }
    case 'step-back': {
      if (state.stepIndex <= 0) return state;
      const targetIndex = state.stepIndex - 1;
      const { visual, stats } = recomputeToIndex(state, targetIndex);
      return { ...state, visual, stats: { ...stats, elapsedMs: state.stats.elapsedMs }, stepIndex: targetIndex, status: 'paused' };
    }
    case 'advance': {
      if (state.status !== 'playing') return state;
      if (state.stepIndex >= state.events.length) return { ...state, status: 'done' };
      const visual = cloneVisual(state.visual);
      const stats = { ...state.stats };
      const max = Math.min(action.steps, state.events.length - state.stepIndex);
      for (let i = 0; i < max; i++) {
        applyEventForward(visual, stats, state.events[state.stepIndex + i]);
      }
      const stepIndex = state.stepIndex + max;
      const done = stepIndex >= state.events.length;
      return {
        ...state,
        visual,
        stats: { ...stats, elapsedMs: stats.elapsedMs + action.dtMs },
        stepIndex,
        status: done ? 'done' : 'playing',
      };
    }
  }
}

export interface UseGraphRunnerArgs {
  initialAlgorithmId: string;
  initialGraphSource: GraphSource;
  initialSpeed: number;
  soundEnabled: boolean;
}

function makeInitialState(args: UseGraphRunnerArgs): RunnerState {
  const graph = getGraph(args.initialGraphSource);
  const base: RunnerState = {
    algorithmId: args.initialAlgorithmId,
    graphSource: args.initialGraphSource,
    graph,
    source: 0,
    target: graph.nodes.length - 1,
    events: [],
    snapshots: [],
    stepIndex: 0,
    visual: emptyVisual(),
    status: 'idle',
    stats: { elapsedMs: 0 },
    speed: args.initialSpeed,
    tooManyEvents: false,
  };
  return rebuild(base, graph, args.initialAlgorithmId, 0, graph.nodes.length - 1);
}

export function useGraphRunner(args: UseGraphRunnerArgs) {
  const [state, dispatch] = useReducer(reducer, args, makeInitialState);
  const soundRef = useRef(args.soundEnabled);
  soundRef.current = args.soundEnabled;
  const pendingRef = useRef(0);

  useAnimationFrame(state.status === 'playing', (dt) => {
    const stepsPerSec = 6 * state.speed;
    pendingRef.current += (dt / 1000) * stepsPerSec;
    const whole = Math.floor(pendingRef.current);
    if (whole <= 0) return;
    pendingRef.current -= whole;

    if (soundRef.current) {
      const end = Math.min(state.events.length, state.stepIndex + whole);
      const playSteps = Math.min(whole, 4);
      const start = Math.max(state.stepIndex, end - playSteps);
      for (let k = start; k < end; k++) {
        const ev = state.events[k];
        const mid = Math.floor(state.graph.nodes.length / 2) + 1;
        if (ev.type === 'visit-node') quack(ev.node + 1, mid);
        else if (ev.type === 'consider-edge') splash(ev.edge + 1, state.graph.edges.length);
        else if (ev.type === 'relax-edge') drip(ev.to + 1, state.graph.nodes.length);
      }
    }

    dispatch({ type: 'advance', steps: whole, dtMs: dt });
  });

  const actions = useMemo(
    () => ({
      setAlgorithm: (algorithmId: string) => dispatch({ type: 'set-algorithm', algorithmId }),
      setGraphSource: (source: GraphSource) => dispatch({ type: 'set-graph-source', source }),
      setSpeed: (speed: number) => dispatch({ type: 'set-speed', speed }),
      setSourceNode: (node: number) => dispatch({ type: 'set-source-node', node }),
      setTargetNode: (node: number) => dispatch({ type: 'set-target-node', node }),
      play: () => dispatch({ type: 'play' }),
      pause: () => dispatch({ type: 'pause' }),
      reset: () => dispatch({ type: 'reset' }),
      stepForward: () => dispatch({ type: 'step-forward' }),
      stepBack: () => dispatch({ type: 'step-back' }),
    }),
    [],
  );

  useEffect(() => {
    if (state.stepIndex >= state.events.length && state.status === 'playing') {
      dispatch({ type: 'pause' });
    }
  }, [state.stepIndex, state.events.length, state.status]);

  const toggle = useCallback(() => {
    if (state.status === 'playing') actions.pause();
    else if (state.stepIndex >= state.events.length) {
      actions.reset();
      queueMicrotask(() => actions.play());
    } else actions.play();
  }, [state.status, state.stepIndex, state.events.length, actions]);

  const progress = state.events.length > 0 ? state.stepIndex / state.events.length : 0;

  return { state, actions, toggle, progress };
}
