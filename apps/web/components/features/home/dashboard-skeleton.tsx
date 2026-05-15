'use client';

import { Card, CardContent, CardHeader } from '@web/components/ui/card';
import { Skeleton } from '@web/components/ui/skeleton';

function BalanceCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
}

function ListCardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-24" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="flex justify-between items-center border-b border-border pb-2"
            >
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityCardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-28" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, i) => (
            <div
              key={i}
              className="flex justify-between items-center border-b border-border pb-2 p-2"
            >
              <div className="flex items-start gap-2 min-w-0">
                <Skeleton className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1.5 min-w-0">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-16 shrink-0 ml-3" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Balance cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <BalanceCardSkeleton />
        <BalanceCardSkeleton />
        <BalanceCardSkeleton />
      </div>

      {/* Payables + Receivables */}
      <div className="grid gap-4 md:grid-cols-2">
        <ListCardSkeleton rows={4} />
        <ListCardSkeleton rows={4} />
      </div>

      {/* Recent activity */}
      <ActivityCardSkeleton rows={5} />
    </div>
  );
}
