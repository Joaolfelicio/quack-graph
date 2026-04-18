export type Distribution = 'random' | 'nearly-sorted' | 'reversed' | 'few-unique' | 'custom';

export const DISTRIBUTIONS: { id: Distribution; label: string }[] = [
  { id: 'random', label: 'Random' },
  { id: 'nearly-sorted', label: 'Nearly sorted' },
  { id: 'reversed', label: 'Reversed' },
  { id: 'few-unique', label: 'Few unique' },
];

export function generate(distribution: Distribution, count: number, maxValue = 30): number[] {
  const values = Array.from({ length: count }, (_, i) =>
    1 + Math.floor(((i + 1) / count) * (maxValue - 1)),
  );
  switch (distribution) {
    case 'random':
      return shuffle(values);
    case 'reversed':
      return values.slice().reverse();
    case 'nearly-sorted': {
      const out = values.slice();
      const swaps = Math.max(1, Math.floor(count * 0.05));
      for (let i = 0; i < swaps; i++) {
        const a = Math.floor(Math.random() * count);
        const b = Math.floor(Math.random() * count);
        [out[a], out[b]] = [out[b], out[a]];
      }
      return out;
    }
    case 'few-unique': {
      const buckets = Math.min(5, Math.max(2, Math.floor(count / 6)));
      const palette = Array.from({ length: buckets }, (_, i) =>
        1 + Math.floor(((i + 1) / buckets) * (maxValue - 1)),
      );
      return shuffle(Array.from({ length: count }, () => palette[Math.floor(Math.random() * buckets)]));
    }
    case 'custom':
      return shuffle(values);
  }
}

function shuffle<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
