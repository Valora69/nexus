'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';

import {
  ExpensesHeader,
  SplitFilterTabs,
  SplitsList,
  ViewSplitModal,
  PaySplitModal,
  type SplitFilter,
} from '@web/components/features/expenses';
import { ExpenseModals } from '@web/lib/constants/modals';

import {
  useGetMyPayableSplits,
  useGetMyReceivableSplits,
} from '@web/lib/client/queries/expenseSplitQueries';
import { useCurrentUser } from '@web/lib/client/queries/userQueries';
import { useMarkSplitAsPaid } from '@web/lib/client/mutations/expenseSplitMutation';
import type {
  ExpenseSplitWithRelations,
  PaymentMethod,
} from '@web/lib/types/entities';

export default function ExpensesPage() {
  // Filter state
  const [filter, setFilter] = useState<SplitFilter>('all');

  // Modal state
  const [activeModal, setActiveModal] = useState<ExpenseModals | null>(null);
  const [selectedSplit, setSelectedSplit] =
    useState<ExpenseSplitWithRelations | null>(null);

  // Data queries
  const { data: payableSplits = [], isLoading: isLoadingPayable } =
    useGetMyPayableSplits();
  const { data: receivableSplits = [], isLoading: isLoadingReceivable } =
    useGetMyReceivableSplits();
  const { data: currentUser } = useCurrentUser();

  // Mutation
  const markPaidMutation = useMarkSplitAsPaid({
    onSuccess: () => {
      toast.success('Payment recorded! Waiting for payee to verify.');
      closeModal();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to record payment');
    },
  });

  // Combined/filtered splits based on filter
  const displayedSplits = useMemo(() => {
    switch (filter) {
      case 'payable':
        return payableSplits;
      case 'receivable':
        return receivableSplits;
      default:
        // Combine and dedupe (in case same split appears in both)
        const allSplits = [...payableSplits, ...receivableSplits];
        const seen = new Set<string>();
        return allSplits.filter((split) => {
          if (seen.has(split.id)) return false;
          seen.add(split.id);
          return true;
        });
    }
  }, [filter, payableSplits, receivableSplits]);

  const isLoading = isLoadingPayable || isLoadingReceivable;

  // Modal handlers
  const closeModal = () => {
    setActiveModal(null);
    setSelectedSplit(null);
  };

  const onViewSplit = (split: ExpenseSplitWithRelations) => {
    setSelectedSplit(split);
    setActiveModal(ExpenseModals.ViewSplit);
  };

  const onPaySplit = () => {
    setActiveModal(ExpenseModals.PaySplit);
  };

  const handlePay = async (paymentMode: 'gcash' | 'cash', amount: number) => {
    if (!selectedSplit) return;

    await markPaidMutation.mutateAsync({
      id: selectedSplit.id,
      paymentMethod: paymentMode.toUpperCase() as PaymentMethod,
      amountPaid: amount,
    });
  };

  // Modals mapping
  const modals = {
    [ExpenseModals.ViewSplit]: (
      <ViewSplitModal
        isOpen={activeModal === ExpenseModals.ViewSplit}
        onClose={closeModal}
        split={selectedSplit}
        currentUserId={currentUser?.id}
        onPay={onPaySplit}
      />
    ),
    [ExpenseModals.PaySplit]: (
      <PaySplitModal
        isOpen={activeModal === ExpenseModals.PaySplit}
        onClose={closeModal}
        split={selectedSplit}
        onPay={handlePay}
        isPending={markPaidMutation.isPending}
      />
    ),
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <ExpensesHeader
          title="My Expenses"
          description="Track your expense splits and record payments"
        />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-24 bg-muted/30 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <ExpensesHeader
        title="My Expenses"
        description="View your expense splits across groups and record payments"
      />

      <SplitFilterTabs filter={filter} onFilterChange={setFilter} />

      <SplitsList
        splits={displayedSplits}
        filter={filter}
        currentUserId={currentUser?.id}
        onViewSplit={onViewSplit}
      />

      {activeModal && modals[activeModal]}
    </div>
  );
}
