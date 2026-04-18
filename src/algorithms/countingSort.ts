import type { SortAlgorithm, SortEvent } from './types';

function* run(input: number[]): Generator<SortEvent> {
  const a = input.slice();
  const n = a.length;
  if (n === 0) { yield { type: 'mark-all-sorted' }; return; }
  let max = a[0];
  for (let i = 1; i < n; i++) if (a[i] > max) max = a[i];
  const counts = new Array<number>(max + 1).fill(0);
  for (let i = 0; i < n; i++) {
    yield { type: 'highlight', indices: [i], role: 'cursor' };
    counts[a[i]]++;
  }
  let write = 0;
  for (let v = 0; v <= max; v++) {
    while (counts[v]-- > 0) {
      a[write] = v;
      yield { type: 'overwrite', index: write, value: v };
      yield { type: 'mark-sorted', index: write };
      write++;
    }
  }
  yield { type: 'mark-all-sorted' };
}

export const countingSort: SortAlgorithm = {
  id: 'counting',
  name: 'Counting Sort',
  category: 'distribution',
  stable: true,
  inPlace: false,
  blurb: 'Count how many ducks of each size, then write them back in order.',
  complexity: {
    time: { best: 'O(n + k)', average: 'O(n + k)', worst: 'O(n + k)' },
    space: 'O(n + k)',
  },
  run,
};
