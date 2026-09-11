'use client';

import { Plus } from 'lucide-react';

import { cn } from '@web/lib/utils';

/** Keyboard shortcut that opens Quick Capture ("Q" for quick; B is a legacy alias). */
export const QUICK_ADD_KEY = 'q';
export const QUICK_ADD_LEGACY_KEY = 'b';

interface QuickAddButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

/** Desktop top-bar pill: "+ Quick add [Q]". */
export function QuickAddButton({
  label,
  onClick,
  className,
}: QuickAddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-keyshortcuts="Q"
      title={`${label} (Q)`}
      className={cn(
        'glass group inline-flex h-10 items-center gap-2 rounded-full pl-3 pr-1.5 text-sm text-foreground transition hover:border-accent/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
        className,
      )}
    >
      <Plus className="h-4 w-4 text-muted transition group-hover:text-accent" />
      <span className="max-w-[12rem] truncate">{label}</span>
      <kbd className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full border border-border bg-card px-2 font-mono text-[11px] font-medium text-muted">
        Q
      </kbd>
    </button>
  );
}

/** Mobile header variant: icon-only, since touch devices have no shortcut. */
export function QuickAddIconButton({
  label,
  onClick,
  className,
}: QuickAddButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'glass inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition hover:border-accent/40 hover:text-accent',
        className,
      )}
    >
      <Plus className="h-4 w-4" />
    </button>
  );
}
