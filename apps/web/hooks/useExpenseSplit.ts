import { toast } from 'sonner';
import {
  useCreateExpense,
  useUpdateExpense,
} from '@web/lib/client/mutations/expenseMutation';
import type {
  CreateExpenseData,
  ExpenseSplitData,
  UpdateExpenseData,
} from '@web/lib/types/request';

interface BaseSplitParams {
  name: string;
  amount: string;
  groupId: string;
  /** The user who paid for the expense (creditor — will receive money back) */
  paidByUserId: string;
  /** Members eligible to be included in splits */
  selectedMembers: string[];
  splitMode: 'equal' | 'custom';
  customSplits?: Record<string, string>;
}

type CreateParams = BaseSplitParams;
type UpdateParams = BaseSplitParams & { expenseId: string };

/**
 * Build a splits array, filtering out members with zero/empty custom amounts.
 * Returns the filtered participant list and the splits payload.
 */
function buildSplits(
  totalAmount: number,
  selectedMembers: string[],
  splitMode: 'equal' | 'custom',
  customSplits: Record<string, string>,
): { splits: ExpenseSplitData[]; excluded: string[] } {
  if (splitMode === 'equal') {
    const share = totalAmount / selectedMembers.length;
    return {
      splits: selectedMembers.map((userId) => ({ userId, amount: share })),
      excluded: [],
    };
  }

  // Custom: 0 / empty / negative amounts mean "not participating".
  const splits: ExpenseSplitData[] = [];
  const excluded: string[] = [];
  for (const userId of selectedMembers) {
    const parsed = parseFloat(customSplits[userId] || '0');
    if (!isFinite(parsed) || parsed <= 0) {
      excluded.push(userId);
      continue;
    }
    splits.push({ userId, amount: parsed });
  }
  return { splits, excluded };
}

export const useExpenseSplit = () => {
  const createExpenseMutation = useCreateExpense();
  const updateExpenseMutation = useUpdateExpense();

  const createExpenseWithSplit = async ({
    name,
    amount,
    groupId,
    paidByUserId,
    selectedMembers,
    splitMode,
    customSplits = {},
  }: CreateParams) => {
    const totalAmount = parseFloat(amount);

    if (isNaN(totalAmount) || totalAmount <= 0) {
      toast.error('Please enter a valid amount');
      throw new Error('Invalid amount');
    }
    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member');
      throw new Error('No members selected');
    }

    const { splits } = buildSplits(
      totalAmount,
      selectedMembers,
      splitMode,
      customSplits,
    );

    if (splits.length === 0) {
      toast.error('At least one member must have a non-zero amount');
      throw new Error('No participants');
    }

    const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(totalSplit - totalAmount) > 0.01) {
      toast.error('Split amounts must equal the total expense amount');
      throw new Error('Invalid splits');
    }

    const firstOwingMember =
      splits.find((s) => s.userId !== paidByUserId)?.userId ?? paidByUserId;

    const expenseData: CreateExpenseData = {
      name,
      totalAmount,
      groupId,
      payerId: firstOwingMember,
      payeeId: paidByUserId,
      date: new Date().toISOString(),
      notes: splitMode === 'custom' ? 'Custom split' : undefined,
      splits,
    };

    await createExpenseMutation.mutateAsync({ expenseData });
    return { success: true };
  };

  const updateExpenseWithSplit = async ({
    expenseId,
    name,
    amount,
    groupId,
    paidByUserId,
    selectedMembers,
    splitMode,
    customSplits = {},
  }: UpdateParams) => {
    const totalAmount = parseFloat(amount);

    if (isNaN(totalAmount) || totalAmount <= 0) {
      toast.error('Please enter a valid amount');
      throw new Error('Invalid amount');
    }
    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member');
      throw new Error('No members selected');
    }

    const { splits } = buildSplits(
      totalAmount,
      selectedMembers,
      splitMode,
      customSplits,
    );

    if (splits.length === 0) {
      toast.error('At least one member must have a non-zero amount');
      throw new Error('No participants');
    }

    const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
    if (Math.abs(totalSplit - totalAmount) > 0.01) {
      toast.error('Split amounts must equal the total expense amount');
      throw new Error('Invalid splits');
    }

    const firstOwingMember =
      splits.find((s) => s.userId !== paidByUserId)?.userId ?? paidByUserId;

    const expenseData: UpdateExpenseData = {
      name,
      totalAmount,
      groupId,
      payerId: firstOwingMember,
      payeeId: paidByUserId,
      notes: splitMode === 'custom' ? 'Custom split' : undefined,
      splits,
    };

    await updateExpenseMutation.mutateAsync({ id: expenseId, expenseData });
    return { success: true };
  };

  return {
    createExpenseWithSplit,
    updateExpenseWithSplit,
    isLoading:
      createExpenseMutation.isPending || updateExpenseMutation.isPending,
  };
};
