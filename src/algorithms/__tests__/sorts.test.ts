import { describe, expect, it } from 'vitest';
import { ALGORITHMS } from '..';
import type { SortEvent } from '../types';

function applyEvents(input: number[], events: Iterable<SortEvent>): number[] {
  const a = input.slice();
  for (const ev of events) {
    if (ev.type === 'swap') {
      const [i, j] = ev.indices;
      [a[i], a[j]] = [a[j], a[i]];
    } else if (ev.type === 'overwrite') {
      a[ev.index] = ev.value;
    }
  }
  return a;
}

function sortedCopy(a: number[]): number[] {
  return a.slice().sort((x, y) => x - y);
}

const CASES: Record<string, number[]> = {
  empty: [],
  single: [7],
  allEqual: [3, 3, 3, 3, 3, 3],
  alreadySorted: [1, 2, 3, 4, 5, 6, 7, 8],
  reversed: [8, 7, 6, 5, 4, 3, 2, 1],
  mixed: [5, 1, 4, 2, 8, 7, 6, 3],
  fewUnique: [2, 4, 2, 4, 2, 4, 2, 4, 2, 4],
  random: (() => {
    const out: number[] = [];
    const seed = [3, 9, 1, 7, 5, 4, 6, 2, 8, 10, 11, 14, 12, 13, 15];
    for (const n of seed) out.push(n);
    return out;
  })(),
};

describe('sort algorithms', () => {
  for (const algo of ALGORITHMS) {
    describe(algo.name, () => {
      for (const [caseName, input] of Object.entries(CASES)) {
        it(`sorts ${caseName}`, () => {
          const events = algo.run(input);
          const result = applyEvents(input, events);
          expect(result).toEqual(sortedCopy(input));
        });
      }

      it('produces a terminal mark-all-sorted event', () => {
        const events = Array.from(algo.run([3, 1, 2]));
        expect(events[events.length - 1]?.type).toBe('mark-all-sorted');
      });

      it('does not mutate input', () => {
        const input = [5, 2, 4, 1, 3];
        const snapshot = input.slice();
        Array.from(algo.run(input));
        expect(input).toEqual(snapshot);
      });
    });
  }
});
