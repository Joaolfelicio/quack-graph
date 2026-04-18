import type { SortAlgorithm, SortEvent } from './types';

function* mergeSortRange(a: number[], lo: number, hi: number): Generator<SortEvent> {
  if (hi - lo <= 1) return;
  const mid = (lo + hi) >> 1;
  yield* mergeSortRange(a, lo, mid);
  yield* mergeSortRange(a, mid, hi);
  yield* merge(a, lo, mid, hi);
}

function* merge(a: number[], lo: number, mid: number, hi: number): Generator<SortEvent> {
  yield { type: 'highlight', indices: rangeArr(lo, hi), role: 'range' };
  const left = a.slice(lo, mid);
  const right = a.slice(mid, hi);
  let i = 0, j = 0, k = lo;
  while (i < left.length && j < right.length) {
    yield { type: 'compare', indices: [lo + i, mid + j] };
    if (left[i] <= right[j]) {
      a[k] = left[i++];
      yield { type: 'overwrite', index: k, value: a[k] };
    } else {
      a[k] = right[j++];
      yield { type: 'overwrite', index: k, value: a[k] };
    }
    k++;
  }
  while (i < left.length) {
    a[k] = left[i++];
    yield { type: 'overwrite', index: k, value: a[k] };
    k++;
  }
  while (j < right.length) {
    a[k] = right[j++];
    yield { type: 'overwrite', index: k, value: a[k] };
    k++;
  }
  yield { type: 'unhighlight' };
}

function rangeArr(lo: number, hi: number): number[] {
  const out: number[] = [];
  for (let i = lo; i < hi; i++) out.push(i);
  return out;
}

function* run(input: number[]): Generator<SortEvent> {
  const a = input.slice();
  yield* mergeSortRange(a, 0, a.length);
  yield { type: 'mark-all-sorted' };
}

export const mergeSort: SortAlgorithm = {
  id: 'merge',
  name: 'Merge Sort',
  category: 'comparison',
  stable: true,
  inPlace: false,
  blurb: 'Split, sort halves, merge. Guaranteed O(n log n).',
  complexity: {
    time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
    space: 'O(n)',
  },
  run,
};
