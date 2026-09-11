'use client';

import { formatDate, formatTime } from '@web/lib/utils';

interface ExpenseMetaInfoProps {
  paidByName: string;
  createdAt: string;
  updatedAt: string;
}

export function ExpenseMetaInfo({
  paidByName,
  createdAt,
  updatedAt,
}: ExpenseMetaInfoProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <div className="space-y-1">
        <h3 className="text-xs uppercase tracking-wider text-muted">Paid By</h3>
        <p className="text-sm text-foreground">{paidByName}</p>
      </div>
      <div className="space-y-1">
        <h3 className="text-xs uppercase tracking-wider text-muted">Audit</h3>
        <p className="text-sm text-foreground">
          Created: {formatDate(createdAt)} at {formatTime(createdAt)}
        </p>
        <p className="text-sm text-foreground">
          Updated: {formatDate(updatedAt)} at {formatTime(updatedAt)}
        </p>
      </div>
    </div>
  );
}
