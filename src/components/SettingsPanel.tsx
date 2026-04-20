import type { GraphSource } from '../hooks/useGraphRunner';
import { AlgorithmSelect } from './AlgorithmSelect';
import { GraphSelect } from './GraphSelect';

interface Props {
  algorithmId: string;
  graphSource: GraphSource;
  speed: number;
  soundEnabled: boolean;
  sourceNode: number;
  targetNode: number;
  nodeCount: number;
  onAlgorithmChange: (id: string) => void;
  onGraphSourceChange: (source: GraphSource) => void;
  onSpeedChange: (s: number) => void;
  onSoundToggle: (on: boolean) => void;
  onSourceNodeChange: (n: number) => void;
  onTargetNodeChange: (n: number) => void;
}

const SPEED_STEPS = [0.25, 0.5, 1, 2, 4, 8, 16];

export function SettingsPanel({
  algorithmId, graphSource, speed, soundEnabled, sourceNode, targetNode, nodeCount,
  onAlgorithmChange, onGraphSourceChange, onSpeedChange, onSoundToggle,
  onSourceNodeChange, onTargetNodeChange,
}: Props) {
  const speedLabel = speed === Math.round(speed) ? `${speed}×` : `${speed}×`;

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-pond-200/60 bg-white/70 p-5 shadow-soft backdrop-blur dark:border-pond-800/50 dark:bg-pond-900/50">

      <AlgorithmSelect selectedId={algorithmId} onChange={onAlgorithmChange} />

      <hr className="border-pond-200 dark:border-pond-800" />

      <GraphSelect source={graphSource} onChange={onGraphSourceChange} />

      <hr className="border-pond-200 dark:border-pond-800" />

      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-pond-600 dark:text-pond-300">Source / Target nodes</label>
        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-[10px] text-pond-500">Source: {sourceNode}</span>
            <input
              type="range" min={0} max={nodeCount - 1} step={1}
              value={sourceNode}
              onChange={e => onSourceNodeChange(Number(e.target.value))}
              className="accent-duck-500"
            />
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-[10px] text-pond-500">Target: {targetNode}</span>
            <input
              type="range" min={0} max={nodeCount - 1} step={1}
              value={targetNode}
              onChange={e => onTargetNodeChange(Number(e.target.value))}
              className="accent-duck-500"
            />
          </div>
        </div>
      </div>

      <hr className="border-pond-200 dark:border-pond-800" />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wide text-pond-600 dark:text-pond-300">Speed</label>
          <span className="font-mono text-xs text-pond-700 dark:text-pond-200">{speedLabel}</span>
        </div>
        <input
          type="range"
          min={0} max={SPEED_STEPS.length - 1} step={1}
          value={SPEED_STEPS.indexOf(speed) === -1 ? 2 : SPEED_STEPS.indexOf(speed)}
          onChange={e => onSpeedChange(SPEED_STEPS[Number(e.target.value)])}
          className="accent-duck-500"
        />
        <div className="flex justify-between text-[10px] text-pond-400">
          <span>0.25×</span><span>1×</span><span>16×</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-pond-600 dark:text-pond-300">Sound</span>
        <button
          type="button"
          role="switch"
          aria-checked={soundEnabled}
          onClick={() => onSoundToggle(!soundEnabled)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${soundEnabled ? 'bg-duck-400' : 'bg-pond-300 dark:bg-pond-700'}`}
        >
          <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${soundEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
        </button>
      </div>
    </div>
  );
}
