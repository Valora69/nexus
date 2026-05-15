'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@web/components/ui/dialog';
import { Badge } from '@web/components/ui/badge';
import { Button } from '@web/components/ui/button';
import { CheckCircle, Smartphone, Banknote } from 'lucide-react';
import type { PaymentWithRelations } from '@web/lib/types/entities';

interface VerifyPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentWithRelations | null;
  onConfirm: () => void;
  isPending?: boolean;
}

export function VerifyPaymentModal({
  isOpen,
  onClose,
  payment,
  onConfirm,
  isPending,
}: VerifyPaymentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Payment Receipt</DialogTitle>
          <DialogDescription>
            Please confirm that you have received this payment before
            continuing.
          </DialogDescription>
        </DialogHeader>

        {payment && (
          <div className="space-y-4 py-4">
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">From:</span>
                <span className="font-medium">
                  {payment.expenseSplit?.user?.name || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="font-mono font-bold text-lg text-primary">
                  ₱{payment.amountPaid.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Method:</span>
                <Badge variant="outline" className="gap-1">
                  {payment.paymentMethod === 'GCASH' ? (
                    <Smartphone className="h-3 w-3" />
                  ) : (
                    <Banknote className="h-3 w-3" />
                  )}
                  {payment.paymentMethod}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">For:</span>
                <span className="text-sm">
                  {payment.expenseSplit?.expense?.name || 'Expense'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Date:</span>
                <span className="text-sm font-mono">
                  {new Date(payment.paidAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                Only confirm if you have verified the payment in your{' '}
                {payment.paymentMethod === 'GCASH'
                  ? 'GCash app'
                  : 'received the cash'}
                . This action cannot be undone.
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending} className="gap-2">
            <CheckCircle className="h-4 w-4" />
            {isPending ? 'Confirming...' : 'Yes, I Received It'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
