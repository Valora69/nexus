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
import { CheckCircle, DollarSign, Lock } from 'lucide-react';
import type { ExpenseWithRelations } from '@web/lib/types/entities';
import {
  expenseSettlement,
  formatCurrency,
  pendingPaid,
  splitStatus,
  verifiedPaid,
  type SplitStatus,
} from '@web/lib/utils';

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

const STATUS_STYLE: Record<
  SplitStatus,
  { variant: 'gain' | 'outline'; className?: string }
> = {
  paid: { variant: 'gain' },
  pending: {
    variant: 'outline',
    className: 'border-yellow-500/40 text-yellow-500',
  },
  partial: {
    variant: 'outline',
    className: 'border-yellow-500/40 text-yellow-500',
  },
  unpaid: { variant: 'outline', className: 'text-muted-foreground' },
};

/** "Paid ₱10.00", "₱4.00 paid · ₱6.00 pending", … — amounts come straight
 * from the split's payment records. */
function statusLabel(
  status: SplitStatus,
  verified: number,
  pending: number,
): string {
  switch (status) {
    case 'paid':
      return `Paid ${formatCurrency(verified)}`;
    case 'pending':
      return `${formatCurrency(verified + pending)} pending verification`;
    case 'partial':
      return [
        verified > 0 && `${formatCurrency(verified)} paid`,
        pending > 0 && `${formatCurrency(pending)} pending`,
      ]
        .filter(Boolean)
        .join(' · ');
    default:
      return 'Unpaid';
  }
}

export function ViewExpenseModal({
  isOpen,
  onClose,
  expense,
  members = [],
  onEdit,
}: ViewExpenseModalProps) {
  if (!expense) return null;

  const settlement = expenseSettlement(expense);
  // Server rejects edits once any payment exists; mirror that here.
  const isLocked = settlement.hasAnyPayment;

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
              {formatCurrency(expense.totalAmount)}
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
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Split Breakdown{' '}
                {expense.notes?.includes('Custom') ? '(Custom)' : '(Equal)'}
              </p>
              {settlement.owing > 0 &&
                (settlement.isFullySettled ? (
                  <Badge variant="gain" className="gap-1 text-[10px]">
                    <CheckCircle className="h-3 w-3" />
                    Paid by all
                  </Badge>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {settlement.settled} of {settlement.owing} paid
                  </span>
                ))}
            </div>
            <div className="space-y-2">
              {expense.splits && expense.splits.length > 0
                ? // Show actual splits from database
                  expense.splits.map((split) => {
                    // payeeId = person who fronted the money (creditor);
                    // their own share isn't a debt.
                    const isPayee = split.userId === expense.payeeId;
                    const status = splitStatus(split);
                    const style = STATUS_STYLE[status];
                    const label = statusLabel(
                      status,
                      verifiedPaid(split.payments),
                      pendingPaid(split.payments),
                    );
                    return (
                      <div
                        key={split.id}
                        className="flex justify-between items-center text-sm px-3 py-2 rounded-xl border border-border bg-card"
                      >
                        <span
                          className={`flex items-center gap-2 ${isPayee ? 'text-primary font-medium' : ''}`}
                        >
                          {split.user?.name || 'Unknown'}
                          {isPayee ? (
                            <Badge
                              variant="outline"
                              className="text-[10px] border-primary text-primary"
                            >
                              Paid upfront
                            </Badge>
                          ) : (
                            <Badge
                              variant={style.variant}
                              className={`text-[10px] ${style.className ?? ''}`}
                            >
                              {label}
                            </Badge>
                          )}
                        </span>
                        <span className="font-mono">
                          {formatCurrency(split.amount)}
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
                        className="flex justify-between items-center text-sm px-3 py-2 rounded-xl border border-border bg-card"
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
                          {formatCurrency(
                            getSplitPerPerson(expense.totalAmount),
                          )}
                        </span>
                      </div>
                    );
                  })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {onEdit && (
          <div className="flex items-center justify-end gap-3 pt-4">
            {isLocked && (
              <p className="mr-auto flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Locked — payments recorded
              </p>
            )}
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {!isLocked && <Button onClick={onEdit}>Edit Expense</Button>}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
