'use client';

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@web/components/ui/dialog';
import { Input } from '@web/components/ui/input';
import { Label } from '@web/components/ui/label';
import { Button } from '@web/components/ui/button';
import { Badge } from '@web/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@web/components/ui/radio-group';
import { Separator } from '@web/components/ui/separator';
import { UserPlus } from 'lucide-react';
import { useExpenseSplit } from '@web/hooks/useExpenseSplit';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@web/components/ui/alert-dialog';

/** Member type expected by the modal */
export interface ExpenseMember {
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The group this expense belongs to */
  groupId: string;
  /** Members of the group who can be included in splits */
  members: ExpenseMember[];
  /** ID of the current user (who is creating/paying for the expense) */
  currentUserId: string;
  /** Called after successful expense creation */
  onSuccess?: () => void;
}

export function CreateExpenseModal({
  isOpen,
  onClose,
  groupId,
  members,
  currentUserId,
  onSuccess,
}: CreateExpenseModalProps) {
  const queryClient = useQueryClient();

  // Form state
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  // Confirmation dialogs
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const { createExpenseWithSplit, isLoading } = useExpenseSplit();

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setExpenseName('');
      setExpenseAmount('');
      setSelectedMembers(members.map((m) => m.userId));
      setSplitMode('equal');
      setCustomSplits({});
    }
  }, [isOpen, members]);

  const hasUnsavedChanges = expenseName !== '' || expenseAmount !== '';

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const equalShare =
    selectedMembers.length > 0 && expenseAmount
      ? parseFloat(expenseAmount) / selectedMembers.length
      : 0;

  const customTotal = Object.values(customSplits).reduce(
    (sum, v) => sum + (parseFloat(v) || 0),
    0,
  );

  const totalAmount = parseFloat(expenseAmount || '0');
  const isCustomSplitValid = Math.abs(customTotal - totalAmount) <= 0.01;

  const canSubmit =
    expenseName &&
    expenseAmount &&
    selectedMembers.length > 0 &&
    (splitMode === 'equal' || isCustomSplitValid);

  const handleSubmitClick = () => {
    if (!canSubmit) {
      toast.error('Please fill in all required fields');
      return;
    }
    setShowCreateDialog(true);
  };

  const handleCreateConfirm = async () => {
    try {
      await createExpenseWithSplit({
        name: expenseName,
        amount: expenseAmount,
        groupId,
        paidByUserId: currentUserId, // Current user paid, so they're the creditor
        selectedMembers,
        splitMode,
        customSplits,
      });

      // Invalidate queries after successful creation
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] });

      toast.success('Expense added successfully');
      setShowCreateDialog(false);
      onSuccess?.();
      onClose();
    } catch (error) {
      setShowCreateDialog(false);
      // Errors are handled by the hook via toast
      if (
        (error as Error).message !== 'Invalid custom splits' &&
        (error as Error).message !== 'Invalid amount' &&
        (error as Error).message !== 'No members selected' &&
        (error as Error).message !== 'Invalid splits'
      ) {
        toast.error('Failed to add expense');
      }
    }
  };

  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelDialog(true);
    } else {
      onClose();
    }
  };

  const handleCancelConfirm = () => {
    setShowCancelDialog(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleCancel}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Expense Name */}
            <div className="space-y-2">
              <Label>Expense Name *</Label>
              <Input
                placeholder="e.g. Lunch, Software License"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount ($) *</Label>
              <Input
                type="number"
                placeholder="0.00"
                step="0.01"
                min="0"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
            </div>

            <Separator />

            {/* Members Selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> Split with Members
              </Label>
              <div className="flex flex-wrap gap-2">
                {members.map((member) => (
                  <Badge
                    key={member.userId}
                    variant={
                      selectedMembers.includes(member.userId)
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer transition-colors"
                    onClick={() => toggleMember(member.userId)}
                  >
                    {member.user?.name || 'Unknown'}
                    {member.userId === currentUserId && ' (You)'}
                  </Badge>
                ))}
              </div>
              {selectedMembers.length === 0 && (
                <p className="text-xs text-destructive">
                  Select at least one member
                </p>
              )}
            </div>

            <Separator />

            {/* Split Mode */}
            <div className="space-y-3">
              <Label>Split Type</Label>
              <RadioGroup
                value={splitMode}
                onValueChange={(v) => setSplitMode(v as 'equal' | 'custom')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="equal" id="equal" />
                  <Label htmlFor="equal" className="cursor-pointer">
                    Divide Equally
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="cursor-pointer">
                    Custom Amounts
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Split Preview */}
            {selectedMembers.length > 0 && expenseAmount && (
              <div className="space-y-2">
                <Label>Split Preview</Label>
                <div className="space-y-2">
                  {selectedMembers.map((userId) => {
                    const member = members.find((m) => m.userId === userId);
                    const isCurrentUser = userId === currentUserId;
                    return (
                      <div
                        key={userId}
                        className="flex items-center justify-between gap-3 p-2 rounded bg-muted/30"
                      >
                        <span
                          className={`text-sm flex-1 ${isCurrentUser ? 'text-primary font-medium' : ''}`}
                        >
                          {member?.user?.name || 'Unknown'}
                          {isCurrentUser && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-[10px] border-primary text-primary"
                            >
                              Paid
                            </Badge>
                          )}
                        </span>
                        {splitMode === 'equal' ? (
                          <span className="text-sm font-mono text-primary">
                            ${equalShare.toFixed(2)}
                          </span>
                        ) : (
                          <Input
                            type="number"
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            className="w-24 h-8 text-sm"
                            value={customSplits[userId] || ''}
                            onChange={(e) =>
                              setCustomSplits((prev) => ({
                                ...prev,
                                [userId]: e.target.value,
                              }))
                            }
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                {splitMode === 'custom' && (
                  <p
                    className={`text-xs ${
                      !isCustomSplitValid
                        ? 'text-destructive font-medium'
                        : 'text-muted-foreground'
                    }`}
                  >
                    Total assigned: ${customTotal.toFixed(2)} / $
                    {totalAmount.toFixed(2)}
                    {!isCustomSplitValid && ' ⚠️ Amounts must match'}
                  </p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitClick}
              disabled={!canSubmit || isLoading}
            >
              {isLoading ? 'Adding...' : 'Add Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelConfirm}>
              Yes, Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Confirmation */}
      <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Expense</AlertDialogTitle>
            <AlertDialogDescription>
              You paid ${parseFloat(expenseAmount || '0').toFixed(2)} for &quot;
              {expenseName}&quot;.
              {selectedMembers.length > 1 && (
                <> This will be split among {selectedMembers.length} members.</>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCreateConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Create Expense'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
