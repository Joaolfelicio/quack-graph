import { memo } from 'react';
import type { GraphAlgorithmMeta } from '../algorithms/types';

function complexityTone(value: string): string {
  const v = value.replace(/\s/g, '');
  if (/^O\(1\)$/.test(v) || /^O\(logV\)$/.test(v) || /^O\(α/.test(v)) {
    return 'bg-emerald-50 text-emerald-900 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100 dark:ring-emerald-700/40';
  }
  if (/O\(V\^2\)|O\(VE\^2\)|O\(V\^3\)/.test(v)) {
    return 'bg-rose-50 text-rose-900 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-100 dark:ring-rose-700/40';
  }
  return 'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-100 dark:ring-amber-700/40';
}

function Badge({ label, value, tone, tooltip }: { label: string; value: string; tone: string; tooltip: string }) {
  return (
    <div className="group relative">
      <div className={`flex w-24 flex-col rounded-xl px-3 py-2 ring-1 ${tone}`}>
        <span className="text-[10px] uppercase tracking-wide opacity-70">{label}</span>
        <span className="truncate font-mono text-sm font-semibold">{value}</span>
      </div>
      <div role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-48 -translate-x-1/2 rounded-lg bg-pond-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-pond-800">
        {tooltip}
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-pond-900 dark:border-t-pond-800" />
      </div>
    </div>
  );
}

function Chip({ ok, children, tooltip }: { ok?: boolean; children: React.ReactNode; tooltip: string }) {
  return (
    <div className="group relative">
      <div
        className={`flex w-24 flex-col rounded-xl px-3 py-2 ring-1 ${
          ok
            ? 'bg-emerald-50 text-emerald-900 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100 dark:ring-emerald-700/40'
            : 'bg-pond-50 text-pond-700 ring-pond-200 dark:bg-pond-800/40 dark:text-pond-200 dark:ring-pond-700/40'
        }`}
      >
        <span className="text-[10px] uppercase tracking-wide opacity-70">{children}</span>
        <span className="font-mono text-sm font-semibold">{ok ? '✓ Yes' : '✗ No'}</span>
      </div>
      <div role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-52 -translate-x-1/2 rounded-lg bg-pond-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:bg-pond-800">
        {tooltip}
        <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-pond-900 dark:border-t-pond-800" />
      </div>
    </div>
  );
}

interface Props { meta: GraphAlgorithmMeta }

export const ComplexityBadges = memo(function ComplexityBadges({ meta }: Props) {
  const t = meta.complexity.time;
  return (
    <div className="flex flex-wrap gap-2">
      {t.best && (
        <Badge label="Best" value={t.best} tone={complexityTone(t.best)}
          tooltip={`Best-case time complexity. ${t.best}`} />
      )}
      <Badge label="Average" value={t.average} tone={complexityTone(t.average)}
        tooltip={`Average-case time complexity. ${t.average}`} />
      <Badge label="Worst" value={t.worst} tone={complexityTone(t.worst)}
        tooltip={`Worst-case time complexity. ${t.worst}`} />
      <Badge label="Space" value={meta.complexity.space}
        tone="bg-violet-50 text-violet-900 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-100 dark:ring-violet-700/40"
        tooltip={`Auxiliary space complexity. ${meta.complexity.space}`} />
      <Chip ok={meta.requiresDirected} tooltip="This algorithm requires a directed graph.">Directed</Chip>
      <Chip ok={meta.requiresWeighted} tooltip="This algorithm uses edge weights.">Weighted</Chip>
    </div>
  );
});
