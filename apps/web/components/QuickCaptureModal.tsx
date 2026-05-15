'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  Users,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@web/components/ui/dialog';
import { Input } from '@web/components/ui/input';
import { Badge } from '@web/components/ui/badge';
import { useQuickCapture } from '@web/lib/client/mutations/personalTransactionMutation';
import { useCreateExpense } from '@web/lib/client/mutations/expenseMutation';
import { useGetGroupById } from '@web/lib/client/queries/groupQueries';
import { useCurrentUser } from '@web/lib/client/queries/userQueries';
import {
  parseGroupCapture,
  formatGroupCaptureError,
  type GroupCaptureMember,
} from '@web/lib/quick-capture/parseGroupCapture';
import type { CreateExpenseData } from '@web/lib/types/request';
import type { GroupWithRelations } from '@web/lib/types/entities';

interface QuickCaptureModalProps {
  open: boolean;
  onClose: () => void;
  /** When provided, modal runs in group-context mode */
  groupId?: string;
}

const PERSONAL_EXAMPLES = [
  { text: '50 grab chowking', label: 'expense', icon: ArrowDownRight },
  { text: '+50 gcash james', label: 'credit', icon: ArrowUpRight },
];

const GROUP_EXAMPLES = [
  { text: '50 grab james', label: 'they owe you', icon: ArrowUpRight },
  { text: '-50 grab james', label: 'you owe them', icon: ArrowDownRight },
];

function parsePersonalPreview(
  input: string,
): { type: 'expense' | 'credit'; amount: string; rest: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const isCredit = trimmed.startsWith('+');
  const cleaned = trimmed.replace(/^\+/, '').replace(/^(PHP|php|\$|₱)\s*/i, '');
  const tokens = cleaned.split(/\s+/).filter(Boolean);
  if (!tokens.length) return null;

  const amount = tokens[0]?.replace(/[^0-9.]/g, '') ?? '';
  if (!amount || isNaN(Number(amount))) return null;

  return {
    type: isCredit ? 'credit' : 'expense',
    amount,
    rest: tokens.slice(1).join(' '),
  };
}

