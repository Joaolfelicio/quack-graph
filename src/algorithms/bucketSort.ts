import type { SortAlgorithm, SortEvent } from './types';

function* run(input: number[]): Generator<SortEvent> {
  const a = input.slice();
  const n = a.length;
  if (n === 0) { yield { type: 'mark-all-sorted' }; return; }
  let max = a[0];
  for (let i = 1; i < n; i++) if (a[i] > max) max = a[i];
  const bucketCount = Math.max(1, Math.floor(Math.sqrt(n)));
  const buckets: number[][] = Array.from({ length: bucketCount }, () => []);
  for (let i = 0; i < n; i++) {
    yield { type: 'highlight', indices: [i], role: 'cursor' };
    const idx = Math.min(bucketCount - 1, Math.floor((a[i] / (max + 1)) * bucketCount));
    buckets[idx].push(a[i]);
  }
  let k = 0;
  for (const bucket of buckets) {
    bucket.sort((x, y) => x - y);
    for (const v of bucket) {
      a[k] = v;
      yield { type: 'overwrite', index: k, value: v };
      yield { type: 'mark-sorted', index: k };
      k++;
    }
  }
  yield { type: 'mark-all-sorted' };
}

export const bucketSort: SortAlgorithm = {
  id: 'bucket',
  name: 'Bucket Sort',
  category: 'distribution',
  stable: true,
  inPlace: false,
  blurb: 'Drop ducks into size buckets, sort each bucket, concatenate.',
  complexity: {
    time: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n²)' },
    space: 'O(n + k)',
  },
  run,
};
