import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { ALGORITHMS_BY_ID } from '../algorithms';
import type { HighlightRole, SortEvent } from '../algorithms/types';
import { generate, type Distribution } from '../lib/distributions';
import { quack, splash } from '../lib/sound';
import { useAnimationFrame } from './useAnimationFrame';

export interface RunnerItem {
  id: number;
  value: number;
}

export type RunnerStatus = 'idle' | 'playing' | 'paused' | 'done';

export interface RunnerStats {
  comparisons: number;
  swaps: number;
  writes: number;
  elapsedMs: number;
}

interface StateSnapshot {
  stepIndex: number;
  items: RunnerItem[];
  stats: Omit<RunnerStats, 'elapsedMs'>;
  highlights: Record<number, HighlightRole>;
}

const SNAPSHOT_INTERVAL = 100;

export interface RunnerState {
  algorithmId: string;
  distribution: Distribution;
  count: number;
  baseItems: RunnerItem[];
  events: SortEvent[];
  snapshots: StateSnapshot[];
  stepIndex: number;
  items: RunnerItem[];
  status: RunnerStatus;
  stats: RunnerStats;
  highlights: Record<number, HighlightRole>;
  maxValue: number;
  speed: number;
  accumulator: number;
}

type Action =
  | { type: 'init'; algorithmId: string; distribution: Distribution; count: number; speed: number }
  | { type: 'set-algorithm'; algorithmId: string }
  | { type: 'set-distribution'; distribution: Distribution }
  | { type: 'set-count'; count: number }
  | { type: 'set-speed'; speed: number }
  | { type: 'shuffle' }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'reset' }
  | { type: 'step-forward' }
  | { type: 'step-back' }
  | { type: 'advance'; steps: number; dtMs: number };

function buildSnapshots(baseItems: RunnerItem[], events: SortEvent[]): StateSnapshot[] {
  const snapshots: StateSnapshot[] = [];
  let items = baseItems.slice();
  let highlights: Record<number, HighlightRole> = {};
  let stats = { comparisons: 0, swaps: 0, writes: 0 };

  snapshots.push({ stepIndex: 0, items: items.slice(), stats: { ...stats }, highlights: { ...highlights } });

  for (let k = 0; k < events.length; k++) {
    const ev = events[k];
    switch (ev.type) {
      case 'compare':
        stats.comparisons += 1;
        highlights[ev.indices[0]] = 'compare';
        highlights[ev.indices[1]] = 'compare';
        break;
      case 'swap': {
        const [i, j] = ev.indices;
        [items[i], items[j]] = [items[j], items[i]];
        stats.swaps += 1;
        highlights[i] = 'swap';
        highlights[j] = 'swap';
        break;
      }
      case 'overwrite':
        items[ev.index] = { ...items[ev.index], value: ev.value };
        stats.writes += 1;
        highlights[ev.index] = 'cursor';
        break;
      case 'mark-sorted':
        highlights[ev.index] = 'sorted';
        break;
      case 'mark-all-sorted':
        for (let i = 0; i < items.length; i++) highlights[i] = 'sorted';
        break;
      case 'highlight':
        for (const idx of ev.indices) highlights[idx] = ev.role;
        break;
      case 'unhighlight':
        for (const k2 of Object.keys(highlights)) {
          const idx = Number(k2);
          if (highlights[idx] !== 'sorted') delete highlights[idx];
        }
        break;
    }
    if ((k + 1) % SNAPSHOT_INTERVAL === 0) {
      snapshots.push({ stepIndex: k + 1, items: items.slice(), stats: { ...stats }, highlights: { ...highlights } });
    }
  }
  return snapshots;
}

function rebuild(state: RunnerState, items: RunnerItem[], algorithmId: string): RunnerState {
  const algo = ALGORITHMS_BY_ID[algorithmId] ?? ALGORITHMS_BY_ID['bubble'];
  const values = items.map((it) => it.value);
  const events = Array.from(algo.run(values));
  const maxValue = items.reduce((m, it) => Math.max(m, it.value), 1);
  const snapshots = buildSnapshots(items, events);
  return {
    ...state,
    algorithmId: algo.id,
    baseItems: items,
    items: items.slice(),
    events,
    snapshots,
    stepIndex: 0,
    status: 'idle',
    stats: { comparisons: 0, swaps: 0, writes: 0, elapsedMs: 0 },
    highlights: {},
    maxValue,
    accumulator: 0,
  };
}

