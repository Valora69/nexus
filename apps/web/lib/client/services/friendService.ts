import { BASE_URL } from '../config';
import type { Friend, FriendRequestWithRelations } from '../../types/entities';
import type {
  SendFriendRequestData,
  AcceptFriendRequestByTokenData,
} from '../../types/request';

const FRIEND_URI = '/friend';

export const sendFriendRequest = async (
  data: SendFriendRequestData,
): Promise<{ message: string }> => {
  const response = await fetch(`${BASE_URL}${FRIEND_URI}/request`, {
    method: 'POST',
    body: JSON.stringify(data),
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send friend request');
  }

  return response.json();
};

export const getPendingRequests = async (): Promise<
  FriendRequestWithRelations[]
> => {
  const response = await fetch(`${BASE_URL}${FRIEND_URI}/requests`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch pending requests');
  }

  return response.json();
};

export const getSentRequests = async (): Promise<
  FriendRequestWithRelations[]
> => {
  const response = await fetch(`${BASE_URL}${FRIEND_URI}/requests/sent`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch sent requests');
  }

  return response.json();
};

export const acceptFriendRequest = async (
  requestId: string,
): Promise<{ message: string }> => {
  const response = await fetch(
    `${BASE_URL}${FRIEND_URI}/requests/${requestId}/accept`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to accept friend request');
  }

  return response.json();
};

export const acceptFriendRequestByToken = async (
  data: AcceptFriendRequestByTokenData,
): Promise<{ message: string }> => {
  const response = await fetch(
    `${BASE_URL}${FRIEND_URI}/requests/accept-by-token`,
    {
      method: 'POST',
      body: JSON.stringify(data),
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to accept friend request');
  }

  return response.json();
};

export const declineFriendRequest = async (
  requestId: string,
): Promise<{ message: string }> => {
  const response = await fetch(
    `${BASE_URL}${FRIEND_URI}/requests/${requestId}/decline`,
    {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to decline friend request');
  }

  return response.json();
};

export const getAllFriends = async (): Promise<Friend[]> => {
  const response = await fetch(`${BASE_URL}${FRIEND_URI}`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch friends');
  }

  return response.json();
};

export const removeFriend = async (
  friendId: string,
): Promise<{ message: string }> => {
  const response = await fetch(`${BASE_URL}${FRIEND_URI}/${friendId}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to remove friend');
  }

  return response.json();
};
