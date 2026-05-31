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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@web/components/ui/tooltip';
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
  {
    text: '50 grab chowking',
    label: 'expense',
    hint: 'Logs ₱50 you spent at Chowking (Grab order)',
    icon: ArrowDownRight,
  },
  {
    text: '+50 gcash james',
    label: 'credit',
    hint: 'Logs ₱50 incoming — James paid you via GCash',
    icon: ArrowUpRight,
  },
];

const GROUP_EXAMPLES = [
  {
    text: '50 grab james',
    label: 'they owe you',
    hint: 'You paid ₱50 for Grab → James owes you back',
    icon: ArrowUpRight,
  },
  {
    text: '-50 grab james',
    label: 'you owe them',
    hint: 'James paid ₱50 for Grab → you owe James',
    icon: ArrowDownRight,
  },
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
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="px-5 pb-3 pt-5">
          <DialogTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-accent" />
            {isGroupMode ? 'Group Expense' : 'Personal Expense'}
            {isGroupMode && group && (
              <Badge variant="accent" className="ml-1 text-xs font-medium">
                <Users className="h-3 w-3" />
                {group.name}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-3">
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
            className="h-12 text-base"
            disabled={isPending}
          />
        </div>

        {/* Group-mode: member pills with live highlight */}
        {isGroupMode && members.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-5 pb-3">
            {members
              .filter((m) => m.userId !== currentUser?.id)
              .map((m) => {
                const isMatch =
                  groupPreview?.ok && groupPreview.data.memberId === m.userId;
                return (
                  <Badge
                    key={m.userId}
                    variant={isMatch ? 'accent' : 'neutral'}
                    className={`text-xs transition-colors ${
                      isMatch ? 'ring-2 ring-accent/40' : ''
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
          <div className="flex items-center gap-2 px-5 pb-3">
            {personalPreview.type === 'credit' ? (
              <ArrowUpRight className="h-4 w-4 shrink-0 text-gain" />
            ) : (
              <ArrowDownRight className="h-4 w-4 shrink-0 text-loss" />
            )}
            <span className="text-sm">
              <span
                className={`font-semibold ${
                  personalPreview.type === 'credit' ? 'text-gain' : 'text-loss'
                }`}
              >
                {personalPreview.type === 'credit' ? '+' : '-'}₱
                {personalPreview.amount}
              </span>
              {personalPreview.rest && (
                <span className="ml-1 text-muted">{personalPreview.rest}</span>
              )}
            </span>
            <Badge variant="neutral" className="ml-auto text-xs">
              {personalPreview.type}
            </Badge>
          </div>
        )}

        {/* Group preview / validation */}
        {isGroupMode && groupPreview && (
          <div className="px-5 pb-3">
            {groupPreview.ok ? (
              <div className="flex items-center gap-2 text-sm">
                {groupPreview.data.direction === 'paid' ? (
                  <ArrowUpRight className="h-4 w-4 shrink-0 text-gain" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 shrink-0 text-loss" />
                )}
                <span>
                  {groupPreview.data.direction === 'paid'
                    ? `${groupPreview.data.memberName} owes you `
                    : `You owe ${groupPreview.data.memberName} `}
                  <span className="font-mono font-semibold">
                    ₱{groupPreview.data.amount.toFixed(2)}
                  </span>
                  {groupPreview.data.description && (
                    <span className="ml-1 text-muted">
                      for {groupPreview.data.description}
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-loss">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {formatGroupCaptureError(groupPreview.error)}
              </div>
            )}
          </div>
        )}

        {/* Example hints — hover any chip for an explanation */}
        {!value && (
          <div className="px-5 pb-5">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">
              Try one (hover for details)
            </p>
            <TooltipProvider delayDuration={150}>
              <div className="flex flex-wrap gap-2">
                {examples.map((ex) => (
                  <Tooltip key={ex.text}>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        onClick={() => {
                          setValue(ex.text);
                          inputRef.current?.focus();
                        }}
                        className="glass inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-foreground transition hover:border-border-strong hover:bg-[var(--color-card-hover)]"
                      >
                        <ex.icon className="h-3 w-3 text-accent" />
                        <span className="font-mono">{ex.text}</span>
                        <span className="text-[10px] uppercase tracking-wider text-muted">
                          {ex.label}
                        </span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6}>
                      {ex.hint}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border bg-card px-5 py-2.5 text-xs text-muted backdrop-blur-xl">
          <span>
            <kbd className="rounded border border-border bg-card px-1 py-0.5 font-mono text-[10px] uppercase">
              Enter
            </kbd>{' '}
            to save ·{' '}
            <kbd className="rounded border border-border bg-card px-1 py-0.5 font-mono text-[10px] uppercase">
              Esc
            </kbd>{' '}
            to close
          </span>
          {isPending && <span className="font-medium text-accent">Saving…</span>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
