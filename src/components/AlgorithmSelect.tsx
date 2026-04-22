import { useEffect, useRef, useState } from 'react';
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

export function AlgorithmSelect({ selectedId, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = ALGORITHMS.find(a => a.meta.id === selectedId);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function select(id: string) {
    onChange(id);
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-pond-600 dark:text-pond-300">Algorithm</label>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-pond-200 bg-white px-3 py-2 text-sm font-medium text-pond-900 shadow-sm focus:border-pond-400 focus:outline-none dark:border-pond-700 dark:bg-pond-900 dark:text-pond-50"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span>{selected?.meta.name ?? 'Select…'}</span>
          <svg
            className={cn('h-4 w-4 text-pond-400 transition-transform', open && 'rotate-180')}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </button>

        {open && (
          <div
            role="listbox"
            aria-label="Algorithm"
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-pond-200 bg-white py-1 shadow-lg dark:border-pond-700 dark:bg-pond-900"
          >
            {CATEGORY_ORDER.map(cat => {
              const algos = ALGORITHMS.filter(a => a.meta.category === cat);
              return (
                <div key={cat}>
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-pond-400 dark:text-pond-500">
                    {CATEGORY_LABELS[cat]}
                  </div>
                  {algos.map(a => (
                    <button
                      key={a.meta.id}
                      type="button"
                      role="option"
                      aria-selected={a.meta.id === selectedId}
                      onClick={() => select(a.meta.id)}
                      className={cn(
                        'flex w-full items-center px-3 py-1.5 text-sm transition',
                        a.meta.id === selectedId
                          ? 'bg-pond-100 font-semibold text-pond-900 dark:bg-pond-800 dark:text-pond-50'
                          : 'text-pond-800 hover:bg-pond-50 dark:text-pond-200 dark:hover:bg-pond-800/60',
                      )}
                    >
                      {a.meta.name}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
