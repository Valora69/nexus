import { describe, it, expect } from '@jest/globals';

import {
  expenseSettlement,
  hasAnyPayment,
  splitStatus,
} from '../lib/utils/splits';
import { PaymentMethod, type Payment } from '../lib/types/entities';

const payment = (amountPaid: number, isVerified: boolean): Payment => ({
  id: `p-${amountPaid}-${isVerified}`,
  amountPaid,
  isVerified,
  paymentMethod: PaymentMethod.CASH,
  paidAt: '2026-09-11T00:00:00.000Z',
  expenseSplitId: 's',
});

describe('splitStatus', () => {
  it('is unpaid with no payments', () => {
    expect(splitStatus({ amount: 10, payments: [] })).toBe('unpaid');
    expect(splitStatus({ amount: 10 })).toBe('unpaid');
  });

  it('is paid once verified payments cover the share', () => {
    expect(splitStatus({ amount: 10, payments: [payment(10, true)] })).toBe(
      'paid',
    );
    expect(
      splitStatus({
        amount: 10,
        payments: [payment(4, true), payment(6, true)],
      }),
    ).toBe('paid');
  });

  it('is pending when unverified payments complete the share', () => {
    expect(splitStatus({ amount: 10, payments: [payment(10, false)] })).toBe(
      'pending',
    );
    expect(
      splitStatus({
        amount: 10,
        payments: [payment(4, true), payment(6, false)],
      }),
    ).toBe('pending');
  });

  it('is partial when payments do not cover the share', () => {
    expect(splitStatus({ amount: 10, payments: [payment(4, true)] })).toBe(
      'partial',
    );
    expect(splitStatus({ amount: 10, payments: [payment(4, false)] })).toBe(
      'partial',
    );
  });
});

describe('hasAnyPayment', () => {
  it('detects pending and verified payments', () => {
    expect(hasAnyPayment(undefined)).toBe(false);
    expect(hasAnyPayment([{ payments: [] }, {}])).toBe(false);
    expect(hasAnyPayment([{ payments: [payment(1, false)] }])).toBe(true);
  });
});

describe('expenseSettlement', () => {
  it("excludes the payee's own share from the debt count", () => {
    // test2: James fronted ₱20, CS3A owes ₱10 and has paid.
    const result = expenseSettlement({
      payeeId: 'james',
      splits: [
        { userId: 'james', amount: 10, payments: [] },
        { userId: 'cs3a', amount: 10, payments: [payment(10, true)] },
      ],
    });
    expect(result).toEqual({
      owing: 1,
      settled: 1,
      hasAnyPayment: true,
      isFullySettled: true,
    });
  });

  it('reports partial progress and locks on a pending payment', () => {
    const result = expenseSettlement({
      payeeId: 'a',
      splits: [
        { userId: 'b', amount: 5, payments: [payment(5, true)] },
        { userId: 'c', amount: 5, payments: [payment(5, false)] },
      ],
    });
    expect(result).toEqual({
      owing: 2,
      settled: 1,
      hasAnyPayment: true,
      isFullySettled: false,
    });
  });

  it('is never "settled" when nobody owes anything', () => {
    const result = expenseSettlement({
      payeeId: 'a',
      splits: [{ userId: 'a', amount: 20, payments: [] }],
    });
    expect(result.owing).toBe(0);
    expect(result.isFullySettled).toBe(false);
    expect(result.hasAnyPayment).toBe(false);
  });
});
