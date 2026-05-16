import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { quickCapture } from '../services/personalTransactionService';
import type { QuickCaptureData } from '../../types/request';
import { invalidatePersonalTransactionDomain } from '../invalidations';

export const useQuickCapture = (
  mutationOptions?: UseMutationOptions<unknown, Error, QuickCaptureData>,
) => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, QuickCaptureData>({
    mutationFn: (data: QuickCaptureData) => quickCapture(data),
    onSuccess: (...args) => {
      invalidatePersonalTransactionDomain(queryClient);
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};
