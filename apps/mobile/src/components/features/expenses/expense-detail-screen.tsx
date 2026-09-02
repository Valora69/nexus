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
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { ErrorState, LoadingState, Screen } from '../../ui';
import { useGetExpenseById } from '../../../lib/api/queries/expenseQueries';
import { useSplitsByExpenseId } from '../../../lib/api/queries/expenseSplitQueries';
import { BRAND_ACCENT_HEX, colors } from '../../../lib/theme';
import { DeleteExpenseButton } from './delete-expense-button';
import { EditExpenseSheet } from './edit-expense-sheet';
import { ExpenseMetaCard } from './expense-meta-card';
import { ExpenseSplitsCard } from './expense-splits-card';
import { ExpenseSummaryCard } from './expense-summary-card';

export function ExpenseDetailScreen({ id }: { id: string | undefined }) {
  const router = useRouter();
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
              refreshing={expenseQuery.isFetching && !expenseQuery.isLoading}
              onRefresh={() => {
                expenseQuery.refetch();
                splitsQuery.refetch();
              }}
              tintColor={BRAND_ACCENT_HEX}
              colors={[BRAND_ACCENT_HEX]}
            />
          }
        >
          <ExpenseSummaryCard expense={expenseQuery.data} />
          <ExpenseSplitsCard
            splits={splitsQuery.data}
            isLoading={splitsQuery.isLoading}
            error={splitsQuery.error as Error | null}
          />
          <ExpenseMetaCard expense={expenseQuery.data} />
          <DeleteExpenseButton id={expenseQuery.data.id} onDeleted={onBack} />
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
