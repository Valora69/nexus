// Legacy API (NestJS on Render) — used by domains not yet migrated.
const LEGACY = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080'}/api`;

// Same-origin route handlers (Next.js on Vercel).
const LOCAL = '/api';

/**
 * Per-domain base URLs. Each domain flips from LEGACY → LOCAL as its
 * route handlers ship. Atomic with the deploy, git-revertable.
 */
export const API_BASES = {
  auth: LOCAL,
  user: LOCAL,
  group: LOCAL,
  groupMember: LOCAL,
  activity: LOCAL,
  friend: LOCAL,
  expense: LOCAL,
  expenseSplit: LOCAL,
  payment: LOCAL,
  personalTransaction: LOCAL,
  dashboard: LOCAL,
} as const;

// Re-export for backward compat — services that haven't migrated yet
// still import BASE_URL. As each service switches to API_BASES, this
// export will have fewer consumers and can be removed in Phase 5.
export const BASE_URL = LEGACY;
