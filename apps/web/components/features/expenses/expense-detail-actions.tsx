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
    <div className="flex justify-end gap-3 border-t border-border pt-8">
      <Button variant="ghost" onClick={onBack}>
        Back
      </Button>
      <Button variant="destructive" onClick={onArchive} disabled={isArchiving}>
        <Archive className="h-4 w-4" />
        Archive Expense
      </Button>
    </div>
  );
}
