import { motion } from 'framer-motion';
import { memo } from 'react';
import type { HighlightRole } from '../algorithms/types';
import { cn } from '../lib/cn';
import { Duck } from './Duck';

interface Props {
  id: number;
  value: number;
  duckSize: number;
  columnWidth: number;
  highlight?: HighlightRole;
  showLabel: boolean;
}

function toneFor(h?: HighlightRole): Parameters<typeof Duck>[0]['tone'] {
  switch (h) {
    case 'sorted': return 'sorted';
    case 'compare': return 'compare';
    case 'swap': return 'swap';
    case 'pivot': return 'pivot';
    case 'cursor': return 'cursor';
    case 'range': return 'range';
    default: return 'default';
  }
}

function ringFor(h?: HighlightRole): string {
  switch (h) {
    case 'sorted': return 'ring-2 ring-emerald-400/60';
    case 'compare': return 'ring-2 ring-sky-400/80';
    case 'swap': return 'ring-2 ring-rose-400/80 shadow-[0_0_16px_rgba(244,63,94,0.4)]';
    case 'pivot': return 'ring-2 ring-amber-400/90 shadow-[0_0_16px_rgba(251,191,36,0.4)]';
    case 'cursor': return 'ring-2 ring-violet-400/80';
    case 'range': return 'ring-2 ring-pink-300/60';
    default: return '';
  }
}

export const DuckColumn = memo(function DuckColumn({ id, value, duckSize, columnWidth, highlight, showLabel }: Props) {
  const tone = toneFor(highlight);
  return (
    <motion.div
      layout
      layoutId={`col-${id}`}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className={cn(
        'flex flex-col-reverse items-center justify-start rounded-2xl px-0.5 py-1',
        'bg-pond-100/40 dark:bg-pond-800/30 backdrop-blur-sm',
        ringFor(highlight),
      )}
      style={{ width: columnWidth }}
    >
      {showLabel && (
        <span className="mt-1 text-[10px] font-medium text-pond-700 dark:text-pond-200">{value}</span>
      )}
      {Array.from({ length: value }, (_, i) => (
        <Duck key={i} size={duckSize} tone={tone} />
      ))}
    </motion.div>
  );
});
