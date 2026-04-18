import type { SortAlgorithm } from '../algorithms/types';

interface Props {
  algorithm: SortAlgorithm;
}

function Badge({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={`flex flex-col rounded-xl px-3 py-2 ring-1 ${tone}`}>
      <span className="text-[10px] uppercase tracking-wide opacity-70">{label}</span>
      <span className="font-mono text-sm font-semibold">{value}</span>
    </div>
  );
}

export function ComplexityBadges({ algorithm }: Props) {
  const t = algorithm.complexity.time;
  return (
    <div className="flex flex-wrap gap-2">
      <Badge label="Best" value={t.best} tone="bg-emerald-50 text-emerald-900 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-100 dark:ring-emerald-700/40" />
      <Badge label="Average" value={t.average} tone="bg-sky-50 text-sky-900 ring-sky-200 dark:bg-sky-900/30 dark:text-sky-100 dark:ring-sky-700/40" />
      <Badge label="Worst" value={t.worst} tone="bg-rose-50 text-rose-900 ring-rose-200 dark:bg-rose-900/30 dark:text-rose-100 dark:ring-rose-700/40" />
      <Badge label="Space" value={algorithm.complexity.space} tone="bg-violet-50 text-violet-900 ring-violet-200 dark:bg-violet-900/30 dark:text-violet-100 dark:ring-violet-700/40" />
      <div className="flex items-center gap-1 self-end">
        <Chip ok={algorithm.stable}>Stable</Chip>
        <Chip ok={algorithm.inPlace}>In-place</Chip>
      </div>
    </div>
  );
}

function Chip({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`rounded-full px-2 py-1 text-[11px] font-medium ring-1 ${
        ok
          ? 'bg-emerald-100 text-emerald-800 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100 dark:ring-emerald-700/40'
          : 'bg-pond-100 text-pond-700 ring-pond-200 dark:bg-pond-800/50 dark:text-pond-200 dark:ring-pond-700/40'
      }`}
    >
      {ok ? '✓' : '✗'} {children}
    </span>
  );
}
