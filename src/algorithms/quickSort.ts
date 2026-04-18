import type { SortAlgorithm, SortEvent } from './types';

function* quick(a: number[], lo: number, hi: number): Generator<SortEvent> {
  if (lo >= hi) {
    if (lo === hi) yield { type: 'mark-sorted', index: lo };
    return;
  }
  const pivot = a[hi];
  yield { type: 'highlight', indices: [hi], role: 'pivot' };
  let i = lo;
  for (let j = lo; j < hi; j++) {
    yield { type: 'compare', indices: [j, hi] };
    if (a[j] < pivot) {
      if (i !== j) {
        [a[i], a[j]] = [a[j], a[i]];
        yield { type: 'swap', indices: [i, j] };
      }
      i++;
    }
  }
  if (i !== hi) {
    [a[i], a[hi]] = [a[hi], a[i]];
    yield { type: 'swap', indices: [i, hi] };
  }
  yield { type: 'unhighlight' };
  yield { type: 'mark-sorted', index: i };
  yield* quick(a, lo, i - 1);
  yield* quick(a, i + 1, hi);
}

function* run(input: number[]): Generator<SortEvent> {
  const a = input.slice();
  yield* quick(a, 0, a.length - 1);
  yield { type: 'mark-all-sorted' };
}

export const quickSort: SortAlgorithm = {
  id: 'quick',
  name: 'Quick Sort',
  category: 'comparison',
  stable: false,
  inPlace: true,
  blurb: 'Pick a pivot duck, partition smaller/bigger, recurse.',
  complexity: {
    time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)' },
    space: 'O(log n)',
  },
  run,
};