export function QuickCaptureModal({
  open,
  onClose,
  groupId,
}: QuickCaptureModalProps) {
  const isGroupMode = !!groupId;
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const personalMutation = useQuickCapture();
  const createExpenseMutation = useCreateExpense();
  const { data: currentUser } = useCurrentUser();
  const { data: groupRaw } = useGetGroupById(
    groupId ?? '',
    isGroupMode && open,
  );
  const group = groupRaw as GroupWithRelations | undefined;

  const members: GroupCaptureMember[] = useMemo(() => {
    if (!isGroupMode || !group?.members) return [];
    return group.members.map((m) => ({
      userId: m.userId,
      name: m.user?.name ?? 'Unknown',
    }));
  }, [isGroupMode, group]);

  useEffect(() => {
    if (open) {
      setValue('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const submitPersonal = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    try {
      await personalMutation.mutateAsync({ input: trimmed });
      toast.success('Saved!', { duration: 1500 });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const submitGroup = async () => {
    if (!currentUser || !group) return;
    const result = parseGroupCapture(value, members, currentUser.id);
    if (!result.ok) {
      toast.error(formatGroupCaptureError(result.error));
      return;
    }

    const { direction, amount, description, memberId } = result.data;

    // direction='paid'  → current user paid, member owes (receivable)
    // direction='owes'  → member paid, current user owes (payable)
    const payeeId = direction === 'paid' ? currentUser.id : memberId;
    const debtorId = direction === 'paid' ? memberId : currentUser.id;

    const expenseData: CreateExpenseData = {
      name: description,
      totalAmount: amount,
      groupId: group.id,
      payerId: debtorId,
      payeeId,
      date: new Date().toISOString(),
      splits: [{ userId: debtorId, amount }],
    };

    try {
      await createExpenseMutation.mutateAsync({ expenseData });
      toast.success(
        direction === 'paid'
          ? `${result.data.memberName} owes you ₱${amount.toFixed(2)}`
          : `You owe ${result.data.memberName} ₱${amount.toFixed(2)}`,
        { duration: 2000 },
      );
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    }
  };

  const handleSubmit = () => {
    if (isGroupMode) submitGroup();
    else submitPersonal();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') onClose();
  };

  // Live preview / validation
  const groupPreview = useMemo(() => {
    if (!isGroupMode || !currentUser) return null;
    if (!value.trim()) return null;
    return parseGroupCapture(value, members, currentUser.id);
  }, [isGroupMode, value, members, currentUser]);

  const personalPreview = !isGroupMode ? parsePersonalPreview(value) : null;
  const isPending =
    personalMutation.isPending || createExpenseMutation.isPending;

  const examples = isGroupMode ? GROUP_EXAMPLES : PERSONAL_EXAMPLES;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-primary" />
            {isGroupMode ? 'Group Expense' : 'Personal Expense'}
            {isGroupMode && group && (
              <Badge variant="outline" className="text-xs ml-1 font-light">
                <Users className="h-3 w-3 mr-1" />
                {group.name}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-2">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isGroupMode
                ? '50 grab james  or  -50 grab james'
                : '50 grab chowking  or  +50 gcash james'
            }
            className="text-base h-11 border-0 border-b rounded-none px-0 focus-visible:ring-0 shadow-none"
            disabled={isPending}
          />
        </div>

        {/* Group-mode: member pills with live highlight */}
        {isGroupMode && members.length > 0 && (
          <div className="px-4 pb-2 flex flex-wrap gap-1.5">
            {members
              .filter((m) => m.userId !== currentUser?.id)
              .map((m) => {
                const isMatch =
                  groupPreview?.ok && groupPreview.data.memberId === m.userId;
                return (
                  <Badge
                    key={m.userId}
                    variant={isMatch ? 'default' : 'outline'}
                    className={`text-xs font-light transition-colors ${
                      isMatch ? 'ring-2 ring-primary/40' : ''
                    }`}
                  >
                    {m.name}
                  </Badge>
                );
              })}
          </div>
        )}

        {/* Personal preview */}
        {!isGroupMode && personalPreview && (
          <div className="px-4 pb-3 flex items-center gap-2">
            {personalPreview.type === 'credit' ? (
              <ArrowUpRight className="h-4 w-4 text-green-500 shrink-0" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-destructive shrink-0" />
            )}
            <span className="text-sm">
              <span
                className={`font-semibold ${personalPreview.type === 'credit' ? 'text-green-500' : 'text-destructive'}`}
              >
                {personalPreview.type === 'credit' ? '+' : '-'}₱
                {personalPreview.amount}
              </span>
              {personalPreview.rest && (
                <span className="text-muted-foreground ml-1">
                  {personalPreview.rest}
                </span>
              )}
            </span>
            <Badge variant="secondary" className="ml-auto text-xs">
              {personalPreview.type}
            </Badge>
          </div>
        )}

        {/* Group preview / validation */}
        {isGroupMode && groupPreview && (
          <div className="px-4 pb-3">
            {groupPreview.ok ? (
              <div className="flex items-center gap-2 text-sm">
                {groupPreview.data.direction === 'paid' ? (
                  <ArrowUpRight className="h-4 w-4 text-green-500 shrink-0" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-destructive shrink-0" />
                )}
                <span>
                  {groupPreview.data.direction === 'paid'
                    ? `${groupPreview.data.memberName} owes you `
                    : `You owe ${groupPreview.data.memberName} `}
                  <span className="font-semibold font-mono">
                    ₱{groupPreview.data.amount.toFixed(2)}
                  </span>
                  {groupPreview.data.description && (
                    <span className="text-muted-foreground ml-1">
                      for {groupPreview.data.description}
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {formatGroupCaptureError(groupPreview.error)}
              </div>
            )}
          </div>
        )}

        {/* Example hints */}
        {!value && (
          <div className="px-4 pb-4 flex gap-2 flex-wrap">
            {examples.map((ex) => (
              <button
                key={ex.text}
                onClick={() => {
                  setValue(ex.text);
                  inputRef.current?.focus();
                }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded px-2 py-1 transition-colors"
              >
                <ex.icon className="h-3 w-3" />
                {ex.text}
                <span className="text-[10px] text-muted-foreground/70 ml-1">
                  {ex.label}
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground bg-muted/30">
          <span>Enter to save · Esc to close</span>
          {isPending && <span className="text-primary">Saving...</span>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