function applyEvent(state: RunnerState, event: SortEvent, forward: boolean): RunnerState {
  const items = state.items.slice();
  const highlights: Record<number, HighlightRole> = { ...state.highlights };
  let stats = { ...state.stats };
  switch (event.type) {
    case 'compare': {
      const [i, j] = event.indices;
      if (forward) stats.comparisons += 1;
      else stats.comparisons = Math.max(0, stats.comparisons - 1);
      if (forward) {
        highlights[i] = 'compare';
        highlights[j] = 'compare';
      } else {
        if (highlights[i] === 'compare') delete highlights[i];
        if (highlights[j] === 'compare') delete highlights[j];
      }
      break;
    }
    case 'swap': {
      const [i, j] = event.indices;
      [items[i], items[j]] = [items[j], items[i]];
      if (forward) {
        stats.swaps += 1;
        highlights[i] = 'swap';
        highlights[j] = 'swap';
      } else {
        stats.swaps = Math.max(0, stats.swaps - 1);
        if (highlights[i] === 'swap') delete highlights[i];
        if (highlights[j] === 'swap') delete highlights[j];
      }
      break;
    }
    case 'overwrite': {
      const prev = items[event.index];
      if (forward) {
        items[event.index] = { ...prev, value: event.value };
        stats.writes += 1;
      } else {
        items[event.index] = { ...prev, value: event.value };
        stats.writes = Math.max(0, stats.writes - 1);
      }
      break;
    }
    case 'mark-sorted':
      if (forward) highlights[event.index] = 'sorted';
      else if (highlights[event.index] === 'sorted') delete highlights[event.index];
      break;
    case 'mark-all-sorted':
      if (forward) {
        for (let i = 0; i < items.length; i++) highlights[i] = 'sorted';
      }
      break;
    case 'highlight':
      if (forward) for (const idx of event.indices) highlights[idx] = event.role;
      else for (const idx of event.indices) if (highlights[idx] === event.role) delete highlights[idx];
      break;
    case 'unhighlight':
      if (forward) {
        for (const k of Object.keys(highlights)) {
          const idx = Number(k);
          if (highlights[idx] !== 'sorted') delete highlights[idx];
        }
      }
      break;
  }
  return { ...state, items, highlights, stats };
}

function recomputeFromScratch(state: RunnerState, targetIndex: number): RunnerState {
  const snapshotIdx = Math.floor(targetIndex / SNAPSHOT_INTERVAL);
  const snap = state.snapshots[snapshotIdx] ?? state.snapshots[0];

  let items = snap.items.slice();
  let highlights: Record<number, HighlightRole> = { ...snap.highlights };
  let stats: RunnerStats = { ...snap.stats, elapsedMs: state.stats.elapsedMs };

  for (let k = snap.stepIndex; k < targetIndex; k++) {
    const ev = state.events[k];
    switch (ev.type) {
      case 'compare':
        stats.comparisons += 1;
        highlights[ev.indices[0]] = 'compare';
        highlights[ev.indices[1]] = 'compare';
        break;
      case 'swap': {
        const [i, j] = ev.indices;
        [items[i], items[j]] = [items[j], items[i]];
        stats.swaps += 1;
        highlights[i] = 'swap';
        highlights[j] = 'swap';
        break;
      }
      case 'overwrite':
        items[ev.index] = { ...items[ev.index], value: ev.value };
        stats.writes += 1;
        highlights[ev.index] = 'cursor';
        break;
      case 'mark-sorted':
        highlights[ev.index] = 'sorted';
        break;
      case 'mark-all-sorted':
        for (let i = 0; i < items.length; i++) highlights[i] = 'sorted';
        break;
      case 'highlight':
        for (const idx of ev.indices) highlights[idx] = ev.role;
        break;
      case 'unhighlight':
        for (const k2 of Object.keys(highlights)) {
          const idx = Number(k2);
          if (highlights[idx] !== 'sorted') delete highlights[idx];
        }
        break;
    }
  }
  return { ...state, items, highlights, stats };
}

