import type { SortAlgorithm, SortEvent } from './types';

function* run(input: number[]): Generator<SortEvent> {
  const a = input.slice();
  const n = a.length;
  for (let i = 0; i < n - 1; i++) {
    let swapped = false;
    for (let j = 0; j < n - 1 - i; j++) {
      yield { type: 'compare', indices: [j, j + 1] };
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        yield { type: 'swap', indices: [j, j + 1] };
        swapped = true;
      }
    }
    yield { type: 'mark-sorted', index: n - 1 - i };
    if (!swapped) break;
  }
  yield { type: 'mark-all-sorted' };
}

export const bubbleSort: SortAlgorithm = {
  id: 'bubble',
  name: 'Bubble Sort',
  category: 'comparison',
  stable: true,
  inPlace: true,
  blurb: 'Repeatedly swap adjacent ducks if out of order. Big ducks bubble to the top.',
  complexity: {
    time: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
    space: 'O(1)',
  },
  run,
};
