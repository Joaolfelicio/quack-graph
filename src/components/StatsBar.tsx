import type { RunnerStats } from '../hooks/useSortRunner';

interface Props {
  stats: RunnerStats;
  totalSteps: number;
  stepIndex: number;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-start">
      <span className="text-[10px] uppercase tracking-wide text-pond-600 dark:text-pond-300">{label}</span>
      <span className="font-mono text-base font-semibold text-pond-900 dark:text-pond-50 tabular-nums">{value}</span>
    </div>
  );
}

export function StatsBar({ stats, totalSteps, stepIndex }: Props) {
  const pct = totalSteps ? Math.min(100, Math.floor((stepIndex / totalSteps) * 100)) : 0;
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <Stat label="Comparisons" value={stats.comparisons.toLocaleString()} />
      <Stat label="Swaps" value={stats.swaps.toLocaleString()} />
      <Stat label="Writes" value={stats.writes.toLocaleString()} />
      <Stat label="Elapsed" value={`${(stats.elapsedMs / 1000).toFixed(2)}s`} />
      <div className="ml-auto flex items-center gap-2">
        <span className="font-mono text-xs text-pond-700 dark:text-pond-200 tabular-nums">{pct}%</span>
        <div className="h-1.5 w-36 overflow-hidden rounded-full bg-pond-200 dark:bg-pond-800">
          <div className="h-full rounded-full bg-duck-400 transition-[width]" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
