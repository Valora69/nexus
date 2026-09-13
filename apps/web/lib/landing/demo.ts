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

/** The playground keypad's delete key. */
export const KEYPAD_BACKSPACE = 'backspace';

/** Keypad amounts are whole pesos, up to ₱999,999. */
export const AMOUNT_MAX_DIGITS = 6;

/**
 * One cash-register keypad press: digits (and "00") append, backspace drops
 * the last digit. Leading zeros never stick, and presses past the digit limit
 * are ignored.
 */
export function applyKeypadKey(
  digits: string,
  key: string,
  maxDigits: number = AMOUNT_MAX_DIGITS,
): string {
  if (key === KEYPAD_BACKSPACE) return digits.slice(0, -1);
  if (!/^\d+$/.test(key)) return digits;
  const next = `${digits}${key}`.replace(/^0+/, '');
  return next.length > maxDigits ? digits : next;
}

/**
 * The create-expense modal's confirmation line, in pesos. Like the modal, the
 * "split among" sentence only appears when more than one member is selected.
 */
export function addExpenseConfirmation(
  amount: number,
  name: string,
  memberCount: number,
): string {
  const paid = `You paid ${formatPeso(amount)} for "${name}".`;
  return memberCount > 1
    ? `${paid} This will be split among ${memberCount} members.`
    : paid;
}

/** The bill slicer's grid: dividers land on whole ₱10 amounts. */
export const SLICE_STEP = 10;

/** Round to the nearest multiple of `step` (₱10 by default). */
export function snapToStep(value: number, step: number = SLICE_STEP): number {
  if (step <= 0) return value;
  return Math.round(value / step) * step;
}

/**
 * Shares from the bill slicer's dividers. `dividers` are cumulative peso
 * positions along the bill (n - 1 of them for n people); each share is the gap
 * between neighbours. Positions are clamped into [0, total] and kept in order,
 * so the shares are never negative and always add up to exactly `total`.
 */
export function sharesFromDividers(
  total: number,
  dividers: number[],
): number[] {
  const safeTotal = Math.max(0, total);
  const shares: number[] = [];
  let previous = 0;
  for (const divider of dividers) {
    const position = Math.min(Math.max(divider, previous), safeTotal);
    shares.push(position - previous);
    previous = position;
  }
  shares.push(safeTotal - previous);
  return shares;
}

/**
 * Divider positions for an equal split, snapped to the step. Snapping can
 * leave the last person a step more or less (₱1,000 / 3 → 330, 340, 330).
 */
export function equalDividers(
  total: number,
  n: number,
  step: number = SLICE_STEP,
): number[] {
  if (n <= 1) return [];
  return Array.from({ length: n - 1 }, (_, i) =>
    snapToStep((total * (i + 1)) / n, step),
  );
}

/** How far one divider may move: at least a step from each neighbour. */
export function dividerBounds(
  total: number,
  dividers: number[],
  index: number,
  step: number = SLICE_STEP,
): { min: number; max: number } {
  const min = (index > 0 ? (dividers[index - 1] ?? 0) : 0) + step;
  const max =
    (index < dividers.length - 1 ? (dividers[index + 1] ?? total) : total) -
    step;
  return { min, max: Math.max(min, max) };
}

/**
 * Move one divider to `value`, snapped to the step and clamped so every
 * person keeps at least one step. Returns a new array.
 */
export function moveDivider(
  total: number,
  dividers: number[],
  index: number,
  value: number,
  step: number = SLICE_STEP,
): number[] {
  if (index < 0 || index >= dividers.length) return dividers;
  const { min, max } = dividerBounds(total, dividers, index, step);
  const next = [...dividers];
  next[index] = Math.min(Math.max(snapToStep(value, step), min), max);
  return next;
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
 * pending, verified by the payer → paid. A payment smaller than the share
 * (`amountPaid`) stays partial, just like in the app.
 */
export function demoSplitStatus(
  stage: DemoSettleStage,
  share: number,
  amountPaid: number = share,
): SplitStatus {
  const payments =
    stage === 'unpaid' ? [] : [demoPayment(amountPaid, stage === 'paid')];
  return splitStatus({ amount: share, payments });
}

/**
 * The settle slingshot's charge: how far the note is pulled back, as pesos.
 * Grows linearly with the pull, snaps to ₱10 and never exceeds the share.
 */
export function pullAmount(
  distance: number,
  maxPull: number,
  share: number,
  step: number = SLICE_STEP,
): number {
  if (maxPull <= 0 || share <= 0) return 0;
  const ratio = Math.min(Math.max(distance / maxPull, 0), 1);
  return Math.min(share, snapToStep(share * ratio, step));
}

/** ₱1,234.50 — formatted by hand so server and client render identically. */
export function formatPeso(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const [whole = '0', cents = '00'] = Math.abs(amount).toFixed(2).split('.');
  return `${sign}₱${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${cents}`;
}
