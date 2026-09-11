'use client';

import { PageHeader } from '@web/components/layout/page-header';

/** Dashboard title in the top bar, with today's date as the subtitle. */
export function DashboardHeader() {
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return <PageHeader title="Dashboard" subtitle={`Today · ${dateLabel}`} />;
}
