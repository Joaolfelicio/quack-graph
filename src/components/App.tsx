import { useCallback, useEffect, useState } from 'react';
import { ALGORITHMS_BY_ID } from '../algorithms';
import { useDarkMode } from '../hooks/useDarkMode';
import { useGraphRunner, type GraphSource } from '../hooks/useGraphRunner';
import type { PresetId } from '../lib/graphs';
import { PRESET_IDS } from '../lib/graphs';
import { LEGEND_ITEMS } from '../lib/visualColors';
import type { RunnerStats, RunnerStatus } from '../hooks/useGraphRunner';
import { ComplexityBadges } from './ComplexityBadges';
import { Controls } from './Controls';
import { MobileSettingsSheet } from './MobileSettingsSheet';
import { SettingsPanel } from './SettingsPanel';
import { ThemeToggle } from './ThemeToggle';
import { Visualizer } from './Visualizer';

const LS = {
  algorithm: 'qg:algorithm',
  speed: 'qg:speed',
  sound: 'qg:sound',
  graphPreset: 'qg:graphPreset',
};

function readNumber(key: string, fallback: number): number {
  const v = localStorage.getItem(key);
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function readBool(key: string, fallback: boolean): boolean {
  const v = localStorage.getItem(key);
  if (v === 'true') return true;
  if (v === 'false') return false;
  return fallback;
}

function parseInitialGraphSource(): GraphSource {
  const sp = new URLSearchParams(window.location.search);
  const gParam = sp.get('graph');
  if (gParam?.startsWith('preset:')) {
    const id = gParam.slice(7) as PresetId;
    if (PRESET_IDS.includes(id)) return { type: 'preset', id };
  }
  if (gParam === 'random') {
    return {
      type: 'random',
      nodeCount: Math.min(24, Math.max(4, Number(sp.get('n') ?? 10))),
      density: Math.min(0.8, Math.max(0.1, Number(sp.get('d') ?? 0.4))),
      directed: sp.get('dir') === '1',
      weighted: sp.get('w') !== '0',
      seed: Number(sp.get('seed') ?? 42),
    };
  }
  const stored = localStorage.getItem(LS.graphPreset) as PresetId | null;
  if (stored && PRESET_IDS.includes(stored)) return { type: 'preset', id: stored };
  return { type: 'preset', id: 'tree-8' };
}

function parseInitialAlgo(): string {
  const sp = new URLSearchParams(window.location.search);
  const fromUrl = sp.get('algo');
  if (fromUrl && ALGORITHMS_BY_ID[fromUrl]) return fromUrl;
  const stored = localStorage.getItem(LS.algorithm);
  if (stored && ALGORITHMS_BY_ID[stored]) return stored;
  return 'bfs';
}

export function App() {
  const { theme, toggle } = useDarkMode();
  const [soundEnabled, setSoundEnabled] = useState(() => readBool(LS.sound, false));
  const [mobileSettingsOpen, setMobileSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { state, actions, toggle: togglePlay } = useGraphRunner({
    initialAlgorithmId: parseInitialAlgo(),
    initialGraphSource: parseInitialGraphSource(),
    initialSpeed: Math.min(16, Math.max(0.25, readNumber(LS.speed, 1))),
    soundEnabled,
  });

  const algo = ALGORITHMS_BY_ID[state.algorithmId];

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
  }, []);

  const handleRegenerate = useCallback(() => {
    if (state.graphSource.type === 'random') {
      actions.setGraphSource({ ...state.graphSource, seed: Date.now() });
    } else {
      actions.reset();
    }
  }, [state.graphSource, actions]);

  // Persist
  useEffect(() => { localStorage.setItem(LS.algorithm, state.algorithmId); }, [state.algorithmId]);
  useEffect(() => { localStorage.setItem(LS.speed, String(state.speed)); }, [state.speed]);
  useEffect(() => { localStorage.setItem(LS.sound, String(soundEnabled)); }, [soundEnabled]);
  useEffect(() => {
    if (state.graphSource.type === 'preset') localStorage.setItem(LS.graphPreset, state.graphSource.id);
  }, [state.graphSource]);

  // Sync URL
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    sp.set('algo', state.algorithmId);
    sp.set('speed', state.speed.toFixed(2));
    if (state.graphSource.type === 'preset') {
      sp.set('graph', `preset:${state.graphSource.id}`);
    } else {
      const r = state.graphSource;
      sp.set('graph', 'random');
      sp.set('n', String(r.nodeCount));
      sp.set('d', String(r.density));
      sp.set('dir', r.directed ? '1' : '0');
      sp.set('w', r.weighted ? '1' : '0');
      sp.set('seed', String(r.seed));
    }
    window.history.replaceState(null, '', `${window.location.pathname}?${sp.toString()}`);
  }, [state.algorithmId, state.speed, state.graphSource]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'SELECT') return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); actions.stepForward(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); actions.stepBack(); }
      else if (e.key.toLowerCase() === 'r') actions.reset();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [actions, togglePlay]);

  const commonPanelProps = {
    algorithmId: state.algorithmId,
    graphSource: state.graphSource,
    speed: state.speed,
    soundEnabled,
    sourceNode: state.source,
    targetNode: state.target,
    nodeCount: state.graph.nodes.length,
    onAlgorithmChange: actions.setAlgorithm,
    onGraphSourceChange: actions.setGraphSource,
    onSpeedChange: actions.setSpeed,
    onSoundToggle: setSoundEnabled,
    onSourceNodeChange: actions.setSourceNode,
    onTargetNodeChange: actions.setTargetNode,
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col gap-4 p-4 pb-20 sm:p-6 sm:pb-20 lg:p-8 lg:pb-20">
      <header className="relative z-20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LogoDuck />
          <div className="min-w-0">
            <h1 className="whitespace-nowrap text-xl font-extrabold tracking-tight text-pond-900 dark:text-pond-50 sm:text-3xl">
              Quack Graph
            </h1>
            <p className="hidden text-xs text-pond-600 dark:text-pond-300 sm:block sm:text-sm">
              Graph algorithms, visualized with ducks waddling through ponds.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            aria-label="Copy share link"
            className="group relative flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-pond-800 shadow-soft ring-1 ring-pond-200/60 backdrop-blur transition-all hover:bg-white active:scale-95 dark:bg-pond-800/70 dark:text-pond-100 dark:ring-pond-700/60 dark:hover:bg-pond-800"
          >
            {copied ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] text-emerald-500">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] transition-transform group-hover:rotate-12">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
            )}
            {copied && (
              <span className="absolute -top-10 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-pond-900 px-2 py-1 text-[10px] font-medium text-white shadow-lg dark:bg-pond-50 dark:text-pond-950">
                Copied!
              </span>
            )}
          </button>
          <a
            href="https://github.com/Joaolfelicio/quack-graph"
            target="_blank"
            rel="noreferrer noopener"
            aria-label="View source on GitHub"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-pond-800 shadow-soft ring-1 ring-pond-200/60 backdrop-blur hover:bg-white dark:bg-pond-800/70 dark:text-pond-100 dark:ring-pond-700/60 dark:hover:bg-pond-800"
          >
            <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>
      </header>

      <main className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <section aria-label="Graph algorithm visualizer" className="flex flex-col gap-3">

          {state.tooManyEvents && (
            <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-900/20 dark:text-amber-100 dark:ring-amber-700/40">
              Graph too large for this algorithm — too many events to animate safely. Try a smaller graph.
            </div>
          )}

          <article className="rounded-3xl border border-pond-200/60 bg-white/60 p-4 shadow-soft backdrop-blur dark:border-pond-800/50 dark:bg-pond-900/50">
            <div className="flex flex-col gap-1">
              <h2 className="text-lg font-bold text-pond-900 dark:text-pond-50">{algo?.meta.name}</h2>
              <p className="text-sm text-pond-700 dark:text-pond-200">{algo?.meta.description}</p>
            </div>
            {algo && (
              <div className="mt-3 flex flex-col gap-3">
                <ComplexityBadges meta={algo.meta} />
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {LEGEND_ITEMS.map(({ fill, stroke, label }) => (
                    <span key={label} className="flex items-center gap-1.5 text-xs text-pond-600 dark:text-pond-300">
                      <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: fill, border: `2px solid ${stroke}` }} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </article>

          <div className="flex-1 min-h-[360px] sm:min-h-[420px] lg:min-h-[480px] rounded-3xl border border-pond-200/60 bg-white/60 overflow-hidden shadow-soft backdrop-blur dark:border-pond-800/50 dark:bg-pond-900/50">
            <Visualizer
              graph={state.graph}
              visual={state.visual}
              topoOrder={state.visual.topoOrder}
              showDuck={true}
            />
          </div>

          {/* Topo order strip */}
          {state.visual.topoOrder.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-pond-200/60 bg-white/60 px-4 py-2 shadow-soft dark:border-pond-800/50 dark:bg-pond-900/50">
              <span className="text-xs font-semibold uppercase text-pond-500 dark:text-pond-400 mr-2">Order:</span>
              {state.visual.topoOrder.filter(n => n !== undefined).map((n, i) => (
                <span key={i} className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-violet-100 text-xs font-bold text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">
                  {n}
                </span>
              ))}
            </div>
          )}

        </section>

        <aside className="hidden lg:sticky lg:top-4 lg:block lg:self-start">
          <SettingsPanel {...commonPanelProps} />
        </aside>
      </main>

      {/* Fixed controls bar — single row */}
      <FooterBar
        status={state.status}
        canStepBack={state.stepIndex > 0}
        canStepForward={state.stepIndex < state.events.length}
        stepIndex={state.stepIndex}
        totalSteps={state.events.length}
        stats={state.stats}
        statKeys={algo?.meta.stats ?? []}
        onToggle={togglePlay}
        onStepBack={actions.stepBack}
        onStepForward={actions.stepForward}
        onReset={actions.reset}
        onRegenerate={handleRegenerate}
      />

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
        {...commonPanelProps}
      />
    </div>
  );
}

