import { Alert } from 'react-native';

import { PillButton } from '../../ui';
import { ApiError } from '../../../lib/api/client';
import { useRemoveExpense } from '../../../lib/api/mutations/expenseMutation';

export function DeleteExpenseButton({
  id,
  onDeleted,
}: {
  id: string;
  onDeleted: () => void;
}) {
  const removeMutation = useRemoveExpense({
    onSuccess: () => onDeleted(),
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to delete expense';
      Alert.alert('Cannot delete expense', message);
    },
  });

  const confirmDelete = () => {
    Alert.alert(
      'Delete expense?',
      'This removes the expense and its splits. Verified payments block deletion server-side.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeMutation.mutate({ id }),
        },
      ],
    );
  };

  return (
    <PillButton
      label="Delete expense"
      variant="ghost"
      onPress={confirmDelete}
      loading={removeMutation.isPending}
      disabled={removeMutation.isPending}
    />
  );
}
