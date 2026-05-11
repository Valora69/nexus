'use client';

import { formatDate, formatTime } from '@web/lib/utils';

interface ExpenseMetaInfoProps {
  payerId: string;
  createdAt: string;
  updatedAt: string;
}

export function ExpenseMetaInfo({
  payerId,
  createdAt,
  updatedAt,
}: ExpenseMetaInfoProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-900">Paid By</h3>
        <p className="text-sm text-gray-700 font-mono">User ID: {payerId}</p>
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-gray-900">Audit</h3>
        <p className="text-sm text-gray-700">
          Created: {formatDate(createdAt)} at {formatTime(createdAt)}
        </p>
        <p className="text-sm text-gray-700">
          Updated: {formatDate(updatedAt)} at {formatTime(updatedAt)}
        </p>
      </div>
    </div>
  );
}
