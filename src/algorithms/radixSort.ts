import type { SortAlgorithm, SortEvent } from './types';

function* run(input: number[]): Generator<SortEvent> {
  const a = input.slice();
  const n = a.length;
  if (n === 0) { yield { type: 'mark-all-sorted' }; return; }
  let max = a[0];
  for (let i = 1; i < n; i++) if (a[i] > max) max = a[i];
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    const buckets: number[][] = Array.from({ length: 10 }, () => []);
    for (let i = 0; i < n; i++) {
      yield { type: 'highlight', indices: [i], role: 'cursor' };
      buckets[Math.floor(a[i] / exp) % 10].push(a[i]);
    }
    let k = 0;
    for (let d = 0; d < 10; d++) {
      for (const v of buckets[d]) {
        a[k] = v;
        yield { type: 'overwrite', index: k, value: v };
        k++;
      }
    }
  }
  yield { type: 'mark-all-sorted' };
}

export const radixSort: SortAlgorithm = {
  id: 'radix',
  name: 'Radix Sort (LSD)',
  category: 'distribution',
  stable: true,
  inPlace: false,
  blurb: 'Sort by last digit, then next, then next. No comparisons needed.',
  complexity: {
    time: { best: 'O(d·(n+b))', average: 'O(d·(n+b))', worst: 'O(d·(n+b))' },
    space: 'O(n + b)',
  },
  run,
};
