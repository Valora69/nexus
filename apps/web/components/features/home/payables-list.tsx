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
        <div className="space-y-3 min-h-[204px]">
          {payables.length === 0 ? (
            <div className="flex items-center justify-center h-[204px] w-full">
              <p className="text-base text-muted-foreground font-extralight">
                No outstanding payables
              </p>
            </div>
          ) : (
            payables.map((payable, index) => (
              <div
                key={index}
                className="flex justify-between items-center border-b border-border pb-2"
              >
                <div>
                  <p className="text-sm font-normal">{payable.to}</p>
                  <p className="text-xs text-muted-foreground font-light">
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
