import type { SortAlgorithm, SortEvent } from './types';

function* run(input: number[]): Generator<SortEvent> {
  const a = input.slice();
  const n = a.length;
  let i = 0;
  while (i < n) {
    if (i === 0) { i++; continue; }
    yield { type: 'compare', indices: [i - 1, i] };
    if (a[i - 1] <= a[i]) {
      i++;
    } else {
      [a[i - 1], a[i]] = [a[i], a[i - 1]];
      yield { type: 'swap', indices: [i - 1, i] };
      i--;
    }
  }
  yield { type: 'mark-all-sorted' };
}

export const gnomeSort: SortAlgorithm = {
  id: 'gnome',
  name: 'Gnome Sort',
  category: 'comparison',
  stable: true,
  inPlace: true,
  blurb: 'Walk forward; if out of order, step back and swap. Repeat.',
  complexity: {
    time: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
    space: 'O(1)',
  },
  run,
};
