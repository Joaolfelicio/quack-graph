import type { SortAlgorithm } from '../algorithms/types';
import { DISTRIBUTIONS, type Distribution } from '../lib/distributions';
import { cn } from '../lib/cn';
import { AlgorithmSelect } from './AlgorithmSelect';

interface Props {
  algorithms: SortAlgorithm[];
  algorithmId: string;
  distribution: Distribution;
  count: number;
  speed: number;
  soundEnabled: boolean;
  onAlgorithmChange: (id: string) => void;
  onDistributionChange: (d: Distribution) => void;
  onCountChange: (n: number) => void;
  onSpeedChange: (s: number) => void;
  onSoundToggle: (on: boolean) => void;
}

export function SettingsPanel({
  algorithms, algorithmId, distribution, count, speed, soundEnabled,
  onAlgorithmChange, onDistributionChange, onCountChange, onSpeedChange, onSoundToggle,
}: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-pond-200/60 bg-white/70 p-5 shadow-soft backdrop-blur dark:border-pond-800/50 dark:bg-pond-900/50">
      <Section label="Algorithm">
        <AlgorithmSelect
          algorithms={algorithms}
          value={algorithmId}
          onChange={onAlgorithmChange}
        />
      </Section>

      <Section label={`Items (${count})`}>
        <input
          type="range"
          min={4}
          max={30}
          step={1}
          value={count}
          onChange={(e) => onCountChange(Number(e.target.value))}
        />
      </Section>

      <Section label={`Speed (${speed.toFixed(2)}×)`}>
        <input
          type="range"
          min={-2}
          max={4}
          step={0.25}
          value={Math.log2(speed)}
          onChange={(e) => onSpeedChange(2 ** Number(e.target.value))}
        />
      </Section>

      <Section label="Distribution">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-pond-100/70 p-1 dark:bg-pond-800/60">
          {DISTRIBUTIONS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onDistributionChange(d.id)}
              className={cn(
                'rounded-lg px-2 py-1.5 text-xs font-medium transition',
                distribution === d.id
                  ? 'bg-white text-pond-900 shadow dark:bg-pond-900 dark:text-pond-50'
                  : 'text-pond-700 hover:bg-white/60 dark:text-pond-200 dark:hover:bg-pond-900/60',
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </Section>

      <Section label="Sound">
        <label className="flex cursor-pointer items-center justify-between rounded-xl bg-pond-100/70 px-3 py-2 text-sm font-medium text-pond-800 dark:bg-pond-800/60 dark:text-pond-100">
          <span>Quack on swap, splash on compare</span>
          <span
            className={cn(
              'relative h-5 w-9 rounded-full transition',
              soundEnabled ? 'bg-duck-500' : 'bg-pond-300 dark:bg-pond-700',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition',
                soundEnabled ? 'left-[18px]' : 'left-0.5',
              )}
            />
          </span>
          <input
            type="checkbox"
            className="sr-only"
            checked={soundEnabled}
            onChange={(e) => onSoundToggle(e.target.checked)}
          />
        </label>
      </Section>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-pond-600 dark:text-pond-300">
        {label}
      </label>
      {children}
    </div>
  );
}
