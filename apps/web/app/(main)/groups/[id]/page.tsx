'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Button } from '@web/components/ui/button';
import { ArrowLeft } from 'lucide-react';

import { useGetGroupById } from '@web/lib/client/queries/groupQueries';
import { useGetAllExpenses } from '@web/lib/client/queries/expenseQueries';

import {
  useCurrentUser,
  useGetAllUsers,
} from '@web/lib/client/queries/userQueries';
import { useUpdateGroup } from '@web/lib/client/mutations/groupMutations';
import {
  useCreateGroupMember,
  useRemoveGroupMember,
} from '@web/lib/client/mutations/groupMemberMutations';
import { RemoveMemberConflictError } from '@web/lib/client/services/groupMemberService';
import { CreateExpenseModal } from '@web/components/features/expenses/create-expense-modal';
import { ViewExpenseModal } from '@web/components/features/expenses/view-expense-modal';
import {
  EditGroupModal,
  type RemovalBlocker,
} from '@web/components/features/groups/edit-group-modal';
import { PageHeader } from '@web/components/layout/page-header';
import { SearchParamListener } from '@web/components/shared/search-param-listener';
import { GroupMembersCard } from '@web/components/features/groups/group-members-card';
import { GroupExpensesList } from '@web/components/features/groups/group-expenses-list';
import { GroupModals } from '@web/lib/constants/modals';
import type {
  ExpenseWithRelations,
  GroupWithRelations,
} from '@web/lib/types/entities';

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const { data: group, isLoading: groupLoading } = useGetGroupById(groupId);
  const { data: groupExpenses = [], isLoading: expensesLoading } =
    useGetAllExpenses(undefined, groupId);
  const { data: currentUser } = useCurrentUser();
  const { data: allUsers = [] } = useGetAllUsers();

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<GroupModals | null>(null);
  // Track the id, not a snapshot, so the open modal re-renders with
  // refetched data (e.g. a payment verified while it's open).
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(
    null,
  );
  const selectedExpense: ExpenseWithRelations | null =
    (groupExpenses as ExpenseWithRelations[]).find(
      (e) => e.id === selectedExpenseId,
    ) ?? null;
  const [removalBlockers, setRemovalBlockers] = useState<
    Record<string, RemovalBlocker[]>
  >({});

  useEffect(() => {
    if (!isOpen) {
      setActiveModal(null);
      setSelectedExpenseId(null);
      setRemovalBlockers({});
    }
  }, [isOpen]);

  // Deep link from a notification: open that expense once it's loaded.
  const [expenseParam, setExpenseParam] = useState<string | null>(null);
  useEffect(() => {
    if (!expenseParam || expensesLoading) return;
    const found = (groupExpenses as ExpenseWithRelations[]).some(
      (e) => e.id === expenseParam,
    );
    if (found) {
      setSelectedExpenseId(expenseParam);
      setActiveModal(GroupModals.ViewExpense);
      setIsOpen(true);
    } else {
      toast('That expense is no longer available.');
    }
    setExpenseParam(null);
    // Consume the param so closing the modal doesn't reopen it.
    router.replace(`/groups/${groupId}`, { scroll: false });
  }, [expenseParam, expensesLoading, groupExpenses, groupId, router]);

  const typedGroup = group as GroupWithRelations | undefined;
  const members = typedGroup?.members ?? [];

  const updateGroupMutation = useUpdateGroup({
    onSuccess: () => {
      toast.success('Group updated successfully');
      setIsOpen(false);
    },
    onError: () => {
      toast.error('Failed to update group');
    },
  });

  const addMemberMutation = useCreateGroupMember({
    onError: () => {
      toast.error('Failed to add member');
    },
  });

  const removeMemberMutation = useRemoveGroupMember({
    onError: (error, variables) => {
      if (error instanceof RemoveMemberConflictError) {
        setRemovalBlockers((prev) => ({
          ...prev,
          [variables.id]: error.blockers,
        }));
        toast.error('Member has unsettled balances');
        return;
      }
      toast.error('Failed to remove member');
    },
  });

  // Modal handlers
  const onAddExpense = () => {
    setActiveModal(GroupModals.AddExpense);
    setIsOpen(true);
  };

  const onViewExpense = (expense: ExpenseWithRelations) => {
    setSelectedExpenseId(expense.id);
    setActiveModal(GroupModals.ViewExpense);
    setIsOpen(true);
  };

  const onEditExpense = () => {
    if (!selectedExpense) return;
    setActiveModal(GroupModals.EditExpense);
    setIsOpen(true);
  };

  const onEditGroup = () => {
    setActiveModal(GroupModals.EditGroup);
    setIsOpen(true);
  };

  const handleUpdateGroup = (data: { name: string; description?: string }) => {
    updateGroupMutation.mutate({ id: groupId, groupData: data });
  };

  const handleAddMember = (userId: string) => {
    addMemberMutation.mutate({ groupMemberData: { groupId, userId } });
  };

  const handleRemoveMember = (groupMemberId: string) => {
    // Clear any prior blocker for this member before retrying
    setRemovalBlockers((prev) => {
      const next = { ...prev };
      delete next[groupMemberId];
      return next;
    });
    removeMemberMutation.mutate({ id: groupMemberId });
  };

  const modals = {
    [GroupModals.AddExpense]: currentUser && (
      <CreateExpenseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        groupId={groupId}
        members={members}
        currentUserId={currentUser.id}
      />
    ),
    [GroupModals.ViewExpense]: (
      <ViewExpenseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        expense={selectedExpense}
        members={members}
        onEdit={onEditExpense}
      />
    ),
    [GroupModals.EditExpense]: currentUser && selectedExpense && (
      <CreateExpenseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        groupId={groupId}
        members={members}
        currentUserId={currentUser.id}
        expense={selectedExpense}
      />
    ),
    [GroupModals.EditGroup]: (
      <EditGroupModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        group={typedGroup ?? null}
        allUsers={allUsers}
        onSave={handleUpdateGroup}
        onAddMember={handleAddMember}
        onRemoveMember={handleRemoveMember}
        isLoading={updateGroupMutation.isPending}
        blockersByMemberId={removalBlockers}
      />
    ),
  };

  if (groupLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 w-64 rounded-2xl bg-card animate-pulse" />
        <div className="h-48 w-full rounded-2xl bg-card animate-pulse" />
      </div>
    );
  }

  if (!typedGroup) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Group not found.</p>
        <Button
          variant="ghost"
          onClick={() => router.push('/groups')}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Groups
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={typedGroup.name}
        subtitle={typedGroup.description || undefined}
        backHref="/groups"
      />
      <SearchParamListener name="expense" onChange={setExpenseParam} />

      <GroupMembersCard members={members} onEditGroup={onEditGroup} />

      <GroupExpensesList
        expenses={groupExpenses}
        members={members}
        onAddExpense={onAddExpense}
        onViewExpense={onViewExpense}
      />

      {activeModal && modals[activeModal]}
    </div>
  );
}
