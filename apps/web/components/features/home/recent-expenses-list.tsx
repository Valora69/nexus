'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@web/components/ui/card';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { FeedItem } from '@web/lib/types/entities';

interface RecentExpensesListProps {
  feed: FeedItem[];
}

export function RecentExpensesList({ feed }: RecentExpensesListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {feed.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet</p>
          ) : (
            feed.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center border-b border-border pb-2 hover:bg-muted/30 p-2 rounded transition-colors"
              >
                <div className="flex items-start gap-2 min-w-0">
                  {item.isCredit ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.sublabel
                        ? `${item.sublabel} · `
                        : ''}
                      {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-mono font-bold shrink-0 ml-3 ${
                    item.isCredit ? 'text-green-500' : 'text-destructive'
                  }`}
                >
                  {item.isCredit ? '+' : '-'}₱{item.amount.toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
