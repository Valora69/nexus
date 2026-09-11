'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@web/components/ui/button';
import { ConfirmationModal } from '@web/components/shared/confirmation-modal';
import { PageHeader } from '@web/components/layout/page-header';
import {
  ExpenseNotesSection,
  ExpenseMetaInfo,
  ExpenseDetailActions,
} from '@web/components/features/expenses';
import { toast } from 'sonner';

import { useGetExpenseById } from '@web/lib/client/queries/expenseQueries';
import {
  useUpdateExpense,
  useRemoveExpense,
} from '@web/lib/client/mutations/expenseMutation';
import type { ExpenseWithRelations } from '@web/lib/types/entities';
import { formatCurrency, formatDate, formatTime } from '@web/lib/utils';

interface ExpenseDetailsPageProps {
  params: {
    id: string;
  };
}

export default function ExpenseDetailsPage({
  params,
}: ExpenseDetailsPageProps) {
  const router = useRouter();

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
      toast.error(notesError || 'Please fix any errors before saving.');
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

      toast.success('Notes updated');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';

      setNotesError(message);
      toast.error(`Failed to save notes: ${message}`);
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

      toast.success('Expense archived');

      router.push('/expenses');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';

      toast.error(`Failed to archive expense: ${message}`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-accent" />
          <p className="text-sm text-muted">Loading expense details…</p>
        </div>
      </div>
    );
  }

  // Error / not found state
  if (error || !expense) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="text-center">
          <p className="mb-2 text-loss">Failed to load expense details</p>
          <p className="text-sm text-muted">
            {error instanceof Error ? error.message : 'Expense not found'}
          </p>
          <Button variant="ghost" onClick={handleBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Expenses
          </Button>
        </div>
      </div>
    );
  }

  const typedExpense = expense as ExpenseWithRelations;

  return (
    <div className="p-6">
      <div className="space-y-8">
        <PageHeader
          title={typedExpense.name}
          subtitle={`${formatDate(typedExpense.date)} · ${formatTime(typedExpense.date)} · ${formatCurrency(typedExpense.totalAmount)}`}
          backHref="/expenses"
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
          paidByName={
            typedExpense.payee?.name || typedExpense.payer?.name || 'Unknown'
          }
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
