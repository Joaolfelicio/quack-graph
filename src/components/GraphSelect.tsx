import { memo } from 'react';
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

export const GraphSelect = memo(function GraphSelect({ source, onChange }: Props) {
  const isRandom = source.type === 'random';
  const randomOpts = isRandom ? source : { nodeCount: 10, density: 0.4, directed: false, weighted: true, seed: 42 };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-pond-600 dark:text-pond-300">Graph</label>

      <div className="flex flex-col gap-0.5">
        <div className="mb-0.5 text-[10px] uppercase tracking-wider text-pond-500 dark:text-pond-400">Presets</div>
        {PRESET_IDS.map(id => (
          <button
            key={id}
            type="button"
            onClick={() => onChange({ type: 'preset', id })}
            className={cn(
              'w-full rounded-lg px-3 py-1.5 text-left text-sm transition',
              source.type === 'preset' && source.id === id
                ? 'bg-duck-100 font-semibold text-duck-900 dark:bg-duck-900/40 dark:text-duck-100'
                : 'text-pond-700 hover:bg-pond-100 dark:text-pond-200 dark:hover:bg-pond-800',
            )}
          >
            {PRESET_LABELS[id]}
          </button>
        ))}
      </div>

      <div className="mt-1 flex flex-col gap-2 rounded-xl bg-pond-50 p-3 dark:bg-pond-800/40">
        <div className="text-[10px] uppercase tracking-wider text-pond-500 dark:text-pond-400">Random</div>
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
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={randomOpts.directed}
              onChange={e => onChange({ type: 'random', ...randomOpts, directed: e.target.checked, seed: Date.now() })}
              className="accent-duck-500"
            />
            Directed
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
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
          className="mt-1 rounded-lg bg-duck-400 px-3 py-1.5 text-sm font-semibold text-white hover:bg-duck-500 transition"
        >
          Generate random
        </button>
      </div>
    </div>
  );
});

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
