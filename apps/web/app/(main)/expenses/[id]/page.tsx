'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@web/components/ui/button';
import { ConfirmationModal } from '@web/components/shared/confirmation-modal';
import {
  ExpenseDetailHeader,
  ExpenseNotesSection,
  ExpenseMetaInfo,
  ExpenseDetailActions,
} from '@web/components/features/expenses';
import { useToast } from '@web/hooks/use-toast';

import { useGetExpenseById } from '@web/lib/client/queries/expenseQueries';
import {
  useUpdateExpense,
  useRemoveExpense,
} from '@web/lib/client/mutations/expenseMutation';
import type { Expense } from '@web/lib/types/entities';

interface ExpenseDetailsPageProps {
  params: {
    id: string;
  };
}

export default function ExpenseDetailsPage({
  params,
}: ExpenseDetailsPageProps) {
  const router = useRouter();
  const { toast } = useToast();

  // Edit state
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [notesError, setNotesError] = useState<string | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);

  // Data queries
  const { data: expense, isLoading, error } = useGetExpenseById(params.id);

  // Mutations
  const updateExpenseMutation = useUpdateExpense({});
  const removeExpenseMutation = useRemoveExpense({});

  // Sync local notes when expense loads/changes
  useEffect(() => {
    if (expense) {
      setEditedNotes(expense.notes ?? '');
      setNotesError(null);
      setIsEditingNotes(false);
    }
  }, [expense]);

  // Handlers
  const handleBack = () => {
    router.push('/expenses');
  };

  const validateNotes = (value: string): boolean => {
    const trimmed = value.trim();
    setNotesError(null);

    if (trimmed.length > 0 && trimmed.length < 5) {
      setNotesError('Notes must be at least 5 characters or left empty.');
      return false;
    }
    if (trimmed.length > 2000) {
      setNotesError('Notes must be at most 2000 characters.');
      return false;
    }
    return true;
  };

  const handleSaveNotes = async () => {
    if (!expense) return;

    if (!validateNotes(editedNotes)) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: notesError || 'Please fix any errors before saving.',
      });
      return;
    }

    if ((expense.notes ?? '') === editedNotes.trim()) {
      setIsEditingNotes(false);
      setNotesError(null);
      return;
    }

    try {
      await updateExpenseMutation.mutateAsync({
        id: expense.id,
        expenseData: { notes: editedNotes.trim() },
      });

      setIsEditingNotes(false);
      setNotesError(null);

      toast({
        title: 'Notes updated',
        description: 'Expense notes were updated successfully.',
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';

      setNotesError(message);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to save notes: ${message}`,
      });
    }
  };

  const handleCancelEditNotes = () => {
    if (!expense) return;
    setEditedNotes(expense.notes ?? '');
    setNotesError(null);
    setIsEditingNotes(false);
  };

  const handleEditedNotesChange = (value: string) => {
    setEditedNotes(value);
    if (notesError) setNotesError(null);
  };

  const handleArchiveExpense = async () => {
    if (!expense) return;

    try {
      await removeExpenseMutation.mutateAsync({ id: expense.id });
      setShowArchiveModal(false);

      toast({
        title: 'Expense archived',
        description: 'The expense has been removed from the list.',
      });

      router.push('/expenses');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';

      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to archive expense: ${message}`,
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading expense details...</p>
        </div>
      </div>
    );
  }

  // Error / not found state
  if (error || !expense) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-2">Failed to load expense details</p>
          <p className="text-gray-600 text-sm">
            {error instanceof Error ? error.message : 'Expense not found'}
          </p>
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mt-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Expenses
          </Button>
        </div>
      </div>
    );
  }

  const typedExpense = expense as Expense;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto py-10 px-6">
        <ExpenseDetailHeader
          name={typedExpense.name}
          date={typedExpense.date}
          totalAmount={typedExpense.totalAmount}
          onBack={handleBack}
        />

        <ExpenseNotesSection
          notes={typedExpense.notes}
          isEditing={isEditingNotes}
          editedNotes={editedNotes}
          notesError={notesError}
          isPending={updateExpenseMutation.isPending}
          onEditedNotesChange={handleEditedNotesChange}
          onStartEdit={() => setIsEditingNotes(true)}
          onSave={handleSaveNotes}
          onCancel={handleCancelEditNotes}
        />

        <ExpenseMetaInfo
          payerId={typedExpense.payerId}
          createdAt={typedExpense.createdAt}
          updatedAt={typedExpense.updatedAt}
        />

        <ExpenseDetailActions
          onBack={handleBack}
          onArchive={() => setShowArchiveModal(true)}
          isArchiving={removeExpenseMutation.isPending}
        />

        <ConfirmationModal
          isOpen={showArchiveModal}
          onClose={() => setShowArchiveModal(false)}
          onConfirm={handleArchiveExpense}
          title="Archive Expense"
          description="Are you sure you want to archive this expense? This action will remove it from the active expenses list."
          confirmText="Archive Expense"
          cancelText="Cancel"
          isLoading={removeExpenseMutation.isPending}
          variant="destructive"
        />
      </div>
    </div>
  );
}
