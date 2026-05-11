'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { formatCurrency } from '@web/lib/utils';

export interface PayableItem {
  to: string;
  amount: number;
  group: string;
}

interface PayablesListProps {
  payables: PayableItem[];
}

export function PayablesList({ payables }: PayablesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">Payables</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payables.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No outstanding payables
            </p>
          ) : (
            payables.map((payable, index) => (
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
                  {formatCurrency(payable.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
