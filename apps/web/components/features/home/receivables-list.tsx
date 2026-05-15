'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { formatCurrency } from '@web/lib/utils';

export interface ReceivableItem {
  from: string;
  amount: number;
  group: string;
}

interface ReceivablesListProps {
  receivables: ReceivableItem[];
}

export function ReceivablesList({ receivables }: ReceivablesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-primary">Receivables</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 min-h-[204px]">
          {receivables.length === 0 ? (
            <div className="flex items-center justify-center h-[204px] w-full">
              <p className="text-base text-muted-foreground font-extralight">
                No outstanding receivables
              </p>
            </div>
          ) : (
            receivables.map((receivable, index) => (
              <div
                key={index}
                className="flex justify-between items-center border-b border-border pb-2"
              >
                <div>
                  <p className="text-sm font-normal">{receivable.from}</p>
                  <p className="text-xs text-muted-foreground font-light">
                    {receivable.group}
                  </p>
                </div>
                <span className="font-mono text-primary font-bold">
                  {formatCurrency(receivable.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
