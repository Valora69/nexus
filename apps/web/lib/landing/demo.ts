/**
 * Demo data and pure helpers for the interactive landing page.
 *
 * Everything here mirrors real product behavior so the landing demos never
 * promise something the app doesn't do:
 *   - capture uses `parseGroupCapture` with these members
 *   - equal/custom split rules copy `create-expense-modal.tsx`
 *   - settle statuses come from the shared `splitStatus`
 */
import type { GroupCaptureMember } from '../quick-capture/parseGroupCapture';
import { splitStatus, type SplitStatus } from '../utils/splits';
import { PaymentMethod, type Payment } from '../types/entities';

export const DEMO_CURRENT_USER: GroupCaptureMember = {
  userId: 'me',
  name: 'You',
};

/** Group members as the capture parser sees them (current user included —
 * the parser excludes them itself, like the real modal). */
export const DEMO_MEMBERS: GroupCaptureMember[] = [
  DEMO_CURRENT_USER,
  { userId: 'james', name: 'James' },
  { userId: 'mika', name: 'Mika' },
  { userId: 'mara', name: 'Mara' },
];

export type DemoExpense = {
  name: string;
  total: number;
  payerId: string;
  participantIds: string[];
};

export const DEMO_EXPENSE: DemoExpense = {
  name: 'Pizza night',
  total: 1200,
  payerId: DEMO_CURRENT_USER.userId,
  participantIds: [DEMO_CURRENT_USER.userId, 'james', 'mika'],
};

/**
 * One share per participant. Same math as the product's equal split
 * (`total / n`, displayed with `toFixed(2)`) — deliberately no centavo
 * reallocation, so ₱100 / 3 shows ₱33.33 each.
 */
export function equalShares(total: number, n: number): number[] {
  if (n <= 0) return [];
  const share = total > 0 ? total / n : 0;
  return Array.from({ length: n }, () => share);
}

export type CustomValidity = {
  assigned: number;
  isValid: boolean;
  excludedCount: number;
  activeIds: string[];
};

/**
 * Custom split rules from the create-expense modal: only positive amounts
 * count, zero/blank shares are excluded, and the assigned total must match
 * within one cent.
 */
export function customValidity(
  total: number,
  shares: Record<string, string | number | undefined>,
): CustomValidity {
  const ids = Object.keys(shares);
  const valueOf = (id: string) => {
    const raw = shares[id];
    const v = typeof raw === 'number' ? raw : parseFloat(raw || '0');
    return isFinite(v) ? v : 0;
  };
  const activeIds = ids.filter((id) => valueOf(id) > 0);
  const assigned = activeIds.reduce((sum, id) => sum + valueOf(id), 0);
  return {
    assigned,
    isValid: activeIds.length > 0 && Math.abs(assigned - total) <= 0.01,
    excludedCount: ids.length - activeIds.length,
    activeIds,
  };
}

export type DemoSettleStage = 'unpaid' | 'pending' | 'paid';

// Fixed timestamp keeps fixtures deterministic (no Date.now during render).
const DEMO_PAID_AT = '2026-01-01T00:00:00.000Z';

function demoPayment(amountPaid: number, isVerified: boolean): Payment {
  return {
    id: `demo-${isVerified ? 'verified' : 'pending'}`,
    amountPaid,
    paymentMethod: PaymentMethod.GCASH,
    paymentProof: 'demo-proof',
    isVerified,
    paidAt: DEMO_PAID_AT,
    expenseSplitId: 'demo-split',
  };
}

/**
 * Status of one debtor's share at a stage of the settle demo, computed by the
 * real `splitStatus`: nothing recorded → unpaid, marked paid with proof →
 * pending, verified by the payer → paid.
 */
export function demoSplitStatus(
  stage: DemoSettleStage,
  share: number,
): SplitStatus {
  const payments =
    stage === 'unpaid' ? [] : [demoPayment(share, stage === 'paid')];
  return splitStatus({ amount: share, payments });
}

/** ₱1,234.50 — formatted by hand so server and client render identically. */
export function formatPeso(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const [whole = '0', cents = '00'] = Math.abs(amount).toFixed(2).split('.');
  return `${sign}₱${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${cents}`;
}
