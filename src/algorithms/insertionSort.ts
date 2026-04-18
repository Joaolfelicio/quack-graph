import type { SortAlgorithm, SortEvent } from './types';

function* run(input: number[]): Generator<SortEvent> {
  const a = input.slice();
  const n = a.length;
  for (let i = 1; i < n; i++) {
    let j = i;
    while (j > 0) {
      yield { type: 'compare', indices: [j - 1, j] };
      if (a[j - 1] > a[j]) {
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
        yield { type: 'swap', indices: [j - 1, j] };
        j--;
      } else break;
    }
  }
  yield { type: 'mark-all-sorted' };
}

export const insertionSort: SortAlgorithm = {
  id: 'insertion',
  name: 'Insertion Sort',
  category: 'comparison',
  stable: true,
  inPlace: true,
  blurb: 'Grow a sorted row on the left by slipping each new duck into place.',
  complexity: {
    time: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
    space: 'O(1)',
  },
  run,
};
