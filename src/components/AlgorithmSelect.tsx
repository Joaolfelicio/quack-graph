import { useEffect, useRef, useState } from 'react';
import type { SortAlgorithm } from '../algorithms/types';
import { cn } from '../lib/cn';

interface Props {
  id?: string;
  algorithms: SortAlgorithm[];
  value: string;
  onChange: (id: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  comparison: 'Comparison',
  distribution: 'Distribution',
  hybrid: 'Hybrid',
};

export function AlgorithmSelect({ id, algorithms, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = algorithms.find((a) => a.id === value);

  const grouped = Object.entries(
    algorithms.reduce<Record<string, SortAlgorithm[]>>((acc, a) => {
      (acc[a.category] ??= []).push(a);
      return acc;
    }, {}),
  );

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  function select(id: string) {
    onChange(id);
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-pond-200 bg-white px-3 py-2 text-sm font-medium text-pond-900 shadow-sm focus:border-pond-400 focus:outline-none dark:border-pond-700 dark:bg-pond-900 dark:text-pond-50"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selected?.name ?? 'Select…'}</span>
        <svg
          className={cn('h-4 w-4 text-pond-400 transition-transform', open && 'rotate-180')}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          aria-label="Algorithm"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-pond-200 bg-white py-1 shadow-lg dark:border-pond-700 dark:bg-pond-900"
        >
          {grouped.map(([category, algos]) => (
            <div key={category}>
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-pond-400 dark:text-pond-500">
                {CATEGORY_LABELS[category] ?? category}
              </div>
              {algos.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="option"
                  aria-selected={a.id === value}
                  onClick={() => select(a.id)}
                  className={cn(
                    'flex w-full items-center justify-between px-3 py-1.5 text-sm transition',
                    a.id === value
                      ? 'bg-pond-100 font-semibold text-pond-900 dark:bg-pond-800 dark:text-pond-50'
                      : 'text-pond-800 hover:bg-pond-50 dark:text-pond-200 dark:hover:bg-pond-800/60',
                  )}
                >
                  <span>{a.name}</span>
                  <span className="ml-2 shrink-0 rounded bg-pond-100 px-1.5 py-0.5 font-mono text-[10px] text-pond-500 dark:bg-pond-800 dark:text-pond-400">
                    {a.complexity.time.worst}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
