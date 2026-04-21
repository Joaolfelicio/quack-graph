import type { NodeRole, EdgeRole } from '../algorithms/types';

export const NODE_FILL: Record<NodeRole, string> = {
  default:   '#bfdbfe',
  frontier:  '#fef3c7',
  visited:   '#bfdbfe',
  finished:  '#fed7aa',
  current:   '#fde68a',
  path:      '#fcd34d',
  source:    '#4ade80',
  target:    '#f87171',
  scc0:      '#60a5fa',
  scc1:      '#34d399',
  scc2:      '#fbbf24',
  scc3:      '#f472b6',
  scc4:      '#a78bfa',
  scc5:      '#fb923c',
};

export const NODE_STROKE: Record<NodeRole, string> = {
  default:   '#93c5fd',
  frontier:  '#fcd34d',
  visited:   '#60a5fa',
  finished:  '#fb923c',
  current:   '#f59e0b',
  path:      '#b45309',
  source:    '#16a34a',
  target:    '#dc2626',
  scc0:      '#3b82f6',
  scc1:      '#10b981',
  scc2:      '#d97706',
  scc3:      '#db2777',
  scc4:      '#7c3aed',
  scc5:      '#ea580c',
};

export const EDGE_STROKE: Record<EdgeRole, string> = {
  default:    '#93c5fd',
  considered: '#1d4ed8',
  relaxed:    '#f59e0b',
  tree:       '#059669',
  mst:        '#059669',
  path:       '#f59e0b',
  cross:      '#a855f7',
  back:       '#ef4444',
  forward:    '#06b6d4',
  cut:        '#ef4444',
  residual:   '#d1d5db',
};

export const EDGE_WIDTH: Partial<Record<EdgeRole, number>> = {
  mst: 3, tree: 3, path: 4, cut: 2,
};

export const NODE_STROKE_WIDTH: Partial<Record<NodeRole, number>> = {
  path: 3,
  current: 3,
};

export interface LegendItem {
  fill: string;
  stroke: string;
  label: string;
}

export const LEGEND_ITEMS: LegendItem[] = [
  { fill: NODE_FILL.current,  stroke: NODE_STROKE.current,  label: 'Current' },
  { fill: NODE_FILL.visited,  stroke: NODE_STROKE.visited,  label: 'Visited' },
  { fill: NODE_FILL.finished, stroke: NODE_STROKE.finished, label: 'Finished' },
  { fill: NODE_FILL.frontier, stroke: NODE_STROKE.frontier, label: 'Frontier' },
  { fill: NODE_FILL.source,   stroke: NODE_STROKE.source,   label: 'Source' },
  { fill: NODE_FILL.target,   stroke: NODE_STROKE.target,   label: 'Target' },
  { fill: NODE_FILL.path,     stroke: NODE_STROKE.path,     label: 'Path' },
  { fill: EDGE_STROKE.mst,    stroke: '#047857',            label: 'MST/Tree' },
];
