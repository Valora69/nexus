'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  GroupsListHeader,
  GroupsGrid,
  EmptyGroups,
  CreateGroupModal,
} from '@web/components/features/groups-list';
import { GroupListModals } from '@web/lib/constants/modals';

import { useGetAllGroups } from '@web/lib/client/queries/groupQueries';
import { useGetAllUsers, useCurrentUser } from '@web/lib/client/queries/userQueries';
import { useCreateGroup } from '@web/lib/client/mutations/groupMutations';

export default function GroupsPage() {
  const router = useRouter();

  // Modal state
  const [activeModal, setActiveModal] = useState<GroupListModals | null>(null);

  // Form state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Data queries
  const { data: groups = [], isLoading } = useGetAllGroups();
  const { data: allUsers = [] } = useGetAllUsers();
  const { data: currentUser } = useCurrentUser();

  const selectableUsers = allUsers.filter((u) => u.id !== currentUser?.id);

  // Mutations
  const createGroupMutation = useCreateGroup();

  // Modal handlers
  const closeModal = () => {
    setActiveModal(null);
  };

  const resetForm = () => {
    setNewName('');
    setNewDesc('');
    setSelectedUserIds([]);
  };

  const openCreateModal = () => {
    resetForm();
    setActiveModal(GroupListModals.CreateGroup);
  };

  // Action handlers
  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createGroupMutation.mutateAsync({
        groupData: {
          name: newName.trim(),
          description: newDesc.trim() || undefined,
          memberIds: selectedUserIds,
        },
      });

      toast.success('Group created successfully');
      closeModal();
      resetForm();
    } catch {
      toast.error('Failed to create group');
    }
  };

  const handleGroupClick = (groupId: string) => {
    router.push(`/groups/${groupId}`);
  };

  // Modals mapping
  const modals = {
    [GroupListModals.CreateGroup]: (
      <CreateGroupModal
        isOpen={activeModal === GroupListModals.CreateGroup}
        onClose={closeModal}
        name={newName}
        description={newDesc}
        selectedUserIds={selectedUserIds}
        users={selectableUsers}
        onNameChange={setNewName}
        onDescriptionChange={setNewDesc}
        onToggleUser={toggleUser}
        onCreate={handleCreate}
        isPending={createGroupMutation.isPending}
      />
    ),
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <GroupsListHeader onCreateGroup={openCreateModal} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 bg-muted/30 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <GroupsListHeader onCreateGroup={openCreateModal} />

      {groups.length === 0 ? (
        <EmptyGroups />
      ) : (
        <GroupsGrid groups={groups} onGroupClick={handleGroupClick} />
      )}

      {activeModal && modals[activeModal]}
    </div>
  );
}
