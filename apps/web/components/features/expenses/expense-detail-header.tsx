'use client';

import { ArrowLeft, Calendar } from 'lucide-react';
import { Button } from '@web/components/ui/button';
import { formatDate, formatTime, formatCurrency } from '@web/lib/utils';

interface ExpenseDetailHeaderProps {
  name: string;
  date: string;
  totalAmount: number;
  onBack: () => void;
}

export function ExpenseDetailHeader({
  name,
  date,
  totalAmount,
  onBack,
}: ExpenseDetailHeaderProps) {
  return (
    <>
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-6 text-gray-600 hover:text-gray-900 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Expenses
      </Button>

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{name}</h1>
        <div className="flex flex-wrap items-center gap-6 text-blue-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span className="text-base">
              {formatDate(date)} | {formatTime(date)}
            </span>
          </div>
          <div className="text-base text-blue-600 font-semibold">
            Amount: {formatCurrency(totalAmount)}
          </div>
        </div>
      </div>
    </>
  );
}
