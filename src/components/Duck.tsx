import { memo } from 'react';

interface Props {
  size: number;
  tone?: 'default' | 'sorted' | 'compare' | 'swap' | 'pivot' | 'cursor' | 'range';
}

const BODY: Record<NonNullable<Props['tone']>, { body: string; beak: string; eye: string; wing: string }> = {
  default: { body: '#ffc61f', beak: '#f9a606', eye: '#0c4a6e', wing: '#dd7d02' },
  sorted: { body: '#86efac', beak: '#16a34a', eye: '#052e16', wing: '#16a34a' },
  compare: { body: '#7dd3fc', beak: '#0284c7', eye: '#082f49', wing: '#0284c7' },
  swap: { body: '#fda4af', beak: '#e11d48', eye: '#4c0519', wing: '#e11d48' },
  pivot: { body: '#fcd34d', beak: '#d97706', eye: '#451a03', wing: '#d97706' },
  cursor: { body: '#c4b5fd', beak: '#7c3aed', eye: '#2e1065', wing: '#7c3aed' },
  range: { body: '#fbcfe8', beak: '#db2777', eye: '#500724', wing: '#db2777' },
};

export const Duck = memo(function Duck({ size, tone = 'default' }: Props) {
  const palette = BODY[tone];
  return (
    <svg
      viewBox="0 0 64 40"
      width={size}
      height={size * (40 / 64)}
      className="block drop-shadow-[0_1px_0_rgba(0,0,0,0.12)]"
      aria-hidden
    >
      <ellipse cx="28" cy="26" rx="22" ry="12" fill={palette.body} />
      <path d="M14 28 Q22 16 32 24 L16 32 Z" fill={palette.wing} opacity="0.9" />
      <circle cx="46" cy="16" r="10" fill={palette.body} />
      <polygon points="54,14 64,13 64,20 54,20" fill={palette.beak} />
      <circle cx="49" cy="13" r="1.6" fill={palette.eye} />
      <path d="M8 33 Q12 37 18 34" stroke={palette.wing} strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
});
