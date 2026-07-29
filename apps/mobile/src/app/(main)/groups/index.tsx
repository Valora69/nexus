import type { Group } from '@repo/core';
import { useCreateGroup } from '@repo/core/mutations/groupMutations';
import { useGetAllGroups } from '@repo/core/queries/groupQueries';
import { Link, type Href } from 'expo-router';
import { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';

import {
  Button,
  Card,
  Empty,
  ErrorState,
  Input,
  Loading,
  Screen,
  Text,
} from '@/components/ui';

export default function GroupsScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const groups = useGetAllGroups() as {
    data?: Group[];
    isPending: boolean;
    isError: boolean;
    refetch: () => void;
    isRefetching: boolean;
  };

  return (
    <Screen>
      <View className="flex-row items-center justify-between pt-4">
        <Text variant="title">Groups</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create group"
          onPress={() => setModalOpen(true)}
          className="rounded-full border border-border px-4 py-2 active:opacity-60"
        >
          <Text variant="body">New</Text>
        </Pressable>
      </View>

      {groups.isPending ? (
        <Loading label="Loading groups…" />
      ) : groups.isError ? (
        <ErrorState
          message="Couldn't load your groups."
          onRetry={() => groups.refetch()}
        />
      ) : (
        <FlatList
          data={groups.data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerClassName="gap-3 py-4"
          contentContainerStyle={
            (groups.data ?? []).length === 0 ? { flexGrow: 1 } : undefined
          }
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={groups.isRefetching}
              onRefresh={() => groups.refetch()}
              tintColor="#ffffff"
            />
          }
          ListEmptyComponent={
            <Empty
              title="No groups yet"
              hint="Create a group to start splitting expenses."
            />
          }
          renderItem={({ item }) => (
            <Link href={`/groups/${item.id}` as Href} asChild>
              <Pressable accessibilityRole="button" className="active:opacity-60">
                <Card>
                  <Text variant="body">{item.name}</Text>
                  {item.description ? (
                    <Text variant="muted" className="mt-0.5">
                      {item.description}
                    </Text>
                  ) : null}
                </Card>
              </Pressable>
            </Link>
          )}
        />
      )}

      <CreateGroupModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Screen>
  );
}

function CreateGroupModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const createGroup = useCreateGroup() as {
    mutateAsync: (v: { groupData: { name: string; description?: string } }) => Promise<unknown>;
    isPending: boolean;
  };

  const close = () => {
    setName('');
    setDescription('');
    setError(null);
    onClose();
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    setError(null);
    try {
      await createGroup.mutateAsync({
        groupData: {
          name: trimmed,
          ...(description.trim() ? { description: description.trim() } : {}),
        },
      });
      close();
    } catch {
      setError('Could not create the group. Please try again.');
    }
  };

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent
      onRequestClose={close}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end"
      >
        <View className="rounded-t-3xl border-t border-border bg-bg p-5 pb-10">
          <Text variant="heading" className="mb-4">
            New group
          </Text>

          <View className="gap-3">
            <Input
              label="Name"
              value={name}
              onChangeText={setName}
              placeholder="Samal trip"
              autoFocus
              error={error ?? undefined}
            />
            <Input
              label="Description (optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="Weekend expenses"
            />
          </View>

          <View className="mt-5 gap-2">
            <Button
              title="Create group"
              loading={createGroup.isPending}
              onPress={() => void submit()}
            />
            <Button title="Cancel" variant="secondary" onPress={close} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
