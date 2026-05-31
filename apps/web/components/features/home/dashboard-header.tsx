'use client';

/**
 * Page-level context line for the dashboard.
 * The page title now lives in the global sticky topbar, so this just renders
 * a soft date label as a sub-heading.
 */
export function DashboardHeader() {
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <p className="text-sm font-medium text-muted">
      <span className="text-accent">Today ·</span> {dateLabel}
    </p>
  );
}
