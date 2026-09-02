/**
 * Group detail — mobile mirror of web's `/groups/[id]`.
 *
 * Sections, top to bottom:
 *   1. Sticky header: back arrow, group name, edit button
 *   2. About summary
 *   3. My balance for this group (computed from split payables/receivables
 *      using `@repo/shared/utils/splits`)
 *   4. Members card with counts + Manage button routing to `members.tsx`
 *   5. Expenses list
 *   6. Delete button
 *
 * The delete flow uses a native confirmation `Alert` because delete is
 * an irreversible action and a bottom-sheet confirm here would clash
 * with the edit sheet the user just opened.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';

import { ErrorState, GlassCard, LoadingState, Screen } from '../../ui';
import { useGetGroupById } from '../../../lib/api/queries/groupQueries';
import { useGetAllExpenses } from '../../../lib/api/queries/expenseQueries';
import {
  useMyPayables,
  useMyReceivables,
} from '../../../lib/api/queries/expenseSplitQueries';
import { BRAND_ACCENT_HEX } from '../../../lib/theme';
import { DeleteGroupButton } from './delete-group-button';
import { EditGroupSheet } from './edit-group-sheet';
import { GroupBalancesCard } from './group-balances-card';
import { GroupExpensesList } from './group-expenses-list';
import { GroupHeader } from './group-header';
import { GroupMembersCard } from './group-members-card';

export function GroupDetailScreen({ groupId }: { groupId: string | undefined }) {
  const router = useRouter();

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
      <GroupHeader
        title={groupQuery.data?.name ?? 'Group'}
        onBack={onBack}
        onEdit={() => setEditOpen(true)}
      />

      {groupQuery.isLoading ? (
        <LoadingState />
      ) : groupQuery.isError ? (
        <ErrorState error={groupQuery.error} onRetry={() => groupQuery.refetch()} />
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
          <GlassCard variant="strong">
            <Text className="text-muted font-sans text-xs uppercase tracking-wider">
              About
            </Text>
            <Text className="text-foreground font-sans-semibold text-lg mt-1">
              {groupQuery.data.name}
            </Text>
            <Text className="text-muted font-sans-light text-sm mt-1">
              {groupQuery.data.description || 'No description'}
            </Text>
          </GlassCard>
          <GroupBalancesCard
            groupId={groupQuery.data.id}
            payables={payablesQuery.data}
            receivables={receivablesQuery.data}
            isLoading={payablesQuery.isLoading || receivablesQuery.isLoading}
          />
          <GroupMembersCard group={groupQuery.data} onManage={goToMembers} />
          <GroupExpensesList
            expenses={expensesQuery.data}
            isLoading={expensesQuery.isLoading}
            error={expensesQuery.error as Error | null}
            onAdd={goToNewExpense}
            onOpen={goToExpense}
          />
          <DeleteGroupButton groupId={groupQuery.data.id} onDeleted={onBack} />
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