function ShortcutsButton() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-label="Show keyboard shortcuts"
        aria-expanded={open}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-pond-500 ring-1 ring-pond-200 transition hover:bg-white dark:bg-pond-800/70 dark:text-pond-400 dark:ring-pond-700/60 dark:hover:bg-pond-800"
      >
        <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="2" y="6" width="20" height="13" rx="2" /><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full right-0 z-50 mb-2 w-48 rounded-xl bg-pond-900 p-3 text-xs text-white shadow-xl dark:bg-pond-800">
            <p className="mb-1.5 font-semibold uppercase tracking-wide text-pond-400">Shortcuts</p>
            <div className="space-y-1 text-pond-200">
              <div className="flex justify-between"><span>Play / pause</span><kbd className="rounded bg-pond-700 px-1 font-mono">Space</kbd></div>
              <div className="flex justify-between"><span>Step</span><kbd className="rounded bg-pond-700 px-1 font-mono">← →</kbd></div>
              <div className="flex justify-between"><span>Reset</span><kbd className="rounded bg-pond-700 px-1 font-mono">R</kbd></div>
            </div>
            <div className="absolute -bottom-1.5 right-3 border-4 border-transparent border-t-pond-900 dark:border-t-pond-800" />
          </div>
        </>
      )}
    </div>
  );
}

