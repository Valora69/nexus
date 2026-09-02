/**
 * Create-expense modal — mobile mirror of web's `CreateExpenseModal`.
 *
 * Presented as a modal via `Stack.Screen options.presentation="modal"` so
 * it slides up over the group detail (or wherever the "Add expense" tap
 * originated). Query params:
 *   - `groupId` (required): the group the expense belongs to
 *
 * The split editor supports web's two modes:
 *   - Equal: divide total across selected members
 *   - Custom: per-member overrides; zero / empty amounts silently drop
 *     the member from the splits array (matches web's `buildSplits`)
 *
 * Dates use `@react-native-community/datetimepicker` in `spinner` mode on
 * iOS (per the fixed mobile stack). Android is out of scope for stage 8;
 * the picker still renders acceptably there via the default calendar.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import * as Crypto from 'expo-crypto';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import type { GroupWithRelations } from '@repo/shared/types/entities';
import { formatDate } from '@repo/shared/utils/formatters';

import {
  Amount,
  ErrorState,
  GlassCard,
  LoadingState,
  PillButton,
  Screen,
  TextField,
} from '../../../components/ui';
import { ApiError } from '../../../lib/api/client';
import { useCreateExpense } from '../../../lib/api/mutations/expenseMutation';
import { useGetGroupById } from '../../../lib/api/queries/groupQueries';
import { useCurrentUser } from '../../../lib/api/queries/userQueries';
import {
  buildSplits,
  pickPayerId,
  validateSplits,
  type SplitMode,
} from '../../../lib/expenses/split-form';
import { BRAND_ACCENT_HEX, colors } from '../../../lib/theme';

export default function NewExpenseScreen() {
  const router = useRouter();
  const { groupId: rawGroupId } = useLocalSearchParams<{ groupId?: string }>();
  const groupId = Array.isArray(rawGroupId) ? rawGroupId[0] : rawGroupId;

  const currentUserQuery = useCurrentUser();
  const groupQuery = useGetGroupById(groupId);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Stack.Screen
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
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
  const [showPicker, setShowPicker] = useState(Platform.OS === 'ios');
  const [selectedIds, setSelectedIds] = useState<string[]>(
    members.map((m) => m.userId),
  );
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const createMutation = useCreateExpense({
    onSuccess: () => {
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
  const equalShare = selectedIds.length
    ? totalAmount / selectedIds.length
    : 0;

  const activeCustomIds = useMemo(() => {
    if (splitMode !== 'custom') return selectedIds;
    return selectedIds.filter((id) => {
      const v = parseFloat(customSplits[id] || '0');
      return Number.isFinite(v) && v > 0;
    });
  }, [selectedIds, splitMode, customSplits]);

  const customTotal = useMemo(
    () =>
      activeCustomIds.reduce(
        (sum, id) => sum + (parseFloat(customSplits[id] || '0') || 0),
        0,
      ),
    [activeCustomIds, customSplits],
  );

  const excludedFromCustom = selectedIds.length - activeCustomIds.length;
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
        notes: notes.trim() || (splitMode === 'custom' ? 'Custom split' : undefined),
        splits: result.splits,
      },
      // Generated even for the non-outbox path so the server can dedupe
      // a submit that retried mid-flight; stage 12 will replace this with
      // an outbox-owned id.
      clientRequestId: Crypto.randomUUID(),
    });
  };

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
      <GlassCard>
        <View className="gap-4">
          <TextField
            label="Name"
            placeholder="e.g. Lunch, Ferry ride"
            value={name}
            onChangeText={setName}
            autoCapitalize="sentences"
            maxLength={100}
          />
          <TextField
            label="Total amount (₱)"
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
              onPress={() =>
                setShowPicker(Platform.OS === 'ios' ? true : true)
              }
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
            label="Notes (optional)"
            placeholder="Anything worth remembering"
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={2000}
          />
        </View>
      </GlassCard>

      <GlassCard>
        <View className="flex-row items-center gap-2 mb-3">
          <Ionicons name="people-outline" size={18} color={BRAND_ACCENT_HEX} />
          <Text className="text-foreground font-sans-semibold text-base">
            Split with
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {members.map((m) => {
            const active = selectedIds.includes(m.userId);
            const label = m.user?.name ?? 'Unknown';
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
                  {label}
                  {m.userId === currentUserId ? ' (You)' : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </GlassCard>

      <GlassCard>
        <Text className="text-foreground font-sans-semibold text-base mb-3">
          Split type
        </Text>
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
          <View className="mt-4 gap-2">
            {selectedIds.map((userId) => {
              const member = members.find((m) => m.userId === userId);
              const isMe = userId === currentUserId;
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
                    className={`flex-1 font-sans text-sm ${
                      isMe ? 'text-accent font-sans-semibold' : 'text-foreground'
                    }`}
                    numberOfLines={1}
                  >
                    {member?.user?.name ?? 'Unknown'}
                    {isMe ? ' (Paid)' : ''}
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
              <View className="gap-1">
                <Text
                  className={`text-xs font-sans ${
                    customValid ? 'text-muted' : 'text-loss font-sans-semibold'
                  }`}
                >
                  Assigned ₱{customTotal.toFixed(2)} of ₱{totalAmount.toFixed(2)}
                  {customValid ? '' : ' — must match'}
                </Text>
                {excludedFromCustom > 0 ? (
                  <Text className="text-xs text-muted font-sans">
                    {excludedFromCustom} member
                    {excludedFromCustom > 1 ? 's' : ''} excluded
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </GlassCard>

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
