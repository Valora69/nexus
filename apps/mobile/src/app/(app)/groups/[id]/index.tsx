/**
 * Group detail — mobile mirror of web's `/groups/[id]`.
 *
 * Sections, top to bottom:
 *   1. Sticky header: back arrow, group name, description
 *   2. My balance for this group (computed from split payables/receivables
 *      using `@repo/shared/utils/splits` — same source of truth web uses)
 *   3. Members card with counts + Manage button routing to `members.tsx`
 *   4. Edit / delete controls
 *   5. Expenses placeholder card (stage 8 lights this up)
 *
 * The delete flow uses a native confirmation `Alert` because delete is
 * an irreversible action and a bottom-sheet confirm here would clash
 * with the edit sheet the user just opened.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import type {
  ExpenseSplitWithRelations,
  ExpenseWithRelations,
  GroupWithRelations,
} from '@repo/shared/types/entities';
import { formatDateShort } from '@repo/shared/utils/formatters';
import { verifiedPaid } from '@repo/shared/utils/splits';

import {
  Amount,
  Avatar,
  ErrorState,
  GlassCard,
  LoadingState,
  ModalSheet,
  PillButton,
  Screen,
  TextField,
} from '../../../../components/ui';
import { ApiError } from '../../../../lib/api/client';
import {
  useRemoveGroup,
  useUpdateGroup,
} from '../../../../lib/api/mutations/groupMutations';
import { useGetGroupById } from '../../../../lib/api/queries/groupQueries';
import { useGetAllExpenses } from '../../../../lib/api/queries/expenseQueries';
import {
  useMyPayables,
  useMyReceivables,
} from '../../../../lib/api/queries/expenseSplitQueries';
import { BRAND_ACCENT_HEX, colors } from '../../../../lib/theme';

export default function GroupDetailScreen() {
  const router = useRouter();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const groupId = Array.isArray(rawId) ? rawId[0] : rawId;

  const groupQuery = useGetGroupById(groupId);
  const payablesQuery = useMyPayables();
  const receivablesQuery = useMyReceivables();
  const expensesQuery = useGetAllExpenses(undefined, groupId);

  const [editOpen, setEditOpen] = useState(false);

  const onBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/(tabs)/groups');
  };

  const goToMembers = () => {
    if (!groupId) return;
    router.push(`/(app)/groups/${groupId}/members`);
  };

  const goToExpense = (expenseId: string) => {
    router.push(`/(app)/expenses/${expenseId}`);
  };

  const goToNewExpense = () => {
    if (!groupId) return;
    router.push(`/(app)/expenses/new?groupId=${groupId}`);
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <DetailHeader
        title={groupQuery.data?.name ?? 'Group'}
        onBack={onBack}
        onEdit={() => setEditOpen(true)}
      />

      {groupQuery.isLoading ? (
        <LoadingState />
      ) : groupQuery.isError ? (
        <ErrorState
          error={groupQuery.error}
          onRetry={() => groupQuery.refetch()}
        />
      ) : !groupQuery.data ? (
        <ErrorState
          title="Group not found"
          error={new Error('This group no longer exists.')}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 24, gap: 20, paddingBottom: 48 }}
          refreshControl={
            <RefreshControl
              refreshing={groupQuery.isFetching && !groupQuery.isLoading}
              onRefresh={() => {
                groupQuery.refetch();
                payablesQuery.refetch();
                receivablesQuery.refetch();
                expensesQuery.refetch();
              }}
              tintColor={BRAND_ACCENT_HEX}
              colors={[BRAND_ACCENT_HEX]}
            />
          }
        >
          <GroupSummary group={groupQuery.data} />
          <BalanceCard
            groupId={groupQuery.data.id}
            payables={payablesQuery.data}
            receivables={receivablesQuery.data}
            isLoading={
              payablesQuery.isLoading || receivablesQuery.isLoading
            }
          />
          <MembersCard group={groupQuery.data} onManage={goToMembers} />
          <ExpensesCard
            expenses={expensesQuery.data}
            isLoading={expensesQuery.isLoading}
            error={expensesQuery.error as Error | null}
            onAdd={goToNewExpense}
            onOpen={goToExpense}
          />
          <DeleteRow groupId={groupQuery.data.id} onDeleted={onBack} />
        </ScrollView>
      )}

      <EditGroupSheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        group={groupQuery.data}
      />
    </Screen>
  );
}

function DetailHeader({
  title,
  onBack,
  onEdit,
}: {
  title: string;
  onBack: () => void;
  onEdit: () => void;
}) {
  return (
    <View className="px-6 pt-4 pb-2 flex-row items-center justify-between gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={onBack}
        hitSlop={12}
        className="h-10 w-10 items-center justify-center rounded-full border border-border active:bg-card"
      >
        <Ionicons name="chevron-back" size={20} color={colors.foreground} />
      </Pressable>
      <Text
        className="flex-1 text-foreground font-sans-bold text-xl"
        numberOfLines={1}
      >
        {title}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit group"
        onPress={onEdit}
        hitSlop={12}
        className="h-10 w-10 items-center justify-center rounded-full border border-border active:bg-card"
      >
        <Ionicons name="create-outline" size={18} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

function GroupSummary({ group }: { group: GroupWithRelations }) {
  return (
    <GlassCard variant="strong">
      <Text className="text-muted font-sans text-xs uppercase tracking-wider">
        About
      </Text>
      <Text className="text-foreground font-sans-semibold text-lg mt-1">
        {group.name}
      </Text>
      <Text className="text-muted font-sans-light text-sm mt-1">
        {group.description || 'No description'}
      </Text>
    </GlassCard>
  );
}

/**
 * My balance in this group.
 *
 * Same approach as web: sum unsettled shares owed by me (payables) and
 * owed to me (receivables) using `verifiedPaid` from the shared splits
 * util. `net = receivable − payable`. Positive = they owe me.
 */
