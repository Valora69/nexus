'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  ProfileHeader,
  ProfileCard,
  UsersList,
  EditProfileModal,
  BrowseUsersModal,
  ViewUserModal,
} from '@web/components/features/profile';
import { ProfileModals } from '@web/lib/constants/modals';

import {
  useCurrentUser,
  useGetAllUsers,
} from '@web/lib/client/queries/userQueries';
import { useUpdateUser } from '@web/lib/client/mutations/userMutation';
import type { User } from '@web/lib/types/entities';

export default function ProfilePage() {
  const router = useRouter();

  // Modal state
  const [activeModal, setActiveModal] = useState<ProfileModals | null>(null);
  const [viewUser, setViewUser] = useState<User | null>(null);

  // Edit profile form state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editGcashNumber, setEditGcashNumber] = useState('');
  const [browseSearch, setBrowseSearch] = useState('');

  // Data queries
  const { data: currentUser, isLoading } = useCurrentUser();
  const { data: allUsers = [] } = useGetAllUsers();

  // Mutation
  const updateUserMutation = useUpdateUser({
    onSuccess: () => {
      toast.success('Profile updated');
      closeModal();
    },
  });

  // Modal handlers
  const closeModal = () => {
    setActiveModal(null);
  };

  const onEditProfile = () => {
    if (!currentUser) return;
    setEditName(currentUser.name);
    setEditEmail(currentUser.email);
    setEditGcashNumber(currentUser.gcashNumber || '');
    setActiveModal(ProfileModals.EditProfile);
  };

  const onBrowseUsers = () => {
    setBrowseSearch('');
    setActiveModal(ProfileModals.BrowseUsers);
  };

  const onViewUser = (user: User) => {
    setViewUser(user);
    setActiveModal(ProfileModals.ViewUser);
  };

  const closeViewUser = () => {
    setViewUser(null);
    setActiveModal(null);
  };

  // Action handlers
  const handleLogout = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      toast.success('Logged out successfully');
      router.push('/login');
    } catch {
      router.push('/login');
    }
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;
    try {
      await updateUserMutation.mutateAsync({
        id: currentUser.id,
        userData: {
          name: editName,
          gcashNumber: editGcashNumber || undefined,
        },
      });
    } catch {
      toast.error('Failed to update profile');
    }
  };

  // Filter users for browse modal (exclude current user)
  const usersForBrowse = allUsers.filter((u) => u.id !== currentUser?.id);

  // Modals mapping
  const modals = {
    [ProfileModals.EditProfile]: (
      <EditProfileModal
        isOpen={activeModal === ProfileModals.EditProfile}
        onClose={closeModal}
        name={editName}
        email={editEmail}
        gcashNumber={editGcashNumber}
        onNameChange={setEditName}
        onGcashNumberChange={setEditGcashNumber}
        onSave={handleSaveProfile}
        isPending={updateUserMutation.isPending}
      />
    ),
    [ProfileModals.BrowseUsers]: (
      <BrowseUsersModal
        isOpen={activeModal === ProfileModals.BrowseUsers}
        onClose={closeModal}
        users={usersForBrowse}
        searchQuery={browseSearch}
        onSearchChange={setBrowseSearch}
        onViewUser={(user) => {
          closeModal();
          onViewUser(user);
        }}
      />
    ),
    [ProfileModals.ViewUser]: (
      <ViewUserModal user={viewUser} onClose={closeViewUser} />
    ),
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 max-w-2xl">
        <ProfileHeader onLogout={handleLogout} />
        <div className="h-64 bg-muted/30 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="p-6 space-y-6 max-w-2xl">
        <p className="text-destructive">Please log in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <ProfileHeader onLogout={handleLogout} />

      <ProfileCard user={currentUser} onEdit={onEditProfile} />

      <UsersList
        users={allUsers}
        currentUserId={currentUser.id}
        onBrowse={onBrowseUsers}
        onViewUser={onViewUser}
      />

      {activeModal && modals[activeModal]}
    </div>
  );
}
