import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { quickCapture } from '../services/personalTransactionService';
import type { QuickCaptureData } from '../../types/request';

export const useQuickCapture = (
  mutationOptions?: UseMutationOptions<unknown, Error, QuickCaptureData>,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: QuickCaptureData) => quickCapture(data),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: ['personal-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      mutationOptions?.onSuccess?.(...args);
    },
    ...mutationOptions,
  });
};
