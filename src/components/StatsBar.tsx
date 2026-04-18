import { memo } from 'react';
import type { RunnerStats } from '../hooks/useSortRunner';

interface Props {
  stats: RunnerStats;
  totalSteps: number;
  stepIndex: number;
}

function Stat({ label, value, tooltip }: { label: string; value: string; tooltip: string }) {
  return (
    <div className="group relative flex min-w-[80px] flex-col items-start">
      <span className="text-[10px] uppercase tracking-wide text-pond-600 dark:text-pond-300">{label}</span>
      <span className="font-mono text-base font-semibold text-pond-900 tabular-nums dark:text-pond-50">{value}</span>
      <div role="tooltip" className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 w-52 rounded-lg bg-pond-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-pond-800">
        {tooltip}
        <div className="absolute left-4 top-full border-4 border-transparent border-t-pond-900 dark:border-t-pond-800" />
      </div>
    </div>
  );
}

export const StatsBar = memo(function StatsBar({ stats, totalSteps, stepIndex }: Props) {
  const pct = totalSteps ? Math.min(100, Math.floor((stepIndex / totalSteps) * 100)) : 0;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <Stat label="Comparisons" value={stats.comparisons.toLocaleString()} tooltip="Number of times the algorithm compared two elements to determine their relative order." />
      <Stat label="Swaps" value={stats.swaps.toLocaleString()} tooltip="Number of times two elements were exchanged to move them closer to their sorted positions." />
      <Stat label="Writes" value={stats.writes.toLocaleString()} tooltip="Number of times a value was written to the array (used by distribution sorts like Counting, Radix, and Bucket)." />
      <Stat label="Elapsed" value={`${(stats.elapsedMs / 1000).toFixed(2)}s`} tooltip="Real-world time elapsed since the sort started playing. Depends on playback speed, not the algorithm's actual complexity." />
      <div className="ml-auto flex items-center gap-2">
        <span className="font-mono text-xs tabular-nums text-pond-700 dark:text-pond-200">{pct}%</span>
        <div className="h-1.5 w-36 overflow-hidden rounded-full bg-pond-200 dark:bg-pond-800">
          <div className="h-full rounded-full bg-duck-400 transition-[width]" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
});
