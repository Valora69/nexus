'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { useCurrentUser } from '@web/lib/client/queries/userQueries';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useGetAllExpenses } from '@web/lib/client/queries/expenseQueries';
import { useGetAllPayments } from '@web/lib/client/queries/paymentQueries';

export default function Dashboard() {
  // Fetch data using React Query hooks
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  console.log('Current User:', currentUser);
  const { data: expenses = [], isLoading: expensesLoading } =
    useGetAllExpenses();
  const { data: payments = [], isLoading: paymentsLoading } =
    useGetAllPayments();

  const isLoading = userLoading || expensesLoading || paymentsLoading;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-6 flex items-center justify-center">
        <p className="text-destructive">Please log in to view your dashboard</p>
      </div>
    );
  }

  // Calculate balances based on real data
  const balances = calculateBalances(expenses, payments, currentUser.id);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {currentUser.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-glow-green-hover transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-mono font-bold ${balances.netBalance >= 0 ? 'text-primary glow-green' : 'text-destructive'}`}
            >
              ${Math.abs(balances.netBalance).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {balances.netBalance >= 0 ? 'You are owed' : 'You owe'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-glow-green-hover transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Receivables
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-primary glow-green">
              ${balances.totalReceivable.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Money owed to you
            </p>
          </CardContent>
        </Card>

        <Card className="border-glow-green-hover transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payables
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-mono font-bold text-destructive">
              ${balances.totalPayable.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Money you owe</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-primary">You Owe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {balances.payables.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No outstanding payables
                </p>
              ) : (
                balances.payables.map((payable, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center border-b border-border pb-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{payable.to}</p>
                      <p className="text-xs text-muted-foreground">
                        {payable.group}
                      </p>
                    </div>
                    <span className="font-mono text-destructive font-bold">
                      ${payable.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-primary">Owed to You</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {balances.receivables.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No outstanding receivables
                </p>
              ) : (
                balances.receivables.map((receivable, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center border-b border-border pb-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{receivable.from}</p>
                      <p className="text-xs text-muted-foreground">
                        {receivable.group}
                      </p>
                    </div>
                    <span className="font-mono text-primary font-bold glow-green">
                      ${receivable.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {expenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses yet</p>
            ) : (
              expenses.slice(0, 5).map((expense: any) => (
                <div
                  key={expense.id}
                  className="flex justify-between items-center border-b border-border pb-2 hover:bg-muted/30 p-2 rounded transition-colors"
                >
                  <div>
                    <p className="font-medium">{expense.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {expense.group?.name || 'No group'} •{' '}
                      {expense.payer?.name || 'Unknown'} •{' '}
                      {new Date(expense.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-mono font-bold">
                    ${expense.totalAmount.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper function to calculate balances from real data
function calculateBalances(expenses: any[], payments: any[], userId: string) {
  let totalReceivable = 0;
  let totalPayable = 0;
  const receivables: Array<{ from: string; amount: number; group: string }> =
    [];
  const payables: Array<{ to: string; amount: number; group: string }> = [];

  // Process expenses where current user is the payee (receiving money)
  expenses.forEach((expense) => {
    if (expense.payeeId === userId) {
      const amount = expense.totalAmount;
      totalReceivable += amount;
      receivables.push({
        from: expense.payer?.name || 'Unknown',
        amount: amount,
        group: expense.group?.name || 'No group',
      });
    }

    // Process expenses where current user is the payer (owes money)
    if (expense.payerId === userId) {
      const amount = expense.totalAmount;
      totalPayable += amount;
      payables.push({
        to: expense.payee?.name || 'Unknown',
        amount: amount,
        group: expense.group?.name || 'No group',
      });
    }
  });

  // Subtract payments from the amounts
  payments.forEach((payment) => {
    // This is simplified - you may need to adjust based on your payment model
    if (payment.expense) {
      if (payment.expense.payeeId === userId) {
        totalReceivable -= payment.amountPaid;
      }
      if (payment.expense.payerId === userId) {
        totalPayable -= payment.amountPaid;
      }
    }
  });

  return {
    netBalance: totalReceivable - totalPayable,
    totalReceivable,
    totalPayable,
    receivables,
    payables,
  };
}
