import type { SortAlgorithm, SortEvent } from './types';

const SHRINK = 1.3;

function* run(input: number[]): Generator<SortEvent> {
  const a = input.slice();
  const n = a.length;
  let gap = n;
  let sorted = false;
  while (!sorted) {
    gap = Math.floor(gap / SHRINK);
    if (gap <= 1) { gap = 1; sorted = true; }
    for (let i = 0; i + gap < n; i++) {
      yield { type: 'compare', indices: [i, i + gap] };
      if (a[i] > a[i + gap]) {
        [a[i], a[i + gap]] = [a[i + gap], a[i]];
        yield { type: 'swap', indices: [i, i + gap] };
        sorted = false;
      }
    }
  }
  yield { type: 'mark-all-sorted' };
}

export const combSort: SortAlgorithm = {
  id: 'comb',
  name: 'Comb Sort',
  category: 'comparison',
  stable: false,
  inPlace: true,
  blurb: 'Bubble sort with a shrinking gap. Faster finish than plain bubble.',
  complexity: {
    time: { best: 'O(n log n)', average: 'O(n²/2ᵖ)', worst: 'O(n²)' },
    space: 'O(1)',
  },
  run,
};
