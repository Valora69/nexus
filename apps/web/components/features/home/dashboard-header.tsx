'use client';

import { ArrowDownRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCurrency } from '@web/lib/utils';

interface DashboardHeaderProps {
  userName: string;
  spent: number;
  monthLabel: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  isCurrentMonth: boolean;
}

export function DashboardHeader({
  userName,
  spent,
  monthLabel,
  onPrevMonth,
  onNextMonth,
  isCurrentMonth,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {userName}</p>
      </div>

      <div className="flex flex-col items-start sm:items-end gap-1">
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <button
            onClick={onPrevMonth}
            className="p-1 rounded hover:bg-muted transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-24 text-center font-medium">{monthLabel}</span>
          <button
            onClick={onNextMonth}
            disabled={isCurrentMonth}
            className="p-1 rounded hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <ArrowDownRight className="h-4 w-4 text-destructive" />
          <span className="text-sm text-muted-foreground">Spent</span>
          <span className="text-xl font-bold text-destructive">
            {formatCurrency(spent)}
          </span>
        </div>
      </div>
    </div>
  );
}
