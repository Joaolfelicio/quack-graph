import type { SortAlgorithm, SortEvent } from './types';

function* siftDown(a: number[], start: number, end: number): Generator<SortEvent> {
  let root = start;
  while (root * 2 + 1 <= end) {
    const child = root * 2 + 1;
    let swap = root;
    yield { type: 'compare', indices: [swap, child] };
    if (a[swap] < a[child]) swap = child;
    if (child + 1 <= end) {
      yield { type: 'compare', indices: [swap, child + 1] };
      if (a[swap] < a[child + 1]) swap = child + 1;
    }
    if (swap === root) return;
    [a[root], a[swap]] = [a[swap], a[root]];
    yield { type: 'swap', indices: [root, swap] };
    root = swap;
  }
}

function* run(input: number[]): Generator<SortEvent> {
  const a = input.slice();
  const n = a.length;
  for (let start = (n - 2) >> 1; start >= 0; start--) {
    yield* siftDown(a, start, n - 1);
  }
  for (let end = n - 1; end > 0; end--) {
    [a[0], a[end]] = [a[end], a[0]];
    yield { type: 'swap', indices: [0, end] };
    yield { type: 'mark-sorted', index: end };
    yield* siftDown(a, 0, end - 1);
  }
  yield { type: 'mark-all-sorted' };
}

export const heapSort: SortAlgorithm = {
  id: 'heap',
  name: 'Heap Sort',
  category: 'comparison',
  stable: false,
  inPlace: true,
  blurb: 'Build a max-heap, repeatedly pop biggest duck to the end.',
  complexity: {
    time: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
    space: 'O(1)',
  },
  run,
};
