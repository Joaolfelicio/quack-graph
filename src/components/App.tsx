import { useCallback, useEffect, useMemo, useState } from 'react';
import { ALGORITHMS, ALGORITHMS_BY_ID } from '../algorithms';
import { useDarkMode } from '../hooks/useDarkMode';
import { useSortRunner } from '../hooks/useSortRunner';
import type { Distribution } from '../lib/distributions';
import { ComplexityBadges } from './ComplexityBadges';
import { Controls } from './Controls';
import { MobileSettingsSheet } from './MobileSettingsSheet';
import { SettingsPanel } from './SettingsPanel';
import { StatsBar } from './StatsBar';
import { ThemeToggle } from './ThemeToggle';
import { Visualizer } from './Visualizer';

const LS = {
  algorithm: 'qs:algorithm',
  count: 'qs:count',
  speed: 'qs:speed',
  dist: 'qs:dist',
  sound: 'qs:sound',
};

function readNumber(key: string, fallback: number): number {
  if (typeof window === 'undefined') return fallback;
  const v = localStorage.getItem(key);
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function readString<T extends string>(key: string, fallback: T, allowed: readonly T[]): T {
  if (typeof window === 'undefined') return fallback;
  const v = localStorage.getItem(key);
  return (allowed as readonly string[]).includes(v ?? '') ? (v as T) : fallback;
}
function readBool(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback;
  const v = localStorage.getItem(key);
  if (v === 'true') return true;
  if (v === 'false') return false;
  return fallback;
}

const DISTS: readonly Distribution[] = ['random', 'nearly-sorted', 'reversed', 'few-unique', 'custom'] as const;

export function App() {
  const { theme, toggle } = useDarkMode();

  const initialAlgorithmId = useMemo(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(LS.algorithm) : null;
    if (stored && ALGORITHMS_BY_ID[stored]) return stored;
    return 'bubble';
  }, []);
  const initialCount = useMemo(() => {
    const stored = localStorage.getItem(LS.count);
    if (stored) return Math.min(30, Math.max(4, Math.round(Number(stored))));
    const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
    if (w < 640) return 8;
    if (w < 1024) return 15;
    return 20;
  }, []);
  const initialSpeed = useMemo(() => Math.min(16, Math.max(0.25, readNumber(LS.speed, 1))), []);
  const initialDistribution = useMemo(
    () => readString<Distribution>(LS.dist, 'random', DISTS),
    [],
  );
  const [soundEnabled, setSoundEnabled] = useState(() => readBool(LS.sound, false));
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);

  const { state, actions, toggle: togglePlay } = useSortRunner({
    initialAlgorithmId,
    initialDistribution,
    initialCount,
    initialSpeed,
    soundEnabled,
  });

  const algorithm = ALGORITHMS_BY_ID[state.algorithmId];

  const handleResetSettings = useCallback(() => {
    actions.setAlgorithm('bubble');
    actions.setCount(20);
    actions.setSpeed(1);
    actions.setDistribution('random');
    setSoundEnabled(false);
  }, [actions]);

  // Persist settings
  useEffect(() => { localStorage.setItem(LS.algorithm, state.algorithmId); }, [state.algorithmId]);
  useEffect(() => { localStorage.setItem(LS.count, String(state.count)); }, [state.count]);
  useEffect(() => { localStorage.setItem(LS.speed, String(state.speed)); }, [state.speed]);
  useEffect(() => { localStorage.setItem(LS.dist, state.distribution); }, [state.distribution]);
  useEffect(() => { localStorage.setItem(LS.sound, String(soundEnabled)); }, [soundEnabled]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'SELECT') return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); actions.stepForward(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); actions.stepBack(); }
      else if (e.key.toLowerCase() === 'r') actions.reset();
      else if (e.key.toLowerCase() === 's') actions.shuffle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actions, togglePlay]);

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 p-4 sm:p-6 lg:p-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LogoDuck />
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-pond-900 dark:text-pond-50 sm:text-3xl">
              Quack Sort
            </h1>
            <p className="text-xs text-pond-600 dark:text-pond-300 sm:text-sm">
              Sorting algorithms, visualized with stacks of ducks.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="https://github.com/Joaolfelicio/quack-sort"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="View source on GitHub"
            className="hidden h-10 w-10 items-center justify-center rounded-full bg-white/70 text-pond-800 shadow-soft ring-1 ring-pond-200/60 backdrop-blur hover:bg-white sm:inline-flex dark:bg-pond-800/70 dark:text-pond-100 dark:ring-pond-700/60 dark:hover:bg-pond-800"
          >
            <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <section aria-label="Sorting visualizer" className="flex flex-col gap-3">
          <article className="rounded-3xl border border-pond-200/60 bg-white/60 p-4 shadow-soft backdrop-blur dark:border-pond-800/50 dark:bg-pond-900/50">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-pond-900 dark:text-pond-50">{algorithm.name}</h2>
              <p className="text-sm text-pond-700 dark:text-pond-200">{algorithm.blurb}</p>
            </div>
            <div className="mt-3">
              <ComplexityBadges algorithm={algorithm} />
            </div>
          </article>

          <div className="flex-1 min-h-[360px] sm:min-h-[420px] lg:min-h-[480px]">
            <Visualizer items={state.items} highlights={state.highlights} maxValue={state.maxValue} />
          </div>

          <div className="flex flex-col gap-3 rounded-3xl border border-pond-200/60 bg-white/70 p-4 shadow-soft backdrop-blur dark:border-pond-800/50 dark:bg-pond-900/50">
            <StatsBar stats={state.stats} totalSteps={state.events.length} stepIndex={state.stepIndex} />
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {[
                { color: 'bg-sky-400', label: 'Compare' },
                { color: 'bg-rose-400', label: 'Swap' },
                { color: 'bg-amber-400', label: 'Pivot' },
                { color: 'bg-violet-400', label: 'Write' },
                { color: 'bg-emerald-400', label: 'Sorted' },
              ].map(({ color, label }) => (
                <span key={label} className="flex items-center gap-1 text-xs text-pond-600 dark:text-pond-300">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${color} opacity-80`} />
                  {label}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between gap-3">
              <Controls
                status={state.status}
                canStepBack={state.stepIndex > 0}
                canStepForward={state.stepIndex < state.events.length}
                onToggle={togglePlay}
                onStepBack={actions.stepBack}
                onStepForward={actions.stepForward}
                onReset={actions.reset}
                onShuffle={actions.shuffle}
              />
              <p className="hidden text-xs text-pond-600 dark:text-pond-300 sm:block">
                <kbd className="rounded bg-pond-100 px-1 py-0.5 font-mono text-[10px] dark:bg-pond-800">Space</kbd> play/pause ·{' '}
                <kbd className="rounded bg-pond-100 px-1 py-0.5 font-mono text-[10px] dark:bg-pond-800">←/→</kbd> step ·{' '}
                <kbd className="rounded bg-pond-100 px-1 py-0.5 font-mono text-[10px] dark:bg-pond-800">S</kbd> shuffle ·{' '}
                <kbd className="rounded bg-pond-100 px-1 py-0.5 font-mono text-[10px] dark:bg-pond-800">R</kbd> reset
              </p>
            </div>
          </div>
        </section>

        <aside className="hidden lg:sticky lg:top-4 lg:block lg:self-start">
          <SettingsPanel
            algorithms={ALGORITHMS}
            algorithmId={state.algorithmId}
            distribution={state.distribution}
            count={state.count}
            speed={state.speed}
            soundEnabled={soundEnabled}
            onAlgorithmChange={actions.setAlgorithm}
            onDistributionChange={actions.setDistribution}
            onCountChange={actions.setCount}
            onSpeedChange={actions.setSpeed}
            onSoundToggle={setSoundEnabled}
            onResetSettings={handleResetSettings}
            onCustomApply={actions.setCustomItems}
          />
        </aside>
      </main>

      {/* Mobile floating settings button */}
      <button
        type="button"
        onClick={() => setMobileSettingsOpen(true)}
        aria-label="Open settings"
        className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-duck-400 shadow-lg ring-2 ring-duck-500/40 transition hover:bg-duck-500 lg:hidden"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-white" aria-hidden="true">
          <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
      </button>

      <MobileSettingsSheet
        open={mobileSettingsOpen}
        onClose={() => setMobileSettingsOpen(false)}
        algorithms={ALGORITHMS}
        algorithmId={state.algorithmId}
        distribution={state.distribution}
        count={state.count}
        speed={state.speed}
        soundEnabled={soundEnabled}
        onAlgorithmChange={actions.setAlgorithm}
        onDistributionChange={actions.setDistribution}
        onCountChange={actions.setCount}
        onSpeedChange={actions.setSpeed}
        onSoundToggle={setSoundEnabled}
        onResetSettings={handleResetSettings}
        onCustomApply={actions.setCustomItems}
      />

      <footer className="pt-2 text-center text-xs text-pond-600 dark:text-pond-400">
        Built with React, TypeScript, Tailwind & far too many ducks.
      </footer>
    </div>
  );
}

function LogoDuck() {
  return (
    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-duck-400 shadow-soft ring-1 ring-duck-500/40">
      <svg viewBox="0 0 64 40" width={30} height={20} aria-hidden>
        <ellipse cx="28" cy="26" rx="22" ry="12" fill="#fff8d2" />
        <circle cx="46" cy="16" r="10" fill="#fff8d2" />
        <polygon points="54,14 64,13 64,20 54,20" fill="#dd7d02" />
        <circle cx="49" cy="13" r="1.6" fill="#0c4a6e" />
      </svg>
    </span>
  );
}
