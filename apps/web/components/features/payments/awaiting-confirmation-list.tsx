'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { Badge } from '@web/components/ui/badge';
import { Clock, Smartphone, Banknote } from 'lucide-react';
import type { PaymentWithRelations } from '@web/lib/types/entities';
import { formatCurrency } from '@web/lib/utils';

interface AwaitingConfirmationListProps {
  payments: PaymentWithRelations[];
}

export function AwaitingConfirmationList({
  payments,
}: AwaitingConfirmationListProps) {
  if (payments.length === 0) return null;

  return (
    <Card className="border-blue-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
          <Clock className="h-5 w-5" />
          Awaiting Confirmation ({payments.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Payments you made. Waiting for recipients to confirm they received
          them.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-blue-500/20 rounded-lg bg-blue-500/5"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    Paid to{' '}
                    {payment.expenseSplit?.expense?.payer?.name || 'someone'}
                  </p>
                  <Badge
                    variant="outline"
                    className="gap-1 border-blue-500/30 text-blue-700 dark:text-blue-400"
                  >
                    {payment.paymentMethod === 'GCASH' ? (
                      <Smartphone className="h-3 w-3" />
                    ) : (
                      <Banknote className="h-3 w-3" />
                    )}
                    {payment.paymentMethod}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-yellow-500/30 text-yellow-700 dark:text-yellow-400"
                  >
                    Pending
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {payment.expenseSplit?.expense?.name || 'Expense'} &bull;{' '}
                  {new Date(payment.paidAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right mt-2 md:mt-0">
                <p className="text-lg font-mono font-bold text-primary">
                  {formatCurrency(payment.amountPaid)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
