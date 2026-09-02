import { useEffect, useState } from 'react';
import { View } from 'react-native';

import type { GroupWithRelations } from '@repo/shared/types/entities';

import { ModalSheet, PillButton, TextField } from '../../ui';
import { useUpdateGroup } from '../../../lib/api/mutations/groupMutations';

export function EditGroupSheet({
  visible,
  onClose,
  group,
}: {
  visible: boolean;
  onClose: () => void;
  group: GroupWithRelations | undefined;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useUpdateGroup({
    onSuccess: () => {
      onClose();
    },
    onError: (err) => {
      setError(err.message || 'Failed to update group');
    },
  });

  const handleOpenChange = () => {
    if (updateMutation.isPending) return;
    setError(null);
    onClose();
  };

  // Seed inputs whenever the sheet opens for a new group instance.
  useEffect(() => {
    if (!visible) return;
    setName(group?.name ?? '');
    setDescription(group?.description ?? '');
    setError(null);
  }, [visible, group?.id, group?.name, group?.description]);

  const handleSave = () => {
    if (!group) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    setError(null);
    updateMutation.mutate({
      id: group.id,
      groupData: {
        name: trimmed,
        description: description.trim() || undefined,
      },
    });
  };

  const canSave = name.trim().length > 0 && !updateMutation.isPending;

  return (
    <ModalSheet
      visible={visible}
      onClose={handleOpenChange}
      title="Edit group"
      footer={
        <View className="flex-row gap-3">
          <View className="flex-1">
            <PillButton
              label="Cancel"
              variant="ghost"
              onPress={handleOpenChange}
              disabled={updateMutation.isPending}
            />
          </View>
          <View className="flex-1">
            <PillButton
              label="Save"
              variant="primary"
              onPress={handleSave}
              loading={updateMutation.isPending}
              disabled={!canSave}
            />
          </View>
        </View>
      }
    >
      <View className="gap-4">
        <TextField
          label="Name"
          placeholder="Group name"
          value={name}
          onChangeText={setName}
          autoCapitalize="sentences"
          maxLength={100}
          error={error}
        />
        <TextField
          label="Description"
          placeholder="Optional"
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={280}
        />
      </View>
    </ModalSheet>
  );
}
