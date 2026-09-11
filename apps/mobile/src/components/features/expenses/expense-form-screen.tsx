/**
 * Create-expense modal — mobile mirror of web's `CreateExpenseModal`.
 *
 * Presented as a modal via `Stack.Screen options.presentation="modal"` so
 * it slides up over the group detail (or wherever the "Add expense" tap
 * originated). Query param `groupId` is required.
 *
 * The split editor supports web's two modes:
 *   - Equal: divide total across selected members
 *   - Custom: per-member overrides; zero / empty amounts silently drop
 *     the member from the splits array (matches web's `buildSplits`)
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import * as Crypto from 'expo-crypto';
import { useRouter, Stack } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import type { GroupWithRelations } from '@repo/shared/types/entities';

import {
  ErrorState,
  LoadingState,
  PillButton,
  Screen,
} from '../../ui';
import { ApiError } from '../../../lib/api/client';
import { useCreateExpense } from '../../../lib/api/mutations/expenseMutation';
import { useGetGroupById } from '../../../lib/api/queries/groupQueries';
import { useCurrentUser } from '../../../lib/api/queries/userQueries';
import {
  pickPayerId,
  validateSplits,
  type SplitMode,
} from '../../../lib/expenses/split-form';
import { colors } from '../../../lib/theme';
import { ExpenseFormFields } from './expense-form-fields';
import { SplitEditor, isCustomSplitValid } from './split-editor';

export function ExpenseFormScreen({ groupId }: { groupId: string | undefined }) {
  const router = useRouter();
  const currentUserQuery = useCurrentUser();
  const groupQuery = useGetGroupById(groupId);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ presentation: 'modal', headerShown: false }} />
      <Header title="New expense" onClose={() => router.back()} />
      {!groupId ? (
        <ErrorState
          title="No group selected"
          error={new Error('Open this screen from a group.')}
        />
      ) : currentUserQuery.isLoading || groupQuery.isLoading ? (
        <LoadingState />
      ) : currentUserQuery.isError || groupQuery.isError ? (
        <ErrorState
          error={currentUserQuery.error ?? groupQuery.error}
          onRetry={() => {
            currentUserQuery.refetch();
            groupQuery.refetch();
          }}
        />
      ) : !groupQuery.data || !currentUserQuery.data ? (
        <ErrorState
          title="Group not found"
          error={new Error('This group no longer exists.')}
        />
      ) : (
        <NewExpenseForm
          group={groupQuery.data}
          currentUserId={currentUserQuery.data.id}
          onCreated={() => router.back()}
        />
      )}
    </Screen>
  );
}

function Header({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <View className="px-6 pt-4 pb-2 flex-row items-center justify-between gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        onPress={onClose}
        hitSlop={12}
        className="h-10 w-10 items-center justify-center rounded-full border border-border active:bg-card"
      >
        <Ionicons name="close" size={20} color={colors.foreground} />
      </Pressable>
      <Text className="flex-1 text-foreground font-sans-bold text-xl">
        {title}
      </Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

function NewExpenseForm({
  group,
  currentUserId,
  onCreated,
}: {
  group: GroupWithRelations;
  currentUserId: string;
  onCreated: () => void;
}) {
  const members = group.members ?? [];

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [selectedIds, setSelectedIds] = useState<string[]>(
    members.map((m) => m.userId),
  );
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateExpense({
    onSuccess: (result) => {
      if (result.kind === 'queued') {
        // Offline: the outbox owns the write from here on. Let the user
        // know before backing out so an "add expense, nothing appears"
        // race can't look like a bug.
        Alert.alert(
          'Queued for sync',
          "This expense will send as soon as you're back online.",
        );
      }
      onCreated();
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to add expense';
      setError(message);
    },
  });

  const totalAmount = parseFloat(amount || '0');

  const toggleMember = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleSubmit = () => {
    setError(null);
    const result = validateSplits({
      name,
      totalAmount,
      selectedMemberIds: selectedIds,
      splitMode,
      customSplits,
    });
    if (!result.ok) {
      setError(errorMessage(result.error));
      return;
    }
    const payerId = pickPayerId(result.splits, currentUserId);
    createMutation.mutate({
      expenseData: {
        name: name.trim(),
        totalAmount,
        groupId: group.id,
        payerId,
        payeeId: currentUserId,
        date: date.toISOString(),
        notes:
          notes.trim() || (splitMode === 'custom' ? 'Custom split' : undefined),
        splits: result.splits,
      },
      // Generated even for the non-outbox path so the server can dedupe
      // a submit that retried mid-flight; stage 12 will replace this with
      // an outbox-owned id.
      clientRequestId: Crypto.randomUUID(),
    });
  };

  const customValid = isCustomSplitValid({
    splitMode,
    selectedIds,
    customSplits,
    totalAmount,
  });

  const canSubmit =
    !!name.trim() &&
    totalAmount > 0 &&
    selectedIds.length > 0 &&
    customValid &&
    !createMutation.isPending;

  if (members.length === 0) {
    return (
      <ErrorState
        title="No members yet"
        error={new Error('Add members to this group before creating expenses.')}
      />
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 24, gap: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <ExpenseFormFields
        name={name}
        amount={amount}
        notes={notes}
        date={date}
        onNameChange={setName}
        onAmountChange={setAmount}
        onNotesChange={setNotes}
        onDateChange={setDate}
      />

      <SplitEditor
        members={members}
        currentUserId={currentUserId}
        selectedIds={selectedIds}
        onToggleMember={toggleMember}
        splitMode={splitMode}
        onSplitModeChange={setSplitMode}
        customSplits={customSplits}
        onCustomSplitsChange={setCustomSplits}
        amount={amount}
        totalAmount={totalAmount}
      />

      {error ? (
        <Text className="text-loss font-sans text-sm">{error}</Text>
      ) : null}

      <PillButton
        label="Add expense"
        variant="primary"
        onPress={() => {
          if (!canSubmit) return;
          Alert.alert(
            'Add expense?',
            `You paid ₱${totalAmount.toFixed(2)} for "${name.trim()}".`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Add', onPress: handleSubmit },
            ],
          );
        }}
        loading={createMutation.isPending}
        disabled={!canSubmit}
      />
    </ScrollView>
  );
}

function errorMessage(code: string | undefined): string {
  switch (code) {
    case 'nameRequired':
      return 'Give the expense a name.';
    case 'invalidAmount':
      return 'Enter a valid amount greater than zero.';
    case 'noMembers':
      return 'Select at least one member.';
    case 'noParticipants':
      return 'At least one member must have a non-zero amount.';
    case 'sumMismatch':
      return 'Split amounts must equal the total.';
    default:
      return 'Please check the form and try again.';
  }
}
