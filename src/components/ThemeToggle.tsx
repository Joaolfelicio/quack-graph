import type { Theme } from '../hooks/useDarkMode';

interface Props {
  theme: Theme;
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: Props) {
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-pond-800 shadow-soft ring-1 ring-pond-200/60 backdrop-blur transition hover:bg-white dark:bg-pond-800/70 dark:text-duck-200 dark:ring-pond-700/60 dark:hover:bg-pond-800"
    >
      {dark ? (
        <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden>
          <path d="M12 4V2m0 20v-2m8-8h2M2 12h2m14.364-6.364l1.414-1.414M4.222 19.778l1.414-1.414m0-12.728L4.222 4.222m14.142 15.556l1.414 1.414" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none"/>
          <circle cx="12" cy="12" r="4.5" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden>
          <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
        </svg>
      )}
    </button>
  );
}
