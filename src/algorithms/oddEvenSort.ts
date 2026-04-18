import type { SortAlgorithm, SortEvent } from './types';

function* run(input: number[]): Generator<SortEvent> {
  const a = input.slice();
  const n = a.length;
  let sorted = false;
  while (!sorted) {
    sorted = true;
    for (let i = 1; i < n - 1; i += 2) {
      yield { type: 'compare', indices: [i, i + 1] };
      if (a[i] > a[i + 1]) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        yield { type: 'swap', indices: [i, i + 1] };
        sorted = false;
      }
    }
    for (let i = 0; i < n - 1; i += 2) {
      yield { type: 'compare', indices: [i, i + 1] };
      if (a[i] > a[i + 1]) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        yield { type: 'swap', indices: [i, i + 1] };
        sorted = false;
      }
    }
  }
  yield { type: 'mark-all-sorted' };
}

export const oddEvenSort: SortAlgorithm = {
  id: 'odd-even',
  name: 'Odd-Even (Brick) Sort',
  category: 'comparison',
  stable: true,
  inPlace: true,
  blurb: 'Alternate odd and even index compare-swaps. Parallel-friendly.',
  complexity: {
    time: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
    space: 'O(1)',
  },
  run,
};
