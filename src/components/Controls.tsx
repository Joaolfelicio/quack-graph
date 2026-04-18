import type { RunnerStatus } from '../hooks/useSortRunner';
import { cn } from '../lib/cn';

interface Props {
  status: RunnerStatus;
  canStepBack: boolean;
  canStepForward: boolean;
  onToggle: () => void;
  onStepBack: () => void;
  onStepForward: () => void;
  onReset: () => void;
  onShuffle: () => void;
}

export function Controls({ status, canStepBack, canStepForward, onToggle, onStepBack, onStepForward, onReset, onShuffle }: Props) {
  const playing = status === 'playing';
  const done = status === 'done';
  return (
    <div className="flex items-center gap-2">
      <IconButton onClick={onStepBack} disabled={!canStepBack} aria-label="Step back">
        <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor"><path d="M6 5v14M9 12l10 7V5z" /></svg>
      </IconButton>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'inline-flex h-12 w-12 items-center justify-center rounded-full text-white shadow-soft transition',
          playing ? 'bg-rose-500 hover:bg-rose-600' : 'bg-duck-500 hover:bg-duck-600',
        )}
        aria-label={playing ? 'Pause' : done ? 'Restart' : 'Play'}
      >
        {playing ? (
          <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
        ) : done ? (
          <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor"><path d="M12 4a8 8 0 1 0 7.95 9H17.9A6 6 0 1 1 12 6a5.95 5.95 0 0 1 4.24 1.76L13 11h7V4z"/></svg>
        ) : (
          <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor"><path d="M7 5v14l12-7z"/></svg>
        )}
      </button>
      <IconButton onClick={onStepForward} disabled={!canStepForward} aria-label="Step forward">
        <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor"><path d="M18 5v14M15 12L5 5v14z" /></svg>
      </IconButton>
      <span className="mx-2 h-6 w-px bg-pond-200 dark:bg-pond-700" />
      <IconButton onClick={onReset} aria-label="Reset">
        <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 3v6h6"/></svg>
      </IconButton>
      <IconButton onClick={onShuffle} aria-label="Shuffle">
        <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M4 20l17-17M21 16v5h-5M4 4l5 5M15 15l6 6"/></svg>
      </IconButton>
    </div>
  );
}

function IconButton({ children, disabled, onClick, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      {...rest}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-pond-800 ring-1 ring-pond-200 shadow-sm backdrop-blur transition hover:bg-white disabled:opacity-40 disabled:hover:bg-white/80 dark:bg-pond-800/70 dark:text-pond-100 dark:ring-pond-700/60 dark:hover:bg-pond-800"
    >
      {children}
    </button>
  );
}