function reducer(state: RunnerState, action: Action): RunnerState {
  switch (action.type) {
    case 'init': {
      const raw = generate(action.distribution, action.count);
      const items = raw.map((value, i) => ({ id: i, value }));
      const next = rebuild(
        { ...state, distribution: action.distribution, count: action.count, speed: action.speed },
        items,
        action.algorithmId,
      );
      return next;
    }
    case 'set-algorithm':
      return rebuild(state, state.baseItems, action.algorithmId);
    case 'set-distribution': {
      const raw = generate(action.distribution, state.count);
      const items = raw.map((value, i) => ({ id: i, value }));
      return rebuild({ ...state, distribution: action.distribution }, items, state.algorithmId);
    }
    case 'set-count': {
      const raw = generate(state.distribution, action.count);
      const items = raw.map((value, i) => ({ id: i, value }));
      return rebuild({ ...state, count: action.count }, items, state.algorithmId);
    }
    case 'set-speed':
      return { ...state, speed: action.speed };
    case 'shuffle': {
      const raw = generate(state.distribution, state.count);
      const items = raw.map((value, i) => ({ id: i, value }));
      return rebuild(state, items, state.algorithmId);
    }
    case 'play':
      if (state.stepIndex >= state.events.length) return state;
      return { ...state, status: 'playing' };
    case 'pause':
      return state.status === 'playing' ? { ...state, status: 'paused' } : state;
    case 'reset':
      return rebuild(state, state.baseItems, state.algorithmId);
    case 'step-forward': {
      if (state.stepIndex >= state.events.length) return state;
      const ev = state.events[state.stepIndex];
      const next = applyEvent(state, ev, true);
      const stepIndex = state.stepIndex + 1;
      const done = stepIndex >= state.events.length;
      return {
        ...next,
        stepIndex,
        status: done ? 'done' : state.status === 'playing' ? 'playing' : 'paused',
      };
    }
    case 'step-back': {
      if (state.stepIndex <= 0) return state;
      const targetIndex = state.stepIndex - 1;
      const rebuilt = recomputeFromScratch(state, targetIndex);
      return { ...rebuilt, stepIndex: targetIndex, status: 'paused' };
    }
    case 'advance': {
      if (state.status !== 'playing') return state;
      if (state.stepIndex >= state.events.length) return { ...state, status: 'done' };
      let stepIndex = state.stepIndex;
      let current: RunnerState = state;
      const max = Math.min(action.steps, state.events.length - stepIndex);
      for (let i = 0; i < max; i++) {
        const ev = state.events[stepIndex];
        current = applyEvent(current, ev, true);
        stepIndex += 1;
      }
      const done = stepIndex >= state.events.length;
      return {
        ...current,
        stepIndex,
        status: done ? 'done' : 'playing',
        stats: { ...current.stats, elapsedMs: current.stats.elapsedMs + action.dtMs },
      };
    }
  }
}

export interface UseSortRunnerArgs {
  initialAlgorithmId: string;
  initialDistribution: Distribution;
  initialCount: number;
  initialSpeed: number;
  soundEnabled: boolean;
}

function makeInitialState(args: UseSortRunnerArgs): RunnerState {
  const raw = generate(args.initialDistribution, args.initialCount);
  const items = raw.map((value, i) => ({ id: i, value }));
  const base: RunnerState = {
    algorithmId: args.initialAlgorithmId,
    distribution: args.initialDistribution,
    count: args.initialCount,
    baseItems: items,
    events: [],
    snapshots: [],
    stepIndex: 0,
    items,
    status: 'idle',
    stats: { comparisons: 0, swaps: 0, writes: 0, elapsedMs: 0 },
    highlights: {},
    maxValue: items.reduce((m, it) => Math.max(m, it.value), 1),
    speed: args.initialSpeed,
    accumulator: 0,
  };
  return rebuild(base, items, args.initialAlgorithmId);
}

export function useSortRunner(args: UseSortRunnerArgs) {
  const [state, dispatch] = useReducer(reducer, args, makeInitialState);
  const soundRef = useRef(args.soundEnabled);
  soundRef.current = args.soundEnabled;

  const pendingRef = useRef(0);

  useAnimationFrame(state.status === 'playing', (dt) => {
    const stepsPerSec = 8 * state.speed;
    pendingRef.current += (dt / 1000) * stepsPerSec;
    const whole = Math.floor(pendingRef.current);
    if (whole <= 0) return;
    pendingRef.current -= whole;

    if (soundRef.current) {
      const playSteps = Math.min(whole, 4);
      const end = Math.min(state.events.length, state.stepIndex + whole);
      const start = Math.max(state.stepIndex, end - playSteps);
      for (let k = start; k < end; k++) {
        const ev = state.events[k];
        if (ev.type === 'swap') {
          const v = state.items[ev.indices[0]]?.value ?? 1;
          quack(v, state.maxValue);
        } else if (ev.type === 'compare') {
          const v = state.items[ev.indices[0]]?.value ?? 1;
          splash(v, state.maxValue);
        }
      }
    }

    dispatch({ type: 'advance', steps: whole, dtMs: dt });
  });

  const actions = useMemo(
    () => ({
      setAlgorithm: (algorithmId: string) => dispatch({ type: 'set-algorithm', algorithmId }),
      setDistribution: (distribution: Distribution) => dispatch({ type: 'set-distribution', distribution }),
      setCount: (count: number) => dispatch({ type: 'set-count', count }),
      setSpeed: (speed: number) => dispatch({ type: 'set-speed', speed }),
      shuffle: () => dispatch({ type: 'shuffle' }),
      play: () => dispatch({ type: 'play' }),
      pause: () => dispatch({ type: 'pause' }),
      reset: () => dispatch({ type: 'reset' }),
      stepForward: () => dispatch({ type: 'step-forward' }),
      stepBack: () => dispatch({ type: 'step-back' }),
    }),
    [],
  );

  // Auto-pause when done
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

  return { state, actions, toggle };
}
