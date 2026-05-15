// Enums
export enum ActivityNameEnum {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
  ASSIGNED = 'ASSIGNED',
}

export enum ActivityOnEnum {
  GROUP_DETAILS = 'GROUP_DETAILS',
  EXPENSE = 'EXPENSE',
  PAYMENT = 'PAYMENT',
  GROUP_MEMBER = 'GROUP_MEMBER',
  EXPENSE_PAYEE = 'EXPENSE_PAYEE',
  EXPENSE_PAYER = 'EXPENSE_PAYER',
}

export enum PaymentMethod {
  GCASH = 'GCASH',
  CASH = 'CASH',
}

// Base entity types
export type User = {
  id: string;
  name: string;
  email: string;
  googleId: string;
  picture?: string;
  gcashNumber?: string;
  createdAt: string;
  updatedAt: string;
};

export type Group = {
  id: string;
  name: string;
  description?: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type GroupMember = {
  id: string;
  groupId: string;
  userId: string;
  joinedAt: string;
};

export type Expense = {
  id: string;
  name: string;
  totalAmount: number;
  groupId: string;
  date: string;
  notes?: string;
  payerId: string;
  payeeId?: string;
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseSplit = {
  id: string;
  expenseId: string;
  userId: string;
  amount: number;
  isPaid: boolean;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type Payment = {
  id: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  paymentProof?: string;
  isVerified: boolean;
  verifiedAt?: string;
  paidAt: string;
  expenseSplitId: string;
};

export type Activity = {
  id: string;
  groupId: string;
  createdByUserId: string;
  activityName: ActivityNameEnum;
  activityOn: ActivityOnEnum;
};

// Extended types with relations (for API responses)
export type ExpenseWithRelations = Expense & {
  group?: {
    id: string;
    name: string;
    description?: string;
  };
  payer?: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
  payee?: {
    id: string;
    name: string;
    email: string;
    picture?: string;
    gcashNumber?: string;
  };
  payment?: Payment;
  splits?: Array<
    ExpenseSplit & {
      user: {
        id: string;
        name: string;
        email: string;
        picture?: string;
      };
    }
  >;
};

export type GroupWithRelations = Group & {
  members?: Array<
    GroupMember & {
      user: {
        id: string;
        name: string;
        email: string;
      };
    }
  >;
  expenses?: Array<{
    id: string;
    name: string;
    totalAmount: number;
    date: string;
  }>;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
};

export type PaymentWithRelations = Payment & {
  expenseSplit: ExpenseSplitWithRelations;
};

export type ActivityWithRelations = Activity & {
  group?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
};

export type ExpenseSplitWithRelations = ExpenseSplit & {
  user: {
    id: string;
    name: string;
    email: string;
    picture?: string;
    gcashNumber?: string;
  };
  payments?: Payment[];
  expense: {
    id: string;
    name: string;
    totalAmount: number;
    date: string;
    notes?: string;
    groupId: string;
    payerId: string;
    payeeId?: string;
    group: {
      id: string;
      name: string;
    };
    payer: {
      id: string;
      name: string;
      email: string;
      picture?: string;
    };
    payee?: {
      id: string;
      name: string;
      email: string;
      picture?: string;
      gcashNumber?: string;
    };
  };
};

// Personal Transactions
export enum PersonalTransactionType {
  EXPENSE = 'EXPENSE',
  CREDIT = 'CREDIT',
}

export type PersonalTransaction = {
  id: string;
  userId: string;
  type: PersonalTransactionType;
  amount: number;
  description: string | null;
  category: string | null;
  source: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type PersonalTransactionSummary = {
  totalExpenses: number;
  totalCredits: number;
  netBalance: number;
};

// Dashboard

export type FeedItem = {
  id: string;
  label: string;
  sublabel: string;
  amount: number;
  date: string;
  isCredit: boolean;
  isFromGroup: boolean;
};

export type PayableItem = {
  to: string;
  amount: number;
  group: string;
};

export type ReceivableItem = {
  from: string;
  amount: number;
  group: string;
};

export type DashboardResponse = {
  // Debt tracking (all-time)
  netBalance: number;
  totalReceivable: number;
  totalPayable: number;
  payables: PayableItem[];
  receivables: ReceivableItem[];
  // Monthly spending
  spent: number;
  monthLabel: string;
  monthParam: string;
  // Unified recent activity
  recentFeed: FeedItem[];
};

// Friend System Enums
export enum FriendRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
}

// Friend System Types
export type FriendRequest = {
  id: string;
  senderId: string;
  recipientEmail: string;
  recipientId?: string;
  status: FriendRequestStatus;
  token: string;
  createdAt: string;
  expiresAt: string;
};

export type Friendship = {
  id: string;
  userId: string;
  friendId: string;
  createdAt: string;
};

// Friend System Types with Relations
export type FriendRequestWithRelations = FriendRequest & {
  sender: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
  recipient?: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  };
};

export type Friend = {
  id: string;
  name: string;
  email: string;
  picture?: string;
};
