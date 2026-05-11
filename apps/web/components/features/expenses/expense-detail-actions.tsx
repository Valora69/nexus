'use client';

import { Archive } from 'lucide-react';
import { Button } from '@web/components/ui/button';

interface ExpenseDetailActionsProps {
  onBack: () => void;
  onArchive: () => void;
  isArchiving: boolean;
}

export function ExpenseDetailActions({
  onBack,
  onArchive,
  isArchiving,
}: ExpenseDetailActionsProps) {
  return (
    <div className="flex justify-end gap-4 mt-8 pt-8 border-t border-gray-200">
      <Button
        variant="outline"
        onClick={onBack}
        className="border-gray-300 text-gray-700 hover:bg-gray-50"
      >
        Back
      </Button>
      <Button
        variant="outline"
        className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
        onClick={onArchive}
        disabled={isArchiving}
      >
        <Archive className="h-4 w-4 text-blue-600" />
        Archive Expense
      </Button>
    </div>
  );
}
