/**
 * Expense detail — mobile mirror of web's `/expenses/[id]` view, plus
 * the edit affordance web splits into a separate modal.
 *
 * The expense query provides the base fields; a companion splits query
 * (with `payments`) drives the per-member settlement badge, computed
 * from `@repo/shared/utils/splits` so this screen never reads the
 * deprecated `isPaid` column. Delete uses a native `Alert` for the
 * confirmation — matches the group detail flow and keeps a destructive
 * action out of a bottom sheet.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

import type {
  ExpenseSplitWithRelations,
  ExpenseWithRelations,
} from '@repo/shared/types/entities';
import { formatDate, formatDateTime } from '@repo/shared/utils/formatters';
import {
  isSplitSettled,
  verifiedPaid,
} from '@repo/shared/utils/splits';

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
} from '../../../components/ui';
import { ApiError } from '../../../lib/api/client';
import {
  useRemoveExpense,
  useUpdateExpense,
} from '../../../lib/api/mutations/expenseMutation';
import { useGetExpenseById } from '../../../lib/api/queries/expenseQueries';
import { useSplitsByExpenseId } from '../../../lib/api/queries/expenseSplitQueries';
import { useGetGroupById } from '../../../lib/api/queries/groupQueries';
import { useCurrentUser } from '../../../lib/api/queries/userQueries';
import {
  pickPayerId,
  validateSplits,
  type SplitMode,
} from '../../../lib/expenses/split-form';
import { BRAND_ACCENT_HEX, colors } from '../../../lib/theme';

export default function ExpenseDetailScreen() {
  const router = useRouter();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const expenseQuery = useGetExpenseById(id);
  const splitsQuery = useSplitsByExpenseId(id);

  const [editOpen, setEditOpen] = useState(false);

  const onBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/(tabs)/groups');
  };

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Header
        title={expenseQuery.data?.name ?? 'Expense'}
        onBack={onBack}
        onEdit={() => setEditOpen(true)}
        canEdit={!!expenseQuery.data}
      />

      {expenseQuery.isLoading ? (
        <LoadingState />
      ) : expenseQuery.isError ? (
        <ErrorState
          error={expenseQuery.error}
          onRetry={() => expenseQuery.refetch()}
        />
      ) : !expenseQuery.data ? (
        <ErrorState
          title="Expense not found"
          error={new Error('This expense no longer exists.')}
        />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 24, gap: 20, paddingBottom: 48 }}
          refreshControl={
            <RefreshControl
              refreshing={
                expenseQuery.isFetching && !expenseQuery.isLoading
              }
              onRefresh={() => {
                expenseQuery.refetch();
                splitsQuery.refetch();
              }}
              tintColor={BRAND_ACCENT_HEX}
              colors={[BRAND_ACCENT_HEX]}
            />
          }
        >
          <SummaryCard expense={expenseQuery.data} />
          <SplitsCard
            splits={splitsQuery.data}
            isLoading={splitsQuery.isLoading}
            error={splitsQuery.error as Error | null}
          />
          <MetaCard expense={expenseQuery.data} />
          <DeleteRow id={expenseQuery.data.id} onDeleted={onBack} />
        </ScrollView>
      )}

      <EditExpenseSheet
        visible={editOpen}
        onClose={() => setEditOpen(false)}
        expense={expenseQuery.data}
        splits={splitsQuery.data}
      />
    </Screen>
  );
}

function Header({
  title,
  onBack,
  onEdit,
  canEdit,
}: {
  title: string;
  onBack: () => void;
  onEdit: () => void;
  canEdit: boolean;
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
        accessibilityLabel="Edit expense"
        onPress={onEdit}
        disabled={!canEdit}
        hitSlop={12}
        className={`h-10 w-10 items-center justify-center rounded-full border border-border active:bg-card ${
          canEdit ? '' : 'opacity-40'
        }`}
      >
        <Ionicons name="create-outline" size={18} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

function SummaryCard({ expense }: { expense: ExpenseWithRelations }) {
  const paidBy = expense.payee?.name ?? expense.payer?.name ?? 'Unknown';
  return (
    <GlassCard variant="strong">
      <Text className="text-muted font-sans text-xs uppercase tracking-wider">
        {expense.group?.name ?? 'Expense'}
      </Text>
      <Text className="text-foreground font-sans-bold text-2xl mt-1">
        {expense.name}
      </Text>
      <View className="mt-2">
        <Amount value={expense.totalAmount} size="xl" tone="neutral" />
      </View>
      <Text className="text-muted font-sans text-sm mt-2">
        Paid by <Text className="text-accent">{paidBy}</Text> ·{' '}
        {formatDate(expense.date)}
      </Text>
      {expense.notes ? (
        <Text className="text-foreground font-sans-light text-sm mt-3">
          {expense.notes}
        </Text>
      ) : null}
    </GlassCard>
  );
}

function SplitsCard({
  splits,
  isLoading,
  error,
}: {
  splits: ExpenseSplitWithRelations[] | undefined;
  isLoading: boolean;
  error: Error | null;
}) {
  return (
    <GlassCard>
      <View className="flex-row items-center gap-2">
        <Ionicons name="pie-chart-outline" size={18} color={BRAND_ACCENT_HEX} />
        <Text className="text-foreground font-sans-semibold text-base">
          Splits
        </Text>
      </View>
      {isLoading ? (
        <Text className="text-muted font-sans text-sm mt-3">Loading…</Text>
      ) : error ? (
        <Text className="text-loss font-sans text-sm mt-3">
          {error.message}
        </Text>
      ) : !splits || splits.length === 0 ? (
        <Text className="text-muted font-sans text-sm mt-3">
          No splits recorded.
        </Text>
      ) : (
        <View className="mt-3 gap-2">
          {splits.map((s) => {
            const paid = verifiedPaid(s.payments);
            const settled = isSplitSettled(s);
            const remaining = Math.max(0, s.amount - paid);
            return (
              <View
                key={s.id}
                className="flex-row items-center gap-3 p-3 rounded-xl bg-card"
              >
                <Avatar name={s.user?.name ?? '?'} size={32} />
                <View className="flex-1">
                  <Text
                    className="text-foreground font-sans-medium text-sm"
                    numberOfLines={1}
                  >
                    {s.user?.name ?? 'Unknown'}
                  </Text>
                  <Text className="text-muted font-sans text-xs" numberOfLines={1}>
                    {settled
                      ? 'Settled'
                      : paid > 0
                        ? `₱${paid.toFixed(2)} paid · ₱${remaining.toFixed(2)} left`
                        : `₱${s.amount.toFixed(2)} owed`}
                  </Text>
                </View>
                <View className="items-end">
                  <Amount value={s.amount} size="sm" tone="neutral" />
                  <View
                    className={`mt-1 px-2 py-0.5 rounded-full ${
                      settled ? 'bg-gain/20' : 'bg-border/30'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-sans-semibold uppercase tracking-wider ${
                        settled ? 'text-gain' : 'text-muted'
                      }`}
                    >
                      {settled ? 'Settled' : 'Unsettled'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </GlassCard>
  );
}

function MetaCard({ expense }: { expense: ExpenseWithRelations }) {
  return (
    <GlassCard>
      <Text className="text-muted font-sans text-xs uppercase tracking-wider">
        Metadata
      </Text>
      <View className="mt-2 gap-1">
        <Text className="text-muted font-sans text-xs">
          Created {formatDateTime(expense.createdAt)}
        </Text>
        <Text className="text-muted font-sans text-xs">
          Updated {formatDateTime(expense.updatedAt)}
        </Text>
      </View>
    </GlassCard>
  );
}

function DeleteRow({
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

function EditExpenseSheet({
  visible,
  onClose,
  expense,
  splits,
}: {
  visible: boolean;
  onClose: () => void;
  expense: ExpenseWithRelations | undefined;
  splits: ExpenseSplitWithRelations[] | undefined;
}) {
  const currentUserQuery = useCurrentUser();
  const groupQuery = useGetGroupById(expense?.groupId, visible && !!expense);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useUpdateExpense({
    onSuccess: () => {
      onClose();
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to update expense';
      setError(message);
    },
  });

  // Seed inputs whenever the sheet opens for a fresh expense.
  useEffect(() => {
    if (!visible || !expense) return;
    setName(expense.name);
    setAmount(String(expense.totalAmount));
    setNotes(expense.notes ?? '');
    setDate(new Date(expense.date));
    setShowPicker(Platform.OS === 'ios');
    const splitRows = splits ?? expense.splits ?? [];
    const ids = splitRows.map((s) => s.userId);
    setSelectedIds(ids);
    const amounts = splitRows.map((s) => s.amount);
    const isUneven =
      amounts.length > 1 &&
      amounts.some((a) => Math.abs(a - amounts[0]!) > 0.01);
    const startInCustom = expense.notes?.toLowerCase().includes('custom') || isUneven;
    setSplitMode(startInCustom ? 'custom' : 'equal');
    const map: Record<string, string> = {};
    for (const s of splitRows) map[s.userId] = String(s.amount);
    setCustomSplits(map);
    setError(null);
  }, [visible, expense, splits]);

  const members = groupQuery.data?.members ?? [];
  const totalAmount = parseFloat(amount || '0');
  const equalShare = selectedIds.length ? totalAmount / selectedIds.length : 0;

  const activeCustomIds = useMemo(() => {
    if (splitMode !== 'custom') return selectedIds;
    return selectedIds.filter((id) => {
      const v = parseFloat(customSplits[id] || '0');
      return Number.isFinite(v) && v > 0;
    });
  }, [splitMode, selectedIds, customSplits]);

  const customTotal = useMemo(
    () =>
      activeCustomIds.reduce(
        (sum, id) => sum + (parseFloat(customSplits[id] || '0') || 0),
        0,
      ),
    [activeCustomIds, customSplits],
  );
  const customValid =
    splitMode !== 'custom' ||
    (activeCustomIds.length > 0 &&
      Math.abs(customTotal - totalAmount) <= 0.01);

  const toggleMember = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const onDateChange = (
    _event: DateTimePickerEvent,
    picked: Date | undefined,
  ) => {
    if (Platform.OS !== 'ios') setShowPicker(false);
    if (picked) setDate(picked);
  };

  const handleClose = () => {
    if (updateMutation.isPending) return;
    setError(null);
    onClose();
  };

  const handleSave = () => {
    if (!expense || !currentUserQuery.data) return;
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
    const payerId = pickPayerId(result.splits, currentUserQuery.data.id);
    updateMutation.mutate({
      id: expense.id,
      expenseData: {
        name: name.trim(),
        totalAmount,
        groupId: expense.groupId,
        payerId,
        payeeId: currentUserQuery.data.id,
        date: date.toISOString(),
        notes:
          notes.trim() ||
          (splitMode === 'custom' ? 'Custom split' : undefined),
        splits: result.splits,
      },
    });
  };

  const canSave =
    !!name.trim() &&
    totalAmount > 0 &&
    selectedIds.length > 0 &&
    customValid &&
    !updateMutation.isPending;

  return (
    <ModalSheet
      visible={visible}
      onClose={handleClose}
      title="Edit expense"
      footer={
        <View className="flex-row gap-3">
          <View className="flex-1">
            <PillButton
              label="Cancel"
              variant="ghost"
              onPress={handleClose}
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
      <ScrollView
        style={{ maxHeight: 480 }}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 16, paddingBottom: 8 }}
      >
        <TextField
          label="Name"
          placeholder="Expense name"
          value={name}
          onChangeText={setName}
          maxLength={100}
        />
        <TextField
          label="Total (₱)"
          placeholder="0.00"
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
        />
        <View className="gap-1.5">
          <Text className="text-muted font-sans-medium text-xs uppercase tracking-wider">
            Date
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => setShowPicker(true)}
            className="bg-card border border-border-strong rounded-xl px-4 py-3"
          >
            <Text className="text-foreground font-sans text-base">
              {formatDate(date)}
            </Text>
          </Pressable>
          {showPicker ? (
            <DateTimePicker
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              maximumDate={new Date()}
              themeVariant="dark"
            />
          ) : null}
        </View>
        <TextField
          label="Notes"
          placeholder="Optional"
          value={notes}
          onChangeText={setNotes}
          multiline
          maxLength={2000}
        />

        <View>
          <Text className="text-muted font-sans-medium text-xs uppercase tracking-wider mb-2">
            Split with
          </Text>
          {members.length === 0 ? (
            <Text className="text-muted font-sans text-sm">
              {groupQuery.isLoading ? 'Loading members…' : 'No members.'}
            </Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {members.map((m) => {
                const active = selectedIds.includes(m.userId);
                return (
                  <Pressable
                    key={m.userId}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => toggleMember(m.userId)}
                    className={`px-3 py-1.5 rounded-full border ${
                      active
                        ? 'bg-accent border-accent'
                        : 'bg-card border-border-strong'
                    }`}
                  >
                    <Text
                      className={`text-xs font-sans-medium ${
                        active ? 'text-accent-foreground' : 'text-foreground'
                      }`}
                    >
                      {m.user?.name ?? 'Unknown'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <PillButton
              label="Equal"
              variant={splitMode === 'equal' ? 'primary' : 'ghost'}
              onPress={() => setSplitMode('equal')}
            />
          </View>
          <View className="flex-1">
            <PillButton
              label="Custom"
              variant={splitMode === 'custom' ? 'primary' : 'ghost'}
              onPress={() => setSplitMode('custom')}
            />
          </View>
        </View>

        {selectedIds.length > 0 && amount ? (
          <View className="gap-2">
            {selectedIds.map((userId) => {
              const member = members.find((m) => m.userId === userId);
              const custom = parseFloat(customSplits[userId] || '0');
              const isZeroCustom =
                splitMode === 'custom' &&
                (!Number.isFinite(custom) || custom <= 0);
              return (
                <View
                  key={userId}
                  className={`flex-row items-center justify-between gap-3 p-3 rounded-xl bg-card ${
                    isZeroCustom ? 'opacity-60' : ''
                  }`}
                >
                  <Text
                    className="flex-1 text-foreground font-sans text-sm"
                    numberOfLines={1}
                  >
                    {member?.user?.name ?? 'Unknown'}
                    {isZeroCustom ? ' — excluded' : ''}
                  </Text>
                  {splitMode === 'equal' ? (
                    <Amount value={equalShare} size="sm" tone="neutral" />
                  ) : (
                    <TextField
                      placeholder="0.00"
                      value={customSplits[userId] ?? ''}
                      keyboardType="decimal-pad"
                      onChangeText={(v) =>
                        setCustomSplits((prev) => ({ ...prev, [userId]: v }))
                      }
                      containerClassName="w-28"
                    />
                  )}
                </View>
              );
            })}
            {splitMode === 'custom' ? (
              <Text
                className={`text-xs font-sans ${
                  customValid ? 'text-muted' : 'text-loss font-sans-semibold'
                }`}
              >
                Assigned ₱{customTotal.toFixed(2)} of ₱{totalAmount.toFixed(2)}
                {customValid ? '' : ' — must match'}
              </Text>
            ) : null}
          </View>
        ) : null}

        {error ? (
          <Text className="text-loss font-sans text-sm">{error}</Text>
        ) : null}
      </ScrollView>
    </ModalSheet>
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
