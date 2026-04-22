import { useEffect, useRef, useState } from 'react';
import { PRESET_IDS, type PresetId } from '../lib/graphs';
import type { GraphSource } from '../hooks/useGraphRunner';
import { cn } from '../lib/cn';

const PRESET_LABELS: Record<PresetId, string> = {
  'tree-8': 'Tree (8 nodes)',
  'dag-10': 'DAG (10 nodes)',
  'weighted-mesh-9': 'Weighted Mesh (9)',
  'neg-cycle-6': 'Negative Cycle (6)',
  'grid-4x4': 'Grid 4×4',
  'scc-8': 'SCC Graph (8)',
  'flow-net': 'Flow Network (6)',
  'disconnected-9': 'Disconnected (9)',
};

interface Props {
  source: GraphSource;
  onChange: (source: GraphSource) => void;
}

export function GraphSelect({ source, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isRandom = source.type === 'random';
  const randomOpts = isRandom ? source : { nodeCount: 10, density: 0.4, directed: false, weighted: true, seed: 42 };

  const selectedLabel = source.type === 'preset'
    ? PRESET_LABELS[source.id]
    : 'Random graph';

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

  function selectPreset(id: PresetId) {
    onChange({ type: 'preset', id });
    setOpen(false);
  }

  function selectRandom() {
    onChange({ type: 'random', ...randomOpts, seed: Date.now() });
    setOpen(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-pond-600 dark:text-pond-300">Graph</label>

      <div ref={containerRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-pond-200 bg-white px-3 py-2 text-sm font-medium text-pond-900 shadow-sm focus:border-pond-400 focus:outline-none dark:border-pond-700 dark:bg-pond-900 dark:text-pond-50"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span>{selectedLabel}</span>
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
            aria-label="Graph"
            className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-xl border border-pond-200 bg-white py-1 shadow-lg dark:border-pond-700 dark:bg-pond-900"
          >
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-pond-400 dark:text-pond-500">
              Presets
            </div>
            {PRESET_IDS.map(id => (
              <button
                key={id}
                type="button"
                role="option"
                aria-selected={source.type === 'preset' && source.id === id}
                onClick={() => selectPreset(id)}
                className={cn(
                  'flex w-full items-center px-3 py-1.5 text-sm transition',
                  source.type === 'preset' && source.id === id
                    ? 'bg-pond-100 font-semibold text-pond-900 dark:bg-pond-800 dark:text-pond-50'
                    : 'text-pond-800 hover:bg-pond-50 dark:text-pond-200 dark:hover:bg-pond-800/60',
                )}
              >
                {PRESET_LABELS[id]}
              </button>
            ))}
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-pond-400 dark:text-pond-500">
              Random
            </div>
            <button
              type="button"
              role="option"
              aria-selected={isRandom}
              onClick={selectRandom}
              className={cn(
                'flex w-full items-center px-3 py-1.5 text-sm transition',
                isRandom
                  ? 'bg-pond-100 font-semibold text-pond-900 dark:bg-pond-800 dark:text-pond-50'
                  : 'text-pond-800 hover:bg-pond-50 dark:text-pond-200 dark:hover:bg-pond-800/60',
              )}
            >
              Random graph
            </button>
          </div>
        )}
      </div>

      {isRandom && (
        <div className="flex flex-col gap-2 rounded-xl border border-pond-200 bg-pond-50/80 p-3 dark:border-pond-700 dark:bg-pond-800/40">
          <SliderRow
            label={`Nodes: ${randomOpts.nodeCount}`}
            min={4} max={24} step={1}
            value={randomOpts.nodeCount}
            onChange={v => onChange({ type: 'random', ...randomOpts, nodeCount: v, seed: Date.now() })}
          />
          <SliderRow
            label={`Density: ${Math.round(randomOpts.density * 100)}%`}
            min={0.1} max={0.8} step={0.05}
            value={randomOpts.density}
            onChange={v => onChange({ type: 'random', ...randomOpts, density: v, seed: Date.now() })}
          />
          <div className="flex gap-3 text-xs text-pond-700 dark:text-pond-200">
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={randomOpts.directed}
                onChange={e => onChange({ type: 'random', ...randomOpts, directed: e.target.checked, seed: Date.now() })}
                className="accent-duck-500"
              />
              Directed
            </label>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={randomOpts.weighted}
                onChange={e => onChange({ type: 'random', ...randomOpts, weighted: e.target.checked, seed: Date.now() })}
                className="accent-duck-500"
              />
              Weighted
            </label>
          </div>
          <button
            type="button"
            onClick={() => onChange({ type: 'random', ...randomOpts, seed: Date.now() })}
            className="mt-1 w-full rounded-xl border border-pond-200 bg-white px-3 py-2 text-xs font-medium text-pond-600 transition hover:bg-pond-100 dark:border-pond-700 dark:bg-pond-800/60 dark:text-pond-300 dark:hover:bg-pond-800"
          >
            Generate random
          </button>
        </div>
      )}
    </div>
  );
}

function SliderRow({
  label, min, max, step, value, onChange,
}: {
  label: string; min: number; max: number; step: number; value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-pond-600 dark:text-pond-300">{label}</span>
      <input
        type="range"
        min={min} max={max} step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="accent-duck-500"
      />
    </div>
  );
}
