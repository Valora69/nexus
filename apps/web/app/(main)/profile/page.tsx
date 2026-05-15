'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import {
  ProfileHeader,
  ProfileCard,
  EditProfileModal,
} from '@web/components/features/profile';
import {
  FriendsTabs,
  FriendsList,
  PendingRequestsList,
  AddFriendModal,
  RemoveFriendModal,
} from '@web/components/features/friends';
import { Card, CardContent } from '@web/components/ui/card';

import { useCurrentUser } from '@web/lib/client/queries/userQueries';
import {
  useGetAllFriends,
  useGetPendingRequests,
} from '@web/lib/client/queries/friendQueries';
import { useGetAllGroups } from '@web/lib/client/queries/groupQueries';
import { useUpdateUser } from '@web/lib/client/mutations/userMutation';
import {
  useSendFriendRequest,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useRemoveFriend,
} from '@web/lib/client/mutations/friendMutations';
import type { Friend } from '@web/lib/types/entities';

function AccountStats({
  friendsCount,
  groupsCount,
  memberSince,
}: {
  friendsCount: number;
  groupsCount: number;
  memberSince: string;
}) {
  const since = new Date(memberSince).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-3 divide-x divide-border text-center">
          <div className="px-3 py-1">
            <p className="text-xl font-mono font-light">{friendsCount}</p>
            <p className="text-xs text-muted-foreground font-light mt-0.5">
              Friends
            </p>
          </div>
          <div className="px-3 py-1">
            <p className="text-xl font-mono font-light">{groupsCount}</p>
            <p className="text-xs text-muted-foreground font-light mt-0.5">
              Groups
            </p>
          </div>
          <div className="px-3 py-1">
            <p className="text-sm font-light tracking-wide leading-6">{since}</p>
            <p className="text-xs text-muted-foreground font-light mt-0.5">
              Member since
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AccountPage() {
  const router = useRouter();

  // Profile modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editGcashNumber, setEditGcashNumber] = useState('');

  // Friend modal state
  const [addFriendOpen, setAddFriendOpen] = useState(false);
  const [removeFriendOpen, setRemoveFriendOpen] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);
  const [friendEmail, setFriendEmail] = useState('');

  // Data queries
  const { data: currentUser, isLoading: userLoading } = useCurrentUser();
  const { data: friends = [], isLoading: friendsLoading } = useGetAllFriends();
  const { data: pendingRequests = [], isLoading: pendingLoading } =
    useGetPendingRequests();
  const { data: groups = [] } = useGetAllGroups();

  const isLoading = userLoading || friendsLoading || pendingLoading;

  // Mutations
  const updateUserMutation = useUpdateUser({
    onSuccess: () => {
      toast.success('Profile updated');
      setEditOpen(false);
    },
  });

  const sendRequestMutation = useSendFriendRequest({
    onSuccess: () => {
      toast.success('Friend request sent!');
      setFriendEmail('');
      setAddFriendOpen(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const acceptMutation = useAcceptFriendRequest({
    onSuccess: () => toast.success('Friend request accepted!'),
    onError: (error) => toast.error(error.message),
  });

  const declineMutation = useDeclineFriendRequest({
    onSuccess: () => toast.success('Friend request declined'),
    onError: (error) => toast.error(error.message),
  });

  const removeMutation = useRemoveFriend({
    onSuccess: () => {
      toast.success('Friend removed');
      setRemoveFriendOpen(false);
      setFriendToRemove(null);
    },
    onError: (error) => toast.error(error.message),
  });

  // Profile handlers
  const onEditProfile = () => {
    if (!currentUser) return;
    setEditName(currentUser.name);
    setEditGcashNumber(currentUser.gcashNumber || '');
    setEditOpen(true);
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

  const handleLogout = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      router.push('/login');
    }
  };

  // Friend handlers
  const onAddFriend = () => setAddFriendOpen(true);

  const onRemoveFriend = (friend: Friend) => {
    setFriendToRemove(friend);
    setRemoveFriendOpen(true);
  };

  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friendEmail.trim()) return;
    sendRequestMutation.mutate({ data: { email: friendEmail.trim() } });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-9 w-28 bg-muted/30 rounded animate-pulse" />
            <div className="h-4 w-44 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6">
          <div className="space-y-4">
            <div className="h-40 bg-muted/30 rounded-lg animate-pulse" />
            <div className="h-16 bg-muted/30 rounded-lg animate-pulse" />
          </div>
          <div className="h-64 bg-muted/30 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="p-6 space-y-6">
      <ProfileHeader onLogout={handleLogout} />

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-6 items-start">
        {/* Left column — identity */}
        <div className="space-y-4">
          <ProfileCard user={currentUser} onEdit={onEditProfile} />
          <AccountStats
            friendsCount={friends.length}
            groupsCount={groups.length}
            memberSince={currentUser.createdAt}
          />
        </div>

        {/* Right column — social */}
        <FriendsTabs
          friendsCount={friends.length}
          pendingCount={pendingRequests.length}
          onAddFriend={onAddFriend}
        >
          <FriendsList
            friends={friends}
            onAddFriend={onAddFriend}
            onRemoveFriend={onRemoveFriend}
          />
          <PendingRequestsList
            requests={pendingRequests}
            onAccept={(id) => acceptMutation.mutate({ requestId: id })}
            onDecline={(id) => declineMutation.mutate({ requestId: id })}
            isAccepting={acceptMutation.isPending}
            isDeclining={declineMutation.isPending}
          />
        </FriendsTabs>
      </div>

      <EditProfileModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        name={editName}
        email={currentUser.email}
        gcashNumber={editGcashNumber}
        onNameChange={setEditName}
        onGcashNumberChange={setEditGcashNumber}
        onSave={handleSaveProfile}
        isPending={updateUserMutation.isPending}
      />

      <AddFriendModal
        isOpen={addFriendOpen}
        onClose={() => {
          setAddFriendOpen(false);
          setFriendEmail('');
        }}
        email={friendEmail}
        onEmailChange={setFriendEmail}
        onSubmit={handleSendRequest}
        isPending={sendRequestMutation.isPending}
      />

      <RemoveFriendModal
        isOpen={removeFriendOpen}
        onClose={() => {
          setRemoveFriendOpen(false);
          setFriendToRemove(null);
        }}
        friend={friendToRemove}
        onConfirm={() =>
          friendToRemove && removeMutation.mutate({ friendId: friendToRemove.id })
        }
        isPending={removeMutation.isPending}
      />
    </div>
  );
}
