import { useState } from 'react';
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
  onCustomApply: (values: number[]) => void;
}

function parseCustomInput(raw: string): { values: number[]; error: string | null } {
  if (!raw.trim()) return { values: [], error: null };
  const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
  const values = parts.map((s) => {
    const n = Number(s);
    return Number.isInteger(n) && n >= 1 && n <= 30 ? n : NaN;
  });
  if (values.some(isNaN)) return { values: [], error: 'Use integers 1–30, separated by commas.' };
  if (values.length < 4 || values.length > 30) return { values: [], error: 'Enter between 4 and 30 numbers.' };
  return { values, error: null };
}

export function SettingsPanel({
  algorithms, algorithmId, distribution, count, speed, soundEnabled,
  onAlgorithmChange, onDistributionChange, onCountChange, onSpeedChange, onSoundToggle,
  onResetSettings, onCustomApply,
}: Props) {
  const [customInput, setCustomInput] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  function handleCustomApply() {
    const { values, error } = parseCustomInput(customInput);
    if (error) { setCustomError(error); return; }
    if (values.length === 0) { setCustomError('Enter some numbers first.'); return; }
    setCustomError(null);
    onCustomApply(values);
  }

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
          disabled={distribution === 'custom'}
          onChange={(e) => onCountChange(Number(e.target.value))}
          className={distribution === 'custom' ? 'opacity-40' : ''}
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
          <button
            type="button"
            aria-pressed={distribution === 'custom'}
            onClick={() => onDistributionChange('custom')}
            className={cn(
              'col-span-2 rounded-lg px-2 py-1.5 text-xs font-medium transition',
              distribution === 'custom'
                ? 'bg-white text-pond-900 shadow dark:bg-pond-900 dark:text-pond-50'
                : 'text-pond-700 hover:bg-white/60 dark:text-pond-200 dark:hover:bg-pond-900/60',
            )}
          >
            Custom
          </button>
        </div>
        {distribution === 'custom' && (
          <div className="flex flex-col gap-1.5">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={customInput}
                onChange={(e) => { setCustomInput(e.target.value); setCustomError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCustomApply(); }}
                placeholder="5, 2, 9, 1, 5, 6"
                className="min-w-0 flex-1 rounded-lg border border-pond-200 bg-pond-50 px-2.5 py-1.5 text-xs text-pond-900 placeholder-pond-400 outline-none focus:border-duck-400 focus:ring-1 focus:ring-duck-400 dark:border-pond-700 dark:bg-pond-800 dark:text-pond-50 dark:placeholder-pond-500"
              />
              <button
                type="button"
                onClick={handleCustomApply}
                className="shrink-0 rounded-lg bg-duck-400 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-duck-500"
              >
                Apply
              </button>
            </div>
            {customError && <p className="text-[10px] text-rose-600 dark:text-rose-400">{customError}</p>}
          </div>
        )}
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
