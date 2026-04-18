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
  onResetSettings: () => void;
}

export function SettingsPanel({
  algorithms, algorithmId, distribution, count, speed, soundEnabled,
  onAlgorithmChange, onDistributionChange, onCountChange, onSpeedChange, onSoundToggle,
  onResetSettings,
}: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-pond-200/60 bg-white/70 p-5 shadow-soft backdrop-blur dark:border-pond-800/50 dark:bg-pond-900/50">
      <Section label="Algorithm" htmlFor="setting-algorithm">
        <AlgorithmSelect
          id="setting-algorithm"
          algorithms={algorithms}
          value={algorithmId}
          onChange={onAlgorithmChange}
        />
      </Section>

      <Section label={`Items (${count})`} htmlFor="setting-count">
        <input
          id="setting-count"
          name="count"
          type="range"
          min={4}
          max={30}
          step={1}
          value={count}
          onChange={(e) => onCountChange(Number(e.target.value))}
        />
      </Section>

      <Section label={`Speed (${speed.toFixed(2)}×)`} htmlFor="setting-speed">
        <input
          id="setting-speed"
          name="speed"
          type="range"
          min={-2}
          max={4}
          step={0.25}
          value={Math.log2(speed)}
          onChange={(e) => onSpeedChange(2 ** Number(e.target.value))}
        />
      </Section>

      <Section label="Distribution">
        <div role="group" aria-label="Distribution" className="grid grid-cols-2 gap-1 rounded-xl bg-pond-100/70 p-1 dark:bg-pond-800/60">
          {DISTRIBUTIONS.map((d) => (
            <button
              key={d.id}
              type="button"
              aria-pressed={distribution === d.id}
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

      <Section label="Sound" htmlFor="setting-sound">
        <label htmlFor="setting-sound" className="flex cursor-pointer items-center justify-between rounded-xl bg-pond-100/70 px-3 py-2 text-sm font-medium text-pond-800 dark:bg-pond-800/60 dark:text-pond-100">
          <span>Quack on swap, splash on compare</span>
          <span
            className={cn(
              'relative h-5 w-9 rounded-full transition',
              soundEnabled ? 'bg-duck-500' : 'bg-pond-300 dark:bg-pond-700',
            )}
            aria-hidden="true"
          >
            <span
              className={cn(
                'absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition',
                soundEnabled ? 'left-[18px]' : 'left-0.5',
              )}
            />
          </span>
          <input
            id="setting-sound"
            name="sound"
            type="checkbox"
            className="sr-only"
            checked={soundEnabled}
            onChange={(e) => onSoundToggle(e.target.checked)}
          />
        </label>
      </Section>
      <button
        type="button"
        onClick={onResetSettings}
        className="mt-1 w-full rounded-xl border border-pond-200 bg-pond-50/80 px-3 py-2 text-xs font-medium text-pond-600 transition hover:bg-pond-100 dark:border-pond-700 dark:bg-pond-800/60 dark:text-pond-300 dark:hover:bg-pond-800"
      >
        Reset to defaults
      </button>
    </div>
  );
}

function Section({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={htmlFor}
        className="text-xs font-semibold uppercase tracking-wide text-pond-600 dark:text-pond-300"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
