import { memo } from 'react';
import type { RunnerStats } from '../hooks/useGraphRunner';

interface Props {
  stats: RunnerStats;
  statKeys: string[];
  totalSteps: number;
  stepIndex: number;
  compact?: boolean;
}

const STAT_TOOLTIPS: Record<string, string> = {
  visited: 'Nodes fully processed by the algorithm.',
  finished: 'Nodes where all neighbors have been explored (DFS post-order).',
  enqueued: 'Nodes added to the queue/priority-queue.',
  dequeued: 'Nodes removed from the front of the queue.',
  considered: 'Edges examined during the search.',
  relaxed: 'Edges where a shorter path was found and distance updated.',
  mstEdges: 'Edges accepted into the Minimum Spanning Tree.',
  rejected: 'Edges rejected (would form a cycle or not the lightest).',
  unions: 'Union-Find union operations performed.',
  finds: 'Union-Find find operations performed.',
  sccCount: 'Strongly Connected Components found so far.',
  emitted: 'Nodes placed in the topological order.',
  maxFlow: 'Total units of flow sent from source to sink.',
  augmentations: 'Augmenting paths found in the residual graph.',
  elapsedMs: 'Real-world time elapsed since playback started.',
};

function Stat({ label, value, tooltip }: { label: string; value: string; tooltip: string }) {
  return (
    <div className="group relative flex min-w-[70px] flex-col items-start">
      <span className="text-[10px] uppercase tracking-wide text-pond-600 dark:text-pond-300">{label}</span>
      <span className="font-mono text-sm font-semibold text-pond-900 tabular-nums dark:text-pond-50">{value}</span>
      <div role="tooltip" className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-52 rounded-lg bg-pond-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-pond-800">
        {tooltip}
        <div className="absolute left-4 top-full border-4 border-transparent border-t-pond-900 dark:border-t-pond-800" />
      </div>
    </div>
  );
}

function fmt(label: string, val: number): string {
  if (label === 'elapsedMs') return `${(val / 1000).toFixed(2)}s`;
  return val.toLocaleString();
}

export const StatsBar = memo(function StatsBar({ stats, statKeys, totalSteps, stepIndex, compact }: Props) {
  const pct = totalSteps ? Math.min(100, Math.floor((stepIndex / totalSteps) * 100)) : 0;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-4 sm:flex">
          {statKeys.slice(0, 3).map(k => (
            <Stat
              key={k}
              label={k.replace(/([A-Z])/g, ' $1').toLowerCase()}
              value={fmt(k, stats[k] ?? 0)}
              tooltip={STAT_TOOLTIPS[k] ?? k}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs tabular-nums text-pond-700 dark:text-pond-200">{pct}%</span>
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-pond-200 dark:bg-pond-800">
            <div className="h-full rounded-full bg-duck-400 transition-[width]" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      {statKeys.map(k => (
        <Stat
          key={k}
          label={k.replace(/([A-Z])/g, ' $1').toLowerCase()}
          value={fmt(k, stats[k] ?? 0)}
          tooltip={STAT_TOOLTIPS[k] ?? k}
        />
      ))}
      <Stat label="elapsed" value={`${(stats.elapsedMs / 1000).toFixed(2)}s`} tooltip={STAT_TOOLTIPS.elapsedMs} />
      <div className="ml-auto flex items-center gap-2">
        <span className="font-mono text-xs tabular-nums text-pond-700 dark:text-pond-200">{pct}%</span>
        <div className="h-1.5 w-36 overflow-hidden rounded-full bg-pond-200 dark:bg-pond-800">
          <div className="h-full rounded-full bg-duck-400 transition-[width]" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
});
