'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Card, CardContent } from '@web/components/ui/card';
import { Button } from '@web/components/ui/button';
import { ArrowLeft } from 'lucide-react';

import { useGetGroupById } from '@web/lib/client/queries/groupQueries';
import { useGetAllExpenses } from '@web/lib/client/queries/expenseQueries';

import { useCurrentUser, useGetAllUsers } from '@web/lib/client/queries/userQueries';
import { useUpdateGroup } from '@web/lib/client/mutations/groupMutations';
import { useCreateGroupMember, useRemoveGroupMember } from '@web/lib/client/mutations/groupMemberMutations';
import { CreateExpenseModal } from '@web/components/features/expenses/create-expense-modal';
import { ViewExpenseModal } from '@web/components/features/expenses/view-expense-modal';
import { EditGroupModal } from '@web/components/features/groups/edit-group-modal';
import { GroupHeader } from '@web/components/features/groups/group-header';
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
  const queryClient = useQueryClient();
  const groupId = params.id as string;

  const { data: group, isLoading: groupLoading } = useGetGroupById(groupId);
  const { data: groupExpenses = [] } = useGetAllExpenses(undefined, groupId);
  const { data: currentUser } = useCurrentUser();
  const { data: allUsers = [] } = useGetAllUsers();

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<GroupModals | null>(null);
  const [selectedExpense, setSelectedExpense] =
    useState<ExpenseWithRelations | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setActiveModal(null);
      setSelectedExpense(null);
    }
  }, [isOpen]);

  const typedGroup = group as GroupWithRelations | undefined;
  const members = typedGroup?.members ?? [];

  const updateGroupMutation = useUpdateGroup({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] });
      toast.success('Group updated successfully');
      setIsOpen(false);
    },
    onError: () => {
      toast.error('Failed to update group');
    },
  });

  const addMemberMutation = useCreateGroupMember({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] });
    },
    onError: () => {
      toast.error('Failed to add member');
    },
  });

  const removeMemberMutation = useRemoveGroupMember({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', groupId] });
    },
    onError: () => {
      toast.error('Failed to remove member');
    },
  });

  // Modal handlers
  const onAddExpense = () => {
    setActiveModal(GroupModals.AddExpense);
    setIsOpen(true);
  };

  const onViewExpense = (expense: ExpenseWithRelations) => {
    setSelectedExpense(expense);
    setActiveModal(GroupModals.ViewExpense);
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
      />
    ),
  };

  if (groupLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-10 w-64 bg-muted/30 rounded animate-pulse" />
        <div className="h-48 w-full bg-muted/30 rounded animate-pulse" />
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
      <GroupHeader
        name={typedGroup.name}
        description={typedGroup.description}
        onBack={() => router.push('/groups')}
      />

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
