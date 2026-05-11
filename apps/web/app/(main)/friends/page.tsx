'use client';

import { useState } from 'react';
import { toast } from 'sonner';

import {
  FriendsHeader,
  FriendsTabs,
  FriendsList,
  PendingRequestsList,
  SentRequestsList,
  AddFriendModal,
  RemoveFriendModal,
} from '@web/components/features/friends';
import { FriendModals } from '@web/lib/constants/modals';

import {
  useGetAllFriends,
  useGetPendingRequests,
  useGetSentRequests,
} from '@web/lib/client/queries/friendQueries';
import {
  useSendFriendRequest,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useRemoveFriend,
} from '@web/lib/client/mutations/friendMutations';
import type { Friend } from '@web/lib/types/entities';

export default function FriendsPage() {
  // Modal state
  const [activeModal, setActiveModal] = useState<FriendModals | null>(null);
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);
  const [email, setEmail] = useState('');

  // Data queries
  const { data: friends = [], isLoading: isLoadingFriends } =
    useGetAllFriends();
  const { data: pendingRequests = [], isLoading: isLoadingPending } =
    useGetPendingRequests();
  const { data: sentRequests = [], isLoading: isLoadingSent } =
    useGetSentRequests();

  const isLoading = isLoadingFriends || isLoadingPending || isLoadingSent;

  // Mutations
  const sendRequestMutation = useSendFriendRequest({
    onSuccess: () => {
      toast.success('Friend request sent!');
      setEmail('');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const acceptMutation = useAcceptFriendRequest({
    onSuccess: () => {
      toast.success('Friend request accepted!');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const declineMutation = useDeclineFriendRequest({
    onSuccess: () => {
      toast.success('Friend request declined');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeMutation = useRemoveFriend({
    onSuccess: () => {
      toast.success('Friend removed');
      closeModal();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Modal handlers
  const closeModal = () => {
    setActiveModal(null);
    setFriendToRemove(null);
  };

  const onAddFriend = () => {
    setActiveModal(FriendModals.AddFriend);
  };

  const onRemoveFriend = (friend: Friend) => {
    setFriendToRemove(friend);
    setActiveModal(FriendModals.RemoveFriend);
  };

  // Action handlers
  const handleSendRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    sendRequestMutation.mutate({ data: { email: email.trim() } });
  };

  const handleAccept = (requestId: string) => {
    acceptMutation.mutate({ requestId });
  };

  const handleDecline = (requestId: string) => {
    declineMutation.mutate({ requestId });
  };

  const handleRemove = () => {
    if (!friendToRemove) return;
    removeMutation.mutate({ friendId: friendToRemove.id });
  };

  // Modals mapping
  const modals = {
    [FriendModals.AddFriend]: (
      <AddFriendModal
        isOpen={activeModal === FriendModals.AddFriend}
        onClose={closeModal}
        email={email}
        onEmailChange={setEmail}
        onSubmit={handleSendRequest}
        isPending={sendRequestMutation.isPending}
      />
    ),
    [FriendModals.RemoveFriend]: (
      <RemoveFriendModal
        isOpen={activeModal === FriendModals.RemoveFriend}
        onClose={closeModal}
        friend={friendToRemove}
        onConfirm={handleRemove}
        isPending={removeMutation.isPending}
      />
    ),
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <FriendsHeader onAddFriend={onAddFriend} />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-20 bg-muted/30 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <FriendsHeader onAddFriend={onAddFriend} />

      <FriendsTabs
        friendsCount={friends.length}
        pendingCount={pendingRequests.length}
        sentCount={sentRequests.length}
      >
        <FriendsList
          friends={friends}
          onAddFriend={onAddFriend}
          onRemoveFriend={onRemoveFriend}
        />
        <PendingRequestsList
          requests={pendingRequests}
          onAccept={handleAccept}
          onDecline={handleDecline}
          isAccepting={acceptMutation.isPending}
          isDeclining={declineMutation.isPending}
        />
        <SentRequestsList requests={sentRequests} />
      </FriendsTabs>

      {activeModal && modals[activeModal]}
    </div>
  );
}
