import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { Badge } from '@web/components/ui/badge';
import { Receipt, CheckCircle } from 'lucide-react';
import type { ExpenseSplitWithRelations } from '@web/lib/types/entities';
import type { SplitFilter } from './split-filter-tabs';
import { formatCurrency, formatDateShort, isSplitSettled } from '@web/lib/utils';

interface SplitsListProps {
  splits: ExpenseSplitWithRelations[];
  filter: SplitFilter;
  currentUserId?: string;
  onViewSplit: (split: ExpenseSplitWithRelations) => void;
}

export function SplitsList({
  splits,
  filter,
  currentUserId,
  onViewSplit,
}: SplitsListProps) {
  const getFilterTitle = () => {
    switch (filter) {
      case 'payable':
        return 'Payables';
      case 'receivable':
        return 'Recievables';
      default:
        return 'All Splits';
    }
  };

  const getEmptyMessage = () => {
    switch (filter) {
      case 'payable':
        return 'You have no outstanding payments.';
      case 'receivable':
        return 'No one owes you money yet.';
      default:
        return 'No expense splits yet. Create expenses in a group.';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          {getFilterTitle()}
          <Badge variant="secondary" className="ml-auto">
            {splits.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {splits.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{getEmptyMessage()}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {splits.map((split) => (
              <SplitCard
                key={split.id}
                split={split}
                filter={filter}
                currentUserId={currentUserId}
                onClick={() => onViewSplit(split)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface SplitCardProps {
  split: ExpenseSplitWithRelations;
  filter: SplitFilter;
  currentUserId?: string;
  onClick: () => void;
}

function SplitCard({ split, filter, currentUserId, onClick }: SplitCardProps) {
  const isOwedToMe =
    filter === 'receivable' || split.expense.payeeId === currentUserId;
  const owesTo = isOwedToMe
    ? split.user.name
    : split.expense.payee?.name || 'Unknown';
  const owesFrom = isOwedToMe ? split.user.name : 'You';

  return (
    <div
      onClick={onClick}
      className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-border rounded hover:border-primary/50 hover:bg-muted/20 transition-all cursor-pointer"
    >
      <div>
        <p className="font-medium">{split.expense.name}</p>
        <p className="text-xs text-muted-foreground">
          {split.expense.group?.name || 'Unknown Group'}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">
          {filter === 'payable'
            ? 'You owe'
            : filter === 'receivable'
              ? 'From'
              : 'Participant'}
        </p>
        <p className="text-sm">
          {filter === 'payable'
            ? split.expense.payee?.name || 'Unknown'
            : filter === 'receivable'
              ? split.user.name
              : split.user.name}
        </p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">Date</p>
        <p className="text-sm font-mono">
          {formatDateShort(split.expense.date)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground">Your Share</p>
        <div className="flex items-center justify-end gap-2">
          <p className="text-lg font-mono font-bold text-primary">
            {formatCurrency(split.amount)}
          </p>
          {isSplitSettled(split) && (
            <CheckCircle className="h-4 w-4 text-green-500" />
          )}
        </div>
      </div>
    </div>
  );
}
