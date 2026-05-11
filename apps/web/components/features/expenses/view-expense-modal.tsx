'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@web/components/ui/dialog';
import { Button } from '@web/components/ui/button';
import { Badge } from '@web/components/ui/badge';
import { Separator } from '@web/components/ui/separator';
import { DollarSign } from 'lucide-react';
import type { ExpenseWithRelations } from '@web/lib/types/entities';

interface SplitMember {
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface ViewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: ExpenseWithRelations | null;
  /** Members from the group for legacy split calculation */
  members?: SplitMember[];
  onEdit?: () => void;
}

export function ViewExpenseModal({
  isOpen,
  onClose,
  expense,
  members = [],
  onEdit,
}: ViewExpenseModalProps) {
  if (!expense) return null;

  const getSplitPerPerson = (amount: number) => {
    if (members.length === 0) return 0;
    return amount / members.length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{expense.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Total Amount */}
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Total Amount</span>
            <span className="text-2xl font-bold text-primary font-mono">
              ${expense.totalAmount.toFixed(2)}
            </span>
          </div>

          <Separator />

          {/* Expense Details */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Paid by</span>
              <span className="font-medium text-primary">
                {expense.payee?.name || expense.payer?.name || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span className="font-mono">
                {new Date(expense.date).toLocaleDateString()}
              </span>
            </div>
            {expense.notes && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Notes</span>
                <span className="text-right">{expense.notes}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Split Breakdown */}
          <div>
            <p className="font-medium mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Split Breakdown{' '}
              {expense.notes?.includes('Custom') ? '(Custom)' : '(Equal)'}
            </p>
            <div className="space-y-2">
              {expense.splits && expense.splits.length > 0
                ? // Show actual splits from database
                  expense.splits.map((split) => {
                    // payeeId = person who paid (creditor)
                    const isPayer = split.userId === expense.payeeId;
                    return (
                      <div
                        key={split.id}
                        className="flex justify-between items-center text-sm p-2 rounded bg-muted/30"
                      >
                        <span
                          className={isPayer ? 'text-primary font-medium' : ''}
                        >
                          {split.user?.name || 'Unknown'}
                          {isPayer && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-[10px] border-primary text-primary"
                            >
                              Paid
                            </Badge>
                          )}
                          {split.isPaid && !isPayer && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-[10px] border-green-500 text-green-500"
                            >
                              Settled
                            </Badge>
                          )}
                        </span>
                        <span className="font-mono">
                          ${split.amount.toFixed(2)}
                        </span>
                      </div>
                    );
                  })
                : // Fallback to old equal split calculation for legacy expenses
                  members.map((member) => {
                    const isPayer =
                      member.userId === expense.payeeId ||
                      member.userId === expense.payerId;
                    return (
                      <div
                        key={member.userId}
                        className="flex justify-between items-center text-sm p-2 rounded bg-muted/30"
                      >
                        <span
                          className={isPayer ? 'text-primary font-medium' : ''}
                        >
                          {member.user?.name || 'Unknown'}
                          {isPayer && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-[10px] border-primary text-primary"
                            >
                              Paid
                            </Badge>
                          )}
                        </span>
                        <span className="font-mono">
                          ${getSplitPerPerson(expense.totalAmount).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {onEdit && (
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              onClick={() => {
                onEdit();
                onClose();
              }}
            >
              Edit Expense
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
