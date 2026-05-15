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
import type { ExpenseWithRelations } from '@web/lib/types/entities';

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
  groupId: string;
  members: ExpenseMember[];
  currentUserId: string;
  /** When provided, modal switches to edit mode and pre-fills from this expense */
  expense?: ExpenseWithRelations | null;
  onSuccess?: () => void;
}

export function CreateExpenseModal({
  isOpen,
  onClose,
  groupId,
  members,
  currentUserId,
  expense,
  onSuccess,
}: CreateExpenseModalProps) {
  const queryClient = useQueryClient();
  const isEditMode = !!expense;

  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const { createExpenseWithSplit, updateExpenseWithSplit, isLoading } =
    useExpenseSplit();

  useEffect(() => {
    if (!isOpen) return;

    if (expense) {
      // Edit mode — pre-fill from the existing expense.
      setExpenseName(expense.name);
      setExpenseAmount(String(expense.totalAmount));
      const splitUserIds = (expense.splits ?? []).map((s) => s.userId);
      setSelectedMembers(splitUserIds);

      const fromNotes = expense.notes?.toLowerCase().includes('custom');
      const splitAmounts = (expense.splits ?? []).map((s) => s.amount);
      const isUneven =
        splitAmounts.length > 1 &&
        splitAmounts.some(
          (a) => Math.abs(a - splitAmounts[0]!) > 0.01,
        );
      const startInCustom = fromNotes || isUneven;
      setSplitMode(startInCustom ? 'custom' : 'equal');

      const customMap: Record<string, string> = {};
      for (const s of expense.splits ?? []) {
        customMap[s.userId] = String(s.amount);
      }
      setCustomSplits(customMap);
    } else {
      // Create mode — fresh form.
      setExpenseName('');
      setExpenseAmount('');
      setSelectedMembers(members.map((m) => m.userId));
      setSplitMode('equal');
      setCustomSplits({});
    }
  }, [isOpen, members, expense]);

  const hasUnsavedChanges = isEditMode
    ? expenseName !== (expense?.name ?? '') ||
      expenseAmount !== String(expense?.totalAmount ?? '')
    : expenseName !== '' || expenseAmount !== '';

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

  // Active custom splits — only members with > 0 amounts count.
  const activeCustomEntries = selectedMembers.filter((id) => {
    const v = parseFloat(customSplits[id] || '0');
    return isFinite(v) && v > 0;
  });
  const excludedFromCustom = selectedMembers.length - activeCustomEntries.length;

  const customTotal = activeCustomEntries.reduce(
    (sum, id) => sum + (parseFloat(customSplits[id] || '0') || 0),
    0,
  );

  const totalAmount = parseFloat(expenseAmount || '0');
  const isCustomSplitValid =
    activeCustomEntries.length > 0 &&
    Math.abs(customTotal - totalAmount) <= 0.01;

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
    setShowSubmitDialog(true);
  };

  const handleSubmitConfirm = async () => {
    try {
      const common = {
        name: expenseName,
        amount: expenseAmount,
        groupId,
        paidByUserId: currentUserId,
        selectedMembers,
        splitMode,
        customSplits,
      };

      if (isEditMode && expense) {
        await updateExpenseWithSplit({ ...common, expenseId: expense.id });
        toast.success('Expense updated');
      } else {
        await createExpenseWithSplit(common);
        toast.success('Expense added');
      }

      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] });

      setShowSubmitDialog(false);
      onSuccess?.();
      onClose();
    } catch (error) {
      setShowSubmitDialog(false);
      const msg = error instanceof Error ? error.message : 'Failed';
      // Hook already toasts on known validation errors; only surface unknowns.
      const knownLocalErrors = new Set([
        'Invalid amount',
        'No members selected',
        'Invalid splits',
        'No participants',
      ]);
      if (!knownLocalErrors.has(msg)) {
        // Server-side conflicts (e.g. verified-payments lock) bubble here.
        toast.error(msg.includes('verified payments') ? msg : `Failed to ${isEditMode ? 'update' : 'add'} expense`);
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
            <DialogTitle>{isEditMode ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Expense Name *</Label>
              <Input
                placeholder="e.g. Lunch, Software License"
                value={expenseName}
                onChange={(e) => setExpenseName(e.target.value)}
              />
            </div>

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

            {selectedMembers.length > 0 && expenseAmount && (
              <div className="space-y-2">
                <Label>Split Preview</Label>
                <div className="space-y-2">
                  {selectedMembers.map((userId) => {
                    const member = members.find((m) => m.userId === userId);
                    const isCurrentUser = userId === currentUserId;
                    const customVal = parseFloat(customSplits[userId] || '0');
                    const isZeroCustom =
                      splitMode === 'custom' && (!isFinite(customVal) || customVal <= 0);
                    return (
                      <div
                        key={userId}
                        className={`flex items-center justify-between gap-3 p-2 rounded ${isZeroCustom ? 'bg-muted/10 opacity-60' : 'bg-muted/30'}`}
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
                          {isZeroCustom && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-[10px] text-muted-foreground"
                            >
                              Excluded
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
                  <div className="space-y-1">
                    <p
                      className={`text-xs ${
                        !isCustomSplitValid
                          ? 'text-destructive font-medium'
                          : 'text-muted-foreground'
                      }`}
                    >
                      Total assigned: ${customTotal.toFixed(2)} / $
                      {totalAmount.toFixed(2)}
                      {!isCustomSplitValid && ' — amounts must match'}
                    </p>
                    {excludedFromCustom > 0 && (
                      <p className="text-xs text-muted-foreground">
                        {excludedFromCustom} member{excludedFromCustom > 1 ? 's' : ''} excluded (zero amount)
                      </p>
                    )}
                  </div>
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
              {isLoading
                ? isEditMode
                  ? 'Saving...'
                  : 'Adding...'
                : isEditMode
                  ? 'Save Changes'
                  : 'Add Expense'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isEditMode ? 'Save Changes' : 'Create Expense'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEditMode ? (
                <>
                  Update &quot;{expenseName}&quot; to $
                  {parseFloat(expenseAmount || '0').toFixed(2)} across{' '}
                  {splitMode === 'custom'
                    ? activeCustomEntries.length
                    : selectedMembers.length}{' '}
                  participant
                  {(splitMode === 'custom'
                    ? activeCustomEntries.length
                    : selectedMembers.length) !== 1
                    ? 's'
                    : ''}
                  . This will recreate the splits.
                </>
              ) : (
                <>
                  You paid ${parseFloat(expenseAmount || '0').toFixed(2)} for
                  &quot;{expenseName}&quot;.
                  {selectedMembers.length > 1 && (
                    <> This will be split among {selectedMembers.length} members.</>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitConfirm}
              disabled={isLoading}
            >
              {isLoading
                ? isEditMode
                  ? 'Saving...'
                  : 'Creating...'
                : isEditMode
                  ? 'Save Changes'
                  : 'Create Expense'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
