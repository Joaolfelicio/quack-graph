import { useEffect } from 'react';
import type { GraphSource } from '../hooks/useGraphRunner';
import { SettingsPanel } from './SettingsPanel';

interface Props {
  open: boolean;
  onClose: () => void;
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
  onReset: () => void;
}

export function MobileSettingsSheet({ open, onClose, ...panelProps }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[95dvh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl transition-transform duration-300 lg:hidden dark:bg-pond-950 ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-pond-100 bg-white/90 px-5 py-3 backdrop-blur dark:border-pond-800 dark:bg-pond-950/90">
          <span className="text-sm font-semibold text-pond-800 dark:text-pond-100">Settings</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="flex h-7 w-7 items-center justify-center rounded-full text-pond-500 hover:bg-pond-100 dark:hover:bg-pond-800"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
        <div className="p-4 pb-safe">
          <SettingsPanel {...panelProps} />
        </div>
      </div>
    </>
  );
}
