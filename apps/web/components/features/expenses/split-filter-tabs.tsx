import { Button } from '@web/components/ui/button';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export type SplitFilter = 'all' | 'payable' | 'receivable';

interface SplitFilterTabsProps {
  filter: SplitFilter;
  onFilterChange: (filter: SplitFilter) => void;
}

export function SplitFilterTabs({
  filter,
  onFilterChange,
}: SplitFilterTabsProps) {
  return (
    <div className="flex gap-2 border-b border-border pb-2">
      <Button
        variant={filter === 'all' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onFilterChange('all')}
      >
        All Splits
      </Button>
      <Button
        variant={filter === 'payable' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onFilterChange('payable')}
        className="gap-2"
      >
        <ArrowDownRight className="h-4 w-4" />
        Payables
      </Button>
      <Button
        variant={filter === 'receivable' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onFilterChange('receivable')}
        className="gap-2"
      >
        <ArrowUpRight className="h-4 w-4" />
        Recievables
      </Button>
    </div>
  );
}
