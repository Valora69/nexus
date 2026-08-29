/**
 * TanStack Query hooks for expense-split lists. Keys mirror the web
 * client — `myPayables`/`myReceivables` under the shared `expenseSplits`
 * domain — so a mark-paid mutation from either surface invalidates both.
 */

import { queryKeys } from '@repo/shared/queryKeys';
import { useQuery } from '@tanstack/react-query';

import {
  getMyPayableSplits,
  getMyReceivableSplits,
} from '../services/expenseSplitService';

export function useMyPayables() {
  return useQuery({
    queryKey: queryKeys.expenseSplits.myPayables(),
    queryFn: getMyPayableSplits,
    staleTime: 60 * 1000,
  });
}

export function useMyReceivables() {
  return useQuery({
    queryKey: queryKeys.expenseSplits.myReceivables(),
    queryFn: getMyReceivableSplits,
    staleTime: 60 * 1000,
  });
}
