import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';

import type {
  ExpenseSplitWithRelations,
  ExpenseWithRelations,
} from '@repo/shared/types/entities';
import { formatDate } from '@repo/shared/utils/formatters';

import { ModalSheet, PillButton, TextField } from '../../ui';
import { ApiError } from '../../../lib/api/client';
import { useUpdateExpense } from '../../../lib/api/mutations/expenseMutation';
import { useGetGroupById } from '../../../lib/api/queries/groupQueries';
import { useCurrentUser } from '../../../lib/api/queries/userQueries';
import {
  pickPayerId,
  validateSplits,
  type SplitMode,
} from '../../../lib/expenses/split-form';
import { SplitEditor, isCustomSplitValid } from './split-editor';

export function EditExpenseSheet({
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
    onSuccess: () => onClose(),
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
    const startInCustom =
      expense.notes?.toLowerCase().includes('custom') || isUneven;
    setSplitMode(startInCustom ? 'custom' : 'equal');
    const map: Record<string, string> = {};
    for (const s of splitRows) map[s.userId] = String(s.amount);
    setCustomSplits(map);
    setError(null);
  }, [visible, expense, splits]);

  const members = groupQuery.data?.members ?? [];
  const totalAmount = parseFloat(amount || '0');

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

  const customValid = isCustomSplitValid({
    splitMode,
    selectedIds,
    customSplits,
    totalAmount,
  });

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

        {members.length === 0 ? (
          <Text className="text-muted font-sans text-sm">
            {groupQuery.isLoading ? 'Loading members…' : 'No members.'}
          </Text>
        ) : (
          <SplitEditor
            members={members}
            currentUserId={currentUserQuery.data?.id ?? ''}
            selectedIds={selectedIds}
            onToggleMember={toggleMember}
            splitMode={splitMode}
            onSplitModeChange={setSplitMode}
            customSplits={customSplits}
            onCustomSplitsChange={setCustomSplits}
            amount={amount}
            totalAmount={totalAmount}
          />
        )}

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
