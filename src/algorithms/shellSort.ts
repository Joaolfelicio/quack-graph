import type { SortAlgorithm, SortEvent } from './types';

function* run(input: number[]): Generator<SortEvent> {
  const a = input.slice();
  const n = a.length;
  for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
    for (let i = gap; i < n; i++) {
      let j = i;
      while (j >= gap) {
        yield { type: 'compare', indices: [j - gap, j] };
        if (a[j - gap] > a[j]) {
          [a[j - gap], a[j]] = [a[j], a[j - gap]];
          yield { type: 'swap', indices: [j - gap, j] };
          j -= gap;
        } else break;
      }
    }
  }
  yield { type: 'mark-all-sorted' };
}

export const shellSort: SortAlgorithm = {
  id: 'shell',
  name: 'Shell Sort',
  category: 'comparison',
  stable: false,
  inPlace: true,
  blurb: 'Insertion sort with decreasing gaps. Knocks out large disorder fast.',
  complexity: {
    time: { best: 'O(n log n)', average: 'O(n^1.25)', worst: 'O(n²)' },
    space: 'O(1)',
  },
  run,
};
