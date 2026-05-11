'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { Badge } from '@web/components/ui/badge';
import { Button } from '@web/components/ui/button';
import { Clock, CheckCircle, Smartphone, Banknote } from 'lucide-react';
import type { PaymentWithRelations } from '@web/lib/types/entities';
import { formatCurrency } from '@web/lib/utils';

interface PendingVerificationListProps {
  payments: PaymentWithRelations[];
  onVerify: (payment: PaymentWithRelations) => void;
  isVerifying?: boolean;
}

export function PendingVerificationList({
  payments,
  onVerify,
  isVerifying,
}: PendingVerificationListProps) {
  if (payments.length === 0) return null;

  return (
    <Card className="border-yellow-500/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
          <Clock className="h-5 w-5" />
          Pending Verification ({payments.length})
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          People paying you back for expenses you covered. Confirm after
          verifying in your GCash app or receiving cash.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-yellow-500/20 rounded-lg bg-yellow-500/5"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {payment.expenseSplit?.user?.name || 'Someone'} paid you
                    back
                  </p>
                  <Badge
                    variant="outline"
                    className="gap-1 border-yellow-500/30 text-yellow-700 dark:text-yellow-400"
                  >
                    {payment.paymentMethod === 'GCASH' ? (
                      <Smartphone className="h-3 w-3" />
                    ) : (
                      <Banknote className="h-3 w-3" />
                    )}
                    {payment.paymentMethod}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  For: {payment.expenseSplit?.expense?.name || 'Expense'} &bull;{' '}
                  {new Date(payment.paidAt).toLocaleString()}
                </p>
                <p className="text-lg font-mono font-bold text-primary">
                  {formatCurrency(payment.amountPaid)}
                </p>
              </div>
              <div className="mt-3 md:mt-0">
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => onVerify(payment)}
                  disabled={isVerifying}
                >
                  <CheckCircle className="h-4 w-4" />
                  Confirm Receipt
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
