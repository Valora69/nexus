/**
 * Verify Payment → caches. Regression for the stale-UI bug: the Payments
 * page passes its own `onSuccess`, which used to *replace* the hook's
 * invalidation (spread order), so nothing refreshed until a page remount.
 */
import React from 'react';
import { describe, it, expect, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { queryKeys } from '../lib/client/queryKeys';
import { expenseSettlement } from '../lib/utils/splits';

const VERIFIED_AT = '2026-09-11T10:00:00.000Z';
const mockUpdatePayment = jest.fn(async () => ({
  id: 'pay-1',
  amountPaid: 10,
  paymentMethod: 'CASH',
  isVerified: true,
  verifiedAt: VERIFIED_AT,
  paidAt: VERIFIED_AT,
  expenseSplitId: 'split-james',
}));
jest.mock('../lib/client/services/paymentService', () => ({
  updatePayment: mockUpdatePayment,
  createPayment: jest.fn(),
  removePayment: jest.fn(),
}));

// Loaded after the mock is registered (ES imports would be hoisted above it).
/* eslint-disable @typescript-eslint/no-var-requires */
const { useUpdatePayment } =
  require('../lib/client/mutations/paymentMutation') as typeof import('../lib/client/mutations/paymentMutation');
/* eslint-enable @typescript-eslint/no-var-requires */

const pendingPayment = {
  id: 'pay-1',
  amountPaid: 10,
  paymentMethod: 'CASH',
  isVerified: false,
  paidAt: VERIFIED_AT,
  expenseSplitId: 'split-james',
  expenseSplit: {
    id: 'split-james',
    userId: 'james',
    amount: 10,
    user: { id: 'james', name: 'James Manon-og' },
    expense: {
      id: 'exp-test2',
      name: 'test2',
      payeeId: 'cs3a',
      payee: { id: 'cs3a', name: 'CS3A' },
    },
  },
};

const groupExpensesKey = queryKeys.expenses.list(undefined, 'g1');

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(queryKeys.payments.pendingVerification(), [
    pendingPayment,
  ]);
  queryClient.setQueryData(queryKeys.payments.all(), [pendingPayment]);
  queryClient.setQueryData(groupExpensesKey, [
    {
      id: 'exp-test2',
      payeeId: 'cs3a',
      splits: [
        { id: 'split-cs3a', userId: 'cs3a', amount: 10, payments: [] },
        {
          id: 'split-james',
          userId: 'james',
          amount: 10,
          payments: [{ ...pendingPayment, expenseSplit: undefined }],
        },
      ],
    },
  ]);
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe('verify payment flow', () => {
  it('updates every cached view and still runs the caller onSuccess', async () => {
    const { queryClient, wrapper } = setup();
    const callerOnSuccess = jest.fn();

    const { result } = renderHook(
      () => useUpdatePayment({ onSuccess: callerOnSuccess }),
      { wrapper },
    );

    await act(async () => {
      await result.current.mutateAsync({
        id: 'pay-1',
        paymentData: { isVerified: true },
      });
    });

    expect(mockUpdatePayment).toHaveBeenCalledWith('pay-1', {
      isVerified: true,
    });
    expect(callerOnSuccess).toHaveBeenCalledTimes(1);

    // Pending Verification: gone immediately.
    expect(
      queryClient.getQueryData(queryKeys.payments.pendingVerification()),
    ).toEqual([]);

    // Payment History: now verified, relations preserved.
    const history = queryClient.getQueryData<(typeof pendingPayment)[]>(
      queryKeys.payments.all(),
    )!;
    expect(history[0]).toMatchObject({
      id: 'pay-1',
      isVerified: true,
      verifiedAt: VERIFIED_AT,
      expenseSplit: { expense: { payee: { name: 'CS3A' } } },
    });

    // Group expense: James's share now counts as paid → "Paid by all".
    const [expense] =
      queryClient.getQueryData<Parameters<typeof expenseSettlement>[0][]>(
        groupExpensesKey,
      )!;
    expect(expenseSettlement(expense!)).toMatchObject({
      owing: 1,
      settled: 1,
      isFullySettled: true,
      hasAnyPayment: true,
    });

    // And the domain is invalidated so mounted views refetch to reconcile.
    for (const key of [
      queryKeys.payments.all(),
      queryKeys.payments.pendingVerification(),
      groupExpensesKey,
    ]) {
      expect(queryClient.getQueryState(key)?.isInvalidated).toBe(true);
    }
  });

  it('leaves caches alone when the request fails', async () => {
    const { queryClient, wrapper } = setup();
    mockUpdatePayment.mockRejectedValueOnce(
      new Error('Only the payee can verify this payment'),
    );
    const { result } = renderHook(() => useUpdatePayment({}), { wrapper });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          id: 'pay-1',
          paymentData: { isVerified: true },
        }),
      ).rejects.toThrow('Only the payee can verify this payment');
    });

    expect(
      queryClient.getQueryData(queryKeys.payments.pendingVerification()),
    ).toHaveLength(1);
  });
});
