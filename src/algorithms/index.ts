import type { SortAlgorithm } from './types';
import { bubbleSort } from './bubbleSort';
import { cocktailShaker } from './cocktailShaker';
import { insertionSort } from './insertionSort';
import { selectionSort } from './selectionSort';
import { gnomeSort } from './gnomeSort';
import { oddEvenSort } from './oddEvenSort';
import { combSort } from './combSort';
import { shellSort } from './shellSort';
import { mergeSort } from './mergeSort';
import { quickSort } from './quickSort';
import { heapSort } from './heapSort';
import { pancakeSort } from './pancakeSort';
import { countingSort } from './countingSort';
import { radixSort } from './radixSort';
import { bucketSort } from './bucketSort';

export const ALGORITHMS: SortAlgorithm[] = [
  bubbleSort,
  cocktailShaker,
  insertionSort,
  selectionSort,
  gnomeSort,
  oddEvenSort,
  combSort,
  shellSort,
  mergeSort,
  quickSort,
  heapSort,
  pancakeSort,
  countingSort,
  radixSort,
  bucketSort,
];

export const ALGORITHMS_BY_ID: Record<string, SortAlgorithm> = Object.fromEntries(
  ALGORITHMS.map((a) => [a.id, a]),
);

export type { SortAlgorithm } from './types';
