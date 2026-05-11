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
        <div className="space-y-3">
          {receivables.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No outstanding receivables
            </p>
          ) : (
            receivables.map((receivable, index) => (
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
