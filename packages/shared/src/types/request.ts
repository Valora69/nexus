import { ActivityNameEnum, ActivityOnEnum } from './entities';

// Create/Update DTOs
export type ExpenseSplitData = {
  userId: string;
  amount: number;
};

export type CreateExpenseData = {
  name: string;
  totalAmount: number;
  groupId: string;
  payerId: string;
  payeeId?: string;
  date: string;
  notes?: string;
  splits?: ExpenseSplitData[];
};

export type UpdateExpenseData = Partial<CreateExpenseData>;

export type ParseExpenseData = {
  story: string;
  groupId: string;
  payerId: string;
};

export type CreateGroupData = {
  name: string;
  description?: string;
  memberIds?: string[];
};

export type UpdateGroupData = Partial<CreateGroupData>;

export type CreateGroupMemberData = {
  groupId: string;
  userId: string;
};

export type UpdateGroupMemberData = Partial<CreateGroupMemberData>;

export type CreateUserData = {
  name: string;
  email: string;
  googleId: string;
  picture?: string;
  gcashNumber?: string;
};

export type UpdateUserData = Partial<CreateUserData>;

export type CreatePaymentData = {
  expenseSplitId: string;
  amountPaid: number;
  paymentMethod?: 'GCASH' | 'CASH';
  paymentProof?: string;
  paidAt?: string;
};

/** `isVerified` is payee-only; method/proof are editable by the split owner
 * while the payment is unverified. Amount and split are immutable. */
export type UpdatePaymentData = {
  isVerified?: boolean;
  paymentMethod?: 'GCASH' | 'CASH';
  paymentProof?: string;
};

export type CreateActivityData = {
  groupId: string;
  createdByUserId: string;
  activityName: ActivityNameEnum;
  activityOn: ActivityOnEnum;
};

export type UpdateActivityData = Partial<CreateActivityData>;

export type QuickCaptureData = {
  input: string;
};

// Friend System Request Types
export type SendFriendRequestData = {
  email: string;
};

export type AcceptFriendRequestByTokenData = {
  token: string;
};