function BalanceCard({
  groupId,
  payables,
  receivables,
  isLoading,
}: {
  groupId: string;
  payables: ExpenseSplitWithRelations[] | undefined;
  receivables: ExpenseSplitWithRelations[] | undefined;
  isLoading: boolean;
}) {
  const { payable, receivable } = useMemo(() => {
    const payableSum = sumOutstanding(
      (payables ?? []).filter((s) => s.expense.groupId === groupId),
    );
    const receivableSum = sumOutstanding(
      (receivables ?? []).filter((s) => s.expense.groupId === groupId),
    );
    return { payable: payableSum, receivable: receivableSum };
  }, [payables, receivables, groupId]);

  const net = receivable - payable;

  return (
    <GlassCard>
      <Text className="text-muted font-sans text-xs uppercase tracking-wider">
        My balance in this group
      </Text>
      {isLoading ? (
        <Text className="text-muted font-sans text-sm mt-2">Calculating…</Text>
      ) : (
        <>
          <View className="mt-2">
            <Amount value={net} size="xl" tone="auto" signed />
          </View>
          <View className="mt-4 flex-row gap-6">
            <BalanceStat label="Owed to you" value={receivable} tone="gain" />
            <BalanceStat label="You owe" value={payable} tone="loss" />
          </View>
        </>
      )}
    </GlassCard>
  );
}

function BalanceStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: 'gain' | 'loss';
}) {
  return (
    <View className="flex-1">
      <Text className="text-muted font-sans text-xs">{label}</Text>
      <View className="mt-1">
        <Amount value={value} size="md" tone={tone} />
      </View>
    </View>
  );
}

function sumOutstanding(splits: ExpenseSplitWithRelations[]): number {
  return splits.reduce((total, split) => {
    const remaining = split.amount - verifiedPaid(split.payments);
    return remaining > 0.01 ? total + remaining : total;
  }, 0);
}

function MembersCard({
  group,
  onManage,
}: {
  group: GroupWithRelations;
  onManage: () => void;
}) {
  const members = group.members ?? [];
  return (
    <GlassCard>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Ionicons name="people-outline" size={18} color={BRAND_ACCENT_HEX} />
          <Text className="text-foreground font-sans-semibold text-base">
            Members ({members.length})
          </Text>
        </View>
        <PillButton label="Manage" variant="ghost" size="sm" onPress={onManage} />
      </View>
      {members.length === 0 ? (
        <Text className="text-muted font-sans text-sm mt-3">
          No members yet.
        </Text>
      ) : (
        <View className="mt-3 gap-2">
          {members.map((m) => (
            <View key={m.id} className="flex-row items-center gap-3">
              <Avatar name={m.user?.name ?? '?'} size={32} />
              <View className="flex-1">
                <Text
                  className="text-foreground font-sans-medium text-sm"
                  numberOfLines={1}
                >
                  {m.user?.name ?? 'Unknown'}
                </Text>
                <Text
                  className="text-muted font-sans text-xs"
                  numberOfLines={1}
                >
                  {m.user?.email ?? ''}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </GlassCard>
  );
}

function ExpensesCard({
  expenses,
  isLoading,
  error,
  onAdd,
  onOpen,
}: {
  expenses: ExpenseWithRelations[] | undefined;
  isLoading: boolean;
  error: Error | null;
  onAdd: () => void;
  onOpen: (expenseId: string) => void;
}) {
  return (
    <GlassCard>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <Ionicons name="receipt-outline" size={18} color={BRAND_ACCENT_HEX} />
          <Text className="text-foreground font-sans-semibold text-base">
            Expenses ({expenses?.length ?? 0})
          </Text>
        </View>
        <PillButton label="Add" variant="primary" size="sm" onPress={onAdd} />
      </View>
      {isLoading ? (
        <Text className="text-muted font-sans text-sm mt-3">Loading…</Text>
      ) : error ? (
        <Text className="text-loss font-sans text-sm mt-3">
          {error.message}
        </Text>
      ) : !expenses || expenses.length === 0 ? (
        <Text className="text-muted font-sans text-sm mt-3">
          No expenses yet. Tap Add to record one.
        </Text>
      ) : (
        <View className="mt-3 gap-2">
          {expenses.map((expense) => {
            const paidBy =
              expense.payee?.name ?? expense.payer?.name ?? 'Unknown';
            const splitCount = expense.splits?.length ?? 0;
            return (
              <Pressable
                key={expense.id}
                accessibilityRole="button"
                accessibilityLabel={`Open expense ${expense.name}`}
                onPress={() => onOpen(expense.id)}
                className="flex-row items-center justify-between gap-3 p-3 rounded-xl bg-card active:bg-card-hover"
              >
                <View className="flex-1">
                  <Text
                    className="text-foreground font-sans-medium text-sm"
                    numberOfLines={1}
                  >
                    {expense.name}
                  </Text>
                  <Text
                    className="text-muted font-sans text-xs mt-0.5"
                    numberOfLines={1}
                  >
                    {paidBy} · {formatDateShort(expense.date)}
                    {splitCount > 0 ? ` · ${splitCount} splits` : ''}
                  </Text>
                </View>
                <Amount value={expense.totalAmount} size="sm" tone="neutral" />
              </Pressable>
            );
          })}
        </View>
      )}
    </GlassCard>
  );
}

function DeleteRow({
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

function EditGroupSheet({
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

