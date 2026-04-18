export type HighlightRole = 'compare' | 'swap' | 'pivot' | 'sorted' | 'cursor' | 'range';

export type SortEvent =
  | { type: 'compare'; indices: [number, number] }
  | { type: 'swap'; indices: [number, number] }
  | { type: 'overwrite'; index: number; value: number }
  | { type: 'mark-sorted'; index: number }
  | { type: 'mark-all-sorted' }
  | { type: 'highlight'; indices: number[]; role: HighlightRole }
  | { type: 'unhighlight' };

export interface Complexity {
  time: { best: string; average: string; worst: string };
  space: string;
}

export interface SortAlgorithm {
  id: string;
  name: string;
  category: 'comparison' | 'distribution' | 'hybrid';
  stable: boolean;
  inPlace: boolean;
  blurb: string;
  complexity: Complexity;
  run(values: number[]): Generator<SortEvent, void, void>;
}