interface FooterBarProps {
  status: RunnerStatus;
  canStepBack: boolean;
  canStepForward: boolean;
  stepIndex: number;
  totalSteps: number;
  stats: RunnerStats;
  statKeys: string[];
  onToggle: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onRegenerate: () => void;
}

function FooterBar({
  status, canStepBack, canStepForward, stepIndex, totalSteps, stats, statKeys,
  onToggle, onStepBack, onStepForward, onReset, onRegenerate,
}: FooterBarProps) {
  const pct = totalSteps ? Math.min(100, Math.floor((stepIndex / totalSteps) * 100)) : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-pond-200/80 bg-white/90 px-4 py-2 shadow-lg backdrop-blur dark:border-pond-800/60 dark:bg-pond-950/90">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <Controls
          status={status}
          canStepBack={canStepBack}
          canStepForward={canStepForward}
          onToggle={onToggle}
          onStepBack={onStepBack}
          onStepForward={onStepForward}
          onReset={onReset}
          onRegenerate={onRegenerate}
        />

        <span className="h-6 w-px shrink-0 bg-pond-200 dark:bg-pond-700" />

        {/* Progress bar fills remaining space */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-pond-200 dark:bg-pond-800">
            <div className="h-full rounded-full bg-duck-400 transition-[width]" style={{ width: `${pct}%` }} />
          </div>
          <span className="w-8 shrink-0 text-right font-mono text-xs tabular-nums text-pond-600 dark:text-pond-300">{pct}%</span>
        </div>

        {/* Per-algorithm stats (up to 3, desktop only) */}
        {statKeys.length > 0 && (
          <>
            <span className="hidden h-6 w-px shrink-0 bg-pond-200 dark:bg-pond-700 sm:block" />
            <div className="hidden items-center gap-5 sm:flex">
              {statKeys.slice(0, 3).map(k => (
                <div key={k} className="flex flex-col items-start">
                  <span className="text-[10px] uppercase tracking-wide text-pond-500 dark:text-pond-400">
                    {k.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </span>
                  <span className="font-mono text-sm font-semibold tabular-nums text-pond-900 dark:text-pond-50">
                    {(stats[k] ?? 0).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <ShortcutsButton />
      </div>
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
