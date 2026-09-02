import { Alert } from 'react-native';

import { PillButton } from '../../ui';
import { ApiError } from '../../../lib/api/client';
import { useRemoveGroup } from '../../../lib/api/mutations/groupMutations';

export function DeleteGroupButton({
  groupId,
  onDeleted,
}: {
  groupId: string;
  onDeleted: () => void;
}) {
  const removeGroup = useRemoveGroup({
    onSuccess: () => onDeleted(),
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to delete group';
      Alert.alert('Cannot delete group', message);
    },
  });

  const confirmDelete = () => {
    Alert.alert(
      'Delete group?',
      'This removes the group for every member and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeGroup.mutate({ id: groupId }),
        },
      ],
    );
  };

  return (
    <PillButton
      label="Delete group"
      variant="ghost"
      onPress={confirmDelete}
      loading={removeGroup.isPending}
      disabled={removeGroup.isPending}
    />
  );
}
