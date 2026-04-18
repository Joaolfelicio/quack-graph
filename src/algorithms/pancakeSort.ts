import type { SortAlgorithm, SortEvent } from './types';

function* flip(a: number[], k: number): Generator<SortEvent> {
  let i = 0, j = k;
  while (i < j) {
    [a[i], a[j]] = [a[j], a[i]];
    yield { type: 'swap', indices: [i, j] };
    i++; j--;
  }
}

function* run(input: number[]): Generator<SortEvent> {
  const a = input.slice();
  for (let size = a.length; size > 1; size--) {
    let maxIdx = 0;
    for (let i = 1; i < size; i++) {
      yield { type: 'compare', indices: [maxIdx, i] };
      if (a[i] > a[maxIdx]) maxIdx = i;
    }
    if (maxIdx !== size - 1) {
      if (maxIdx > 0) yield* flip(a, maxIdx);
      yield* flip(a, size - 1);
    }
    yield { type: 'mark-sorted', index: size - 1 };
  }
  yield { type: 'mark-all-sorted' };
}

export const pancakeSort: SortAlgorithm = {
  id: 'pancake',
  name: 'Pancake Sort',
  category: 'comparison',
  stable: false,
  inPlace: true,
  blurb: 'Only move: flip a prefix. Keep flipping the biggest duck to the end.',
  complexity: {
    time: { best: 'O(n²)', average: 'O(n²)', worst: 'O(n²)' },
    space: 'O(1)',
  },
  run,
};
