'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { Badge } from '@web/components/ui/badge';
import { DollarSign, CheckCircle, Smartphone, Banknote } from 'lucide-react';
import type { PaymentWithRelations } from '@web/lib/types/entities';
import { formatCurrency, formatDateShort } from '@web/lib/utils';

interface PaymentHistoryListProps {
  payments: PaymentWithRelations[];
}

export function PaymentHistoryList({ payments }: PaymentHistoryListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No verified payments yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-border rounded hover:border-primary/50 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      {payment.expenseSplit?.user?.name || 'Unknown'} &rarr;{' '}
                      {payment.expenseSplit?.expense?.payer?.name || 'Unknown'}
                    </p>
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      {payment.paymentMethod === 'GCASH' ? (
                        <Smartphone className="h-3 w-3" />
                      ) : (
                        <Banknote className="h-3 w-3" />
                      )}
                      {payment.paymentMethod}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {payment.expenseSplit?.expense?.name || 'No expense'} &bull;{' '}
                    {formatDateShort(payment.paidAt)}
                    {payment.verifiedAt && (
                      <>
                        {' '}
                        &bull; Verified {formatDateShort(payment.verifiedAt)}
                      </>
                    )}
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
        )}
      </CardContent>
    </Card>
  );
}
