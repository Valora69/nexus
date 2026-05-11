import { Card, CardContent } from '@web/components/ui/card';
import { Button } from '@web/components/ui/button';
import { Plus } from 'lucide-react';
import type {
  ExpenseWithRelations,
  GroupMember,
} from '@web/lib/types/entities';

type GroupMemberWithUser = GroupMember & {
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

interface GroupExpensesListProps {
  expenses: ExpenseWithRelations[];
  members: GroupMemberWithUser[];
  onAddExpense: () => void;
  onViewExpense: (expense: ExpenseWithRelations) => void;
}

export function GroupExpensesList({
  expenses,
  members,
  onAddExpense,
  onViewExpense,
}: GroupExpensesListProps) {
  const getSplitPerPerson = (amount: number) => {
    if (members.length === 0) return 0;
    return amount / members.length;
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Group Expenses</h2>
        <Button onClick={onAddExpense} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Add Expense
        </Button>
      </div>

      {expenses.length === 0 ? (
        <Card className="border-border">
          <CardContent className="py-8 text-center text-muted-foreground">
            No expenses yet. Add one to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => {
            const splitPerPerson = getSplitPerPerson(expense.totalAmount);
            const hasSplits = expense.splits && expense.splits.length > 0;
            const splitCount = hasSplits
              ? expense.splits!.length
              : members.length;

            return (
              <Card
                key={expense.id}
                className="border-border cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => onViewExpense(expense)}
              >
                <CardContent className="py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{expense.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Paid by{' '}
                      <span className="text-primary">
                        {expense.payee?.name ||
                          expense.payer?.name ||
                          'Unknown'}
                      </span>{' '}
                      · {new Date(expense.date).toLocaleDateString()}
                      {hasSplits && (
                        <span className="ml-2 text-primary">
                          ({splitCount}{' '}
                          {expense.notes?.includes('Custom')
                            ? 'custom'
                            : 'equal'}{' '}
                          splits)
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary font-mono">
                      ${expense.totalAmount.toFixed(2)}
                    </p>
                    {hasSplits ? (
                      <p className="text-xs text-muted-foreground">
                        Split among {splitCount}
                      </p>
                    ) : members.length > 0 ? (
                      <p className="text-xs text-muted-foreground">
                        ${splitPerPerson.toFixed(2)}/person
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
