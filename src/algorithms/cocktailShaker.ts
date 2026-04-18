import type { SortAlgorithm, SortEvent } from './types';

function* run(input: number[]): Generator<SortEvent> {
  const a = input.slice();
  let lo = 0;
  let hi = a.length - 1;
  let swapped = true;
  while (swapped) {
    swapped = false;
    for (let i = lo; i < hi; i++) {
      yield { type: 'compare', indices: [i, i + 1] };
      if (a[i] > a[i + 1]) {
        [a[i], a[i + 1]] = [a[i + 1], a[i]];
        yield { type: 'swap', indices: [i, i + 1] };
        swapped = true;
      }
    }
    yield { type: 'mark-sorted', index: hi };
    hi--;
    if (!swapped) break;
    swapped = false;
    for (let i = hi; i > lo; i--) {
      yield { type: 'compare', indices: [i - 1, i] };
      if (a[i - 1] > a[i]) {
        [a[i - 1], a[i]] = [a[i], a[i - 1]];
        yield { type: 'swap', indices: [i - 1, i] };
        swapped = true;
      }
    }
    yield { type: 'mark-sorted', index: lo };
    lo++;
  }
  yield { type: 'mark-all-sorted' };
}

export const cocktailShaker: SortAlgorithm = {
  id: 'cocktail',
  name: 'Cocktail Shaker Sort',
  category: 'comparison',
  stable: true,
  inPlace: true,
  blurb: 'Bubble sort, but the ducks slosh both directions.',
  complexity: {
    time: { best: 'O(n)', average: 'O(n²)', worst: 'O(n²)' },
    space: 'O(1)',
  },
  run,
};
