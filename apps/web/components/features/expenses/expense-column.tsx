'use client';

import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Edit, Trash2, DollarSign } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@web/components/ui/dropdown-menu';
import { Button } from '@web/components/ui/button';
import { Checkbox } from '@web/components/ui/checkbox';
import { format } from 'date-fns';
import { Badge } from '@web/components/ui/badge';
import { Expense } from '@/lib/types/entities';

interface ExpensesColumnsProps {
  onArchiveExpense?: (expenseId: string) => void;
  onViewExpense?: (expense: Expense) => void;
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expenseId: string) => void;
}

export const createExpensesColumns = ({
  onArchiveExpense,
  onViewExpense,
  onEditExpense,
  onDeleteExpense,
}: ExpensesColumnsProps = {}): ColumnDef<Expense>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: () => <span className="text-primary">Expense Name</span>,
    cell: ({ row }) => {
      const expense = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">{expense.name}</div>
          {expense.notes && (
            <div className="text-sm text-muted-foreground line-clamp-2">
              {expense.notes}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'totalAmount',
    header: () => <span className="text-primary">Amount</span>,
    cell: ({ row }) => {
      const expense = row.original;
      return (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          <span className="font-mono font-bold text-primary">
            ${expense.totalAmount.toFixed(2)}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: 'group.name',
    header: () => <span className="text-primary">Group</span>,
    cell: ({ row }) => {
      const expense = row.original;
      return (
        <div>
          <Badge variant="outline">{expense.groupId || 'No group'}</Badge>
        </div>
      );
    },
  },
  {
    accessorKey: 'payer',
    header: () => <span className="text-primary">Paid By</span>,
    cell: ({ row }) => {
      const expense = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">{expense.payerId || 'Unknown'}</div>
          <div className="text-xs text-muted-foreground">
            {expense.payerId || 'N/A'}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'payee',
    header: () => <span className="text-primary">Paid For</span>,
    cell: ({ row }) => {
      const expense = row.original;
      return (
        <div className="space-y-1">
          <div className="font-medium">{expense.payeeId || 'Unknown'}</div>
          <div className="text-xs text-muted-foreground">
            {expense.payeeId || 'N/A'}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'date',
    header: () => <span className="text-primary">Date</span>,
    cell: ({ row }) => {
      const expense = row.original;
      return (
        <div className="space-y-1">
          <div className="text-sm font-mono">
            {format(new Date(expense.date), 'MMM dd, yyyy')}
          </div>
          <div className="text-xs text-muted-foreground">
            Created: {format(new Date(expense.createdAt), 'MMM dd, yyyy')}
          </div>
        </div>
      );
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const expense = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(expense.id)}
            >
              Copy expense ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onViewExpense?.(expense)}>
              <Eye className="mr-2 h-4 w-4" />
              View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEditExpense?.(expense)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit expense
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDeleteExpense?.(expense.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete expense
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// For backward compatibility
export const expensesColumns = createExpensesColumns();
