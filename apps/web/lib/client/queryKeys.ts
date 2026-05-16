/**
 * Central registry of all TanStack Query keys used across the web app.
 *
 * Why this exists: invalidation has historically been a list of string
 * literals scattered across mutation files. Easy to typo, easy to forget
 * a related domain. This module centralizes the key shape so:
 *   1. invalidations type-check
 *   2. one grep tells you everything that caches under a domain
 *   3. domain helpers in `invalidations.ts` batch related invalidations
 *
 * Conventions:
 *   - Each domain exposes `.all()` (root key) and `.<subview>(...)` builders.
 *   - Invalidating the root key invalidates every sub-key under it
 *     (TanStack matches partial arrays).
 */

export const queryKeys = {
  user: {
    current: () => ['currentUser'] as const,
    all: () => ['users'] as const,
    byId: (id: string) => ['users', id] as const,
  },
  friends: {
    all: () => ['friends'] as const,
    requests: () => ['friendRequests'] as const,
    pendingRequests: () => ['friendRequests', 'pending'] as const,
    sentRequests: () => ['friendRequests', 'sent'] as const,
  },
  groups: {
    all: () => ['groups'] as const,
    byId: (id: string) => ['groups', id] as const,
  },
  groupMembers: {
    all: () => ['groupMembers'] as const,
    byId: (id: string) => ['groupMembers', id] as const,
  },
  expenses: {
    all: () => ['expenses'] as const,
    list: (type?: 'payable' | 'receivable', groupId?: string) =>
      ['expenses', type, groupId] as const,
    byId: (id: string) => ['expenses', id] as const,
  },
  expenseSplits: {
    all: () => ['expense-splits'] as const,
    myPayables: () => ['expense-splits', 'my-payables'] as const,
    myReceivables: () => ['expense-splits', 'my-receivables'] as const,
    byExpenseId: (id: string) => ['expense-splits', 'expense', id] as const,
    byUserId: (id: string) => ['expense-splits', 'user', id] as const,
    byId: (id: string) => ['expense-splits', id] as const,
  },
  payments: {
    all: () => ['payments'] as const,
    pendingVerification: () => ['payments', 'pending-verification'] as const,
    pendingConfirmation: () => ['payments', 'pending-confirmation'] as const,
    byId: (id: string) => ['payments', id] as const,
  },
  personalTransactions: {
    all: () => ['personal-transactions'] as const,
  },
  dashboard: {
    all: () => ['dashboard'] as const,
    forMonth: (month: string | undefined) =>
      ['dashboard', month ?? 'current'] as const,
  },
} as const;
