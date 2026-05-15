'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@web/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency } from '@web/lib/utils';

export interface BalanceData {
  netBalance: number;
  totalReceivable: number;
  totalPayable: number;
}

interface BalanceCardsProps {
  balances: BalanceData;
}

export function BalanceCards({ balances }: BalanceCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-light text-muted-foreground">
            Net Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`text-4xl font-mono font-bold ${balances.netBalance >= 0 ? 'text-primary' : 'text-destructive'}`}
          >
            {balances.netBalance < 0 ? '-' : ''}
            {formatCurrency(Math.abs(balances.netBalance))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-light text-muted-foreground">
            Total Receivables
          </CardTitle>
          <ArrowUpRight className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-mono font-bold text-primary">
            {formatCurrency(balances.totalReceivable)}
          </div>
          <p className="text-xs text-muted-foreground font-light mt-1">
            Money owed to you
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-light text-muted-foreground">
            Total Payables
          </CardTitle>
          <ArrowDownRight className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-mono font-bold text-destructive">
            {formatCurrency(balances.totalPayable)}
          </div>
          <p className="text-xs text-muted-foreground font-light mt-1">
            Money you owe
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
