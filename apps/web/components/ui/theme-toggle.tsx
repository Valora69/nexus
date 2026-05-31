'use client';

import { useTheme } from '@web/lib/theme';
import { cn } from '@web/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      onClick={toggle}
      className={cn(
        'glass relative inline-flex h-10 w-10 items-center justify-center rounded-full transition active:scale-[0.95] hover:border-border-strong',
        className,
      )}
    >
      <span className="sr-only">Toggle theme</span>
      <SunIcon
        className={cn(
          'absolute h-5 w-5 text-accent transition-all duration-300',
          isDark
            ? 'scale-0 opacity-0 rotate-90'
            : 'scale-100 opacity-100 rotate-0',
        )}
      />
      <MoonIcon
        className={cn(
          'absolute h-5 w-5 text-accent transition-all duration-300',
          isDark
            ? 'scale-100 opacity-100 rotate-0'
            : 'scale-0 opacity-0 -rotate-90',
        )}
      />
    </button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
