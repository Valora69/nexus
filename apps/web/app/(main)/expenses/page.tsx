import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { Receipt } from 'lucide-react';

export default function Expenses() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Expenses</h1>
        <p className="text-muted-foreground">Track all shared expenses</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            All Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {mockExpenses.map((expense) => (
              <div
                key={expense.id}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-border rounded hover:border-primary/50 transition-all cursor-pointer"
              >
                <div>
                  <p className="font-medium">{expense.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {expense.groupName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Paid by</p>
                  <p className="text-sm">{expense.payer}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="text-sm font-mono">
                    {new Date(expense.date).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-lg font-mono font-bold text-primary">
                    ${expense.amount.toFixed(2)}
                  </p>
                </div>
                {expense.notes && (
                  <div className="col-span-full">
                    <p className="text-xs text-muted-foreground">
                      Notes: {expense.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
