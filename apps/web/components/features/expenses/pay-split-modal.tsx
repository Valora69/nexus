import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@web/components/ui/dialog';
import { Button } from '@web/components/ui/button';
import { Input } from '@web/components/ui/input';
import { Label } from '@web/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@web/components/ui/radio-group';
import { Separator } from '@web/components/ui/separator';
import { Smartphone, Banknote, Copy, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { ExpenseSplitWithRelations } from '@web/lib/types/entities';

interface PaySplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  split: ExpenseSplitWithRelations | null;
  onPay: (paymentMode: 'gcash' | 'cash', amount: number) => Promise<void>;
  isPending: boolean;
}

export function PaySplitModal({
  isOpen,
  onClose,
  split,
  onPay,
  isPending,
}: PaySplitModalProps) {
  const [paymentMode, setPaymentMode] = useState<'gcash' | 'cash'>('gcash');
  const [payAmount, setPayAmount] = useState('');

  // Reset state when modal opens with new split
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    } else if (split) {
      setPayAmount(split.amount.toString());
    }
  };

  if (!split) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const handleSubmit = async () => {
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount > split.amount) {
      toast.error('Amount exceeds your share');
      return;
    }

    if (paymentMode === 'gcash' && !split.expense.payee?.gcashNumber) {
      toast.error('Payee has not set up their GCash number');
      return;
    }

    await onPay(paymentMode, amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Choose Payment Method</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center py-2">
            <p className="text-muted-foreground text-sm">Your share</p>
            <p className="text-2xl font-mono font-bold text-primary">
              ₱{split.amount.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {split.expense.name}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payAmount">Amount to Pay</Label>
            <Input
              id="payAmount"
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              max={split.amount}
              min={0}
              step="0.01"
            />
          </div>

          <RadioGroup
            value={paymentMode}
            onValueChange={(value: string) =>
              setPaymentMode(value as 'gcash' | 'cash')
            }
            className="grid grid-cols-2 gap-4"
          >
            <Label
              htmlFor="gcash"
              className={`flex flex-col items-center gap-3 p-6 border rounded-lg cursor-pointer transition-all ${
                paymentMode === 'gcash'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="gcash" id="gcash" className="sr-only" />
              <Smartphone className="h-8 w-8 text-primary" />
              <span className="font-medium">GCash</span>
              <span className="text-xs text-muted-foreground text-center">
                Instant transfer
              </span>
            </Label>

            <Label
              htmlFor="cash"
              className={`flex flex-col items-center gap-3 p-6 border rounded-lg cursor-pointer transition-all ${
                paymentMode === 'cash'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <RadioGroupItem value="cash" id="cash" className="sr-only" />
              <Banknote className="h-8 w-8 text-primary" />
              <span className="font-medium">Cash</span>
              <span className="text-xs text-muted-foreground text-center">
                Hand-to-hand
              </span>
            </Label>
          </RadioGroup>

          {/* GCash Payment Details */}
          {paymentMode === 'gcash' && (
            <div className="space-y-3">
              {split.expense.payee?.gcashNumber ? (
                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <p className="text-sm font-medium">GCash Payment Details</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Send to</p>
                      <p className="font-mono font-bold">
                        {split.expense.payee.gcashNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {split.expense.payee.name}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(
                          split.expense.payee?.gcashNumber || '',
                          'GCash number',
                        )
                      }
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Amount</p>
                      <p className="font-mono font-bold">₱{payAmount}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(payAmount, 'Amount')}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Copy the details above, complete payment in GCash, then tap
                    &quot;I&apos;ve Paid&quot; below.
                  </p>
                </div>
              ) : (
                <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
                  <p className="text-sm text-destructive">
                    {split.expense.payee?.name || 'Payee'} has not set up their
                    GCash number yet. Please ask them to update their profile or
                    choose Cash instead.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Cash Payment Instructions */}
          {paymentMode === 'cash' && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Cash Payment</p>
              <p className="text-xs text-muted-foreground">
                Hand the cash to{' '}
                <span className="font-medium">
                  {split.expense.payee?.name || 'the payee'}
                </span>
                , then tap &quot;I&apos;ve Paid&quot; below. They will need to
                confirm receipt in their payments page.
              </p>
            </div>
          )}

          <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg">
            <p className="text-xs text-yellow-700 dark:text-yellow-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              Payment will be marked as pending until{' '}
              {split.expense.payee?.name || 'the payee'} verifies it.
            </p>
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleSubmit}
            disabled={
              isPending ||
              (paymentMode === 'gcash' && !split.expense.payee?.gcashNumber)
            }
          >
            {isPending ? (
              'Processing...'
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                I&apos;ve Paid
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
