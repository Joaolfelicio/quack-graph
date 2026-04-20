import { memo } from 'react';
import { ALGORITHMS } from '../algorithms';
import type { AlgorithmCategory } from '../algorithms/types';
import { cn } from '../lib/cn';

const CATEGORY_LABELS: Record<AlgorithmCategory, string> = {
  traversal: 'Traversal',
  'shortest-path': 'Shortest Path',
  mst: 'Min Spanning Tree',
  advanced: 'Advanced',
};

const CATEGORY_ORDER: AlgorithmCategory[] = ['traversal', 'shortest-path', 'mst', 'advanced'];

interface Props {
  selectedId: string;
  onChange: (id: string) => void;
}

export const AlgorithmSelect = memo(function AlgorithmSelect({ selectedId, onChange }: Props) {
  const byCategory = CATEGORY_ORDER.map(cat => ({
    cat,
    algos: ALGORITHMS.filter(a => a.meta.category === cat),
  }));

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wide text-pond-600 dark:text-pond-300">Algorithm</label>
      {byCategory.map(({ cat, algos }) => (
        <div key={cat}>
          <div className="mb-0.5 mt-2 text-[10px] uppercase tracking-wider text-pond-500 dark:text-pond-400">
            {CATEGORY_LABELS[cat]}
          </div>
          {algos.map(a => (
            <button
              key={a.meta.id}
              type="button"
              onClick={() => onChange(a.meta.id)}
              className={cn(
                'w-full rounded-lg px-3 py-1.5 text-left text-sm transition',
                selectedId === a.meta.id
                  ? 'bg-duck-100 font-semibold text-duck-900 dark:bg-duck-900/40 dark:text-duck-100'
                  : 'text-pond-700 hover:bg-pond-100 dark:text-pond-200 dark:hover:bg-pond-800',
              )}
            >
              {a.meta.name}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
});
