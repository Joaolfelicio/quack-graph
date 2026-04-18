import type { SortAlgorithm, SortEvent } from './types';

function* run(input: number[]): Generator<SortEvent> {
  const a = input.slice();
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    yield { type: 'highlight', indices: [min], role: 'cursor' };
    for (let j = i + 1; j < n; j++) {
      yield { type: 'compare', indices: [min, j] };
      if (a[j] < a[min]) {
        min = j;
        yield { type: 'highlight', indices: [min], role: 'cursor' };
      }
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      yield { type: 'swap', indices: [i, min] };
    }
    yield { type: 'mark-sorted', index: i };
  }
  yield { type: 'mark-all-sorted' };
}

export const selectionSort: SortAlgorithm = {
  id: 'selection',
  name: 'Selection Sort',
  category: 'comparison',
  stable: false,
  inPlace: true,
  blurb: 'Find the smallest duck, put it first. Repeat.',
  complexity: {
    time: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' },
    space: 'O(1)',
  },
  run,
};
