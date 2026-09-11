import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@web/components/ui/dialog';
import { Button } from '@web/components/ui/button';
import { Separator } from '@web/components/ui/separator';
import { CreditCard } from 'lucide-react';
import type { ExpenseSplitWithRelations } from '@web/lib/types/entities';
import {
  formatCurrency,
  formatDateShort,
  latestVerifiedPaymentAt,
  pendingPaid,
  splitStatus,
  verifiedPaid,
} from '@web/lib/utils';

const STATUS_TEXT = {
  paid: { label: 'Paid', className: 'text-green-500' },
  pending: { label: 'Pending verification', className: 'text-yellow-500' },
  partial: { label: 'Partially paid', className: 'text-yellow-500' },
  unpaid: { label: 'Unpaid', className: 'text-muted-foreground' },
} as const;

interface ViewSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  split: ExpenseSplitWithRelations | null;
  currentUserId?: string;
  onPay: () => void;
}

export function ViewSplitModal({
  isOpen,
  onClose,
  split,
  currentUserId,
  onPay,
}: ViewSplitModalProps) {
  if (!split) return null;

  const status = splitStatus(split);
  const settled = status === 'paid';
  const settledAt = latestVerifiedPaymentAt(split.payments);
  const verified = verifiedPaid(split.payments);
  const pending = pendingPaid(split.payments);
  // Pending claims count against the balance too (the server refuses a
  // payment once verified + pending covers the share).
  const remaining = Math.max(0, split.amount - verified - pending);
  const isMyPayable = split.userId === currentUserId && remaining > 0.01;
  const isPayee = split.expense.payeeId === currentUserId;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Split Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center py-4">
            <p className="text-3xl font-mono font-bold text-primary">
              {formatCurrency(split.amount)}
            </p>
            <p className="text-lg font-medium mt-2">{split.expense.name}</p>
            <p className="text-sm text-muted-foreground">
              of {formatCurrency(split.expense.totalAmount)} total
            </p>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Group</p>
              <p className="font-medium">
                {split.expense.group?.name || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-medium font-mono">
                {formatDateShort(split.expense.date)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Paid By</p>
              <p className="font-medium">
                {split.expense.payee?.name ||
                  split.expense.payer?.name ||
                  'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Participant</p>
              <p className="font-medium">{split.user.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className={`font-medium ${STATUS_TEXT[status].className}`}>
                {STATUS_TEXT[status].label}
              </p>
              {(status === 'partial' || status === 'pending') && (
                <p className="text-xs text-muted-foreground font-mono">
                  {formatCurrency(verified)} verified
                  {pending > 0 && ` · ${formatCurrency(pending)} pending`}
                </p>
              )}
            </div>
            {settled && settledAt && (
              <div>
                <p className="text-muted-foreground">Paid On</p>
                <p className="font-medium font-mono">
                  {formatDateShort(settledAt)}
                </p>
              </div>
            )}
          </div>

          {split.expense.notes && (
            <>
              <Separator />
              <div>
                <p className="text-muted-foreground text-sm">Notes</p>
                <p className="text-sm mt-1">{split.expense.notes}</p>
              </div>
            </>
          )}

          {isMyPayable && !isPayee && (
            <>
              <Separator />
              <Button className="w-full gap-2" onClick={onPay}>
                <CreditCard className="h-4 w-4" />
                Pay {formatCurrency(remaining)}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
