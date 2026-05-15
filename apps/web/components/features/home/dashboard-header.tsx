'use client';

export function DashboardHeader() {
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div>
      <h1 className="text-3xl font-light tracking-wide">Dashboard</h1>
      <p className="text-muted-foreground text-sm font-light">{dateLabel}</p>
    </div>
  );
}
