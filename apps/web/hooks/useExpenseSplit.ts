import { toast } from 'sonner';
import { useCreateExpense } from '@web/lib/client/mutations/expenseMutation';
import type {
  CreateExpenseData,
  ExpenseSplitData,
} from '@web/lib/types/request';

interface CreateExpenseWithSplitParams {
  name: string;
  amount: string;
  groupId: string;
  /** The user who paid for the expense (creditor - will receive money back) */
  paidByUserId: string;
  /** Members who owe money (will be tracked via splits) */
  selectedMembers: string[];
  splitMode: 'equal' | 'custom';
  customSplits?: Record<string, string>;
}

export const useExpenseSplit = () => {
  const createExpenseMutation = useCreateExpense({
    onSuccess: () => {
      // Queries will be invalidated by the caller
    },
  });

  const validateCustomSplits = (
    customSplits: Record<string, string>,
    totalAmount: number,
  ): boolean => {
    const totalCustom = Object.values(customSplits).reduce(
      (sum, v) => sum + (parseFloat(v) || 0),
      0,
    );
    return Math.abs(totalCustom - totalAmount) <= 0.01;
  };

  const createExpenseWithSplit = async ({
    name,
    amount,
    groupId,
    paidByUserId,
    selectedMembers,
    splitMode,
    customSplits = {},
  }: CreateExpenseWithSplitParams) => {
    const totalAmount = parseFloat(amount);

    if (isNaN(totalAmount) || totalAmount <= 0) {
      toast.error('Please enter a valid amount');
      throw new Error('Invalid amount');
    }

    if (selectedMembers.length === 0) {
      toast.error('Please select at least one member');
      throw new Error('No members selected');
    }

    // Build splits array - tracks who owes what
    // The person who paid (paidByUserId) has their split marked as isPaid: true
    const splits: ExpenseSplitData[] = selectedMembers.map((userId) => {
      const splitAmount =
        splitMode === 'equal'
          ? totalAmount / selectedMembers.length
          : parseFloat(customSplits[userId] || '0');

      return {
        userId,
        amount: splitAmount,
        // The person who paid has already covered their share
        isPaid: userId === paidByUserId,
      };
    });

    // Validate splits
    const totalSplit = splits.reduce((sum, split) => sum + split.amount, 0);
    if (Math.abs(totalSplit - totalAmount) > 0.01) {
      toast.error('Split amounts must equal the total expense amount');
      throw new Error('Invalid splits');
    }

    try {
      // Create ONE expense with all splits
      // payeeId = person who paid (creditor - is owed money)
      // payerId = required field, set to first member who owes (or paidByUser as fallback)
      const firstOwingMember =
        selectedMembers.find((id) => id !== paidByUserId) || paidByUserId;

      const expenseData: CreateExpenseData = {
        name,
        totalAmount,
        groupId,
        payerId: firstOwingMember, // Required field - first person who owes
        payeeId: paidByUserId, // Person who paid (creditor)
        date: new Date().toISOString(),
        notes: splitMode === 'custom' ? 'Custom split' : undefined,
        splits,
      };

      await createExpenseMutation.mutateAsync({ expenseData });

      return { success: true };
    } catch (error) {
      console.error('Failed to create expense:', error);
      throw error;
    }
  };

  return {
    createExpenseWithSplit,
    isLoading: createExpenseMutation.isPending,
  };
};
