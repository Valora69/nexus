import { useLocalSearchParams } from 'expo-router';

import { ExpenseFormScreen } from '../../../components/features/expenses';

export default function NewExpense() {
  const { groupId: rawGroupId } = useLocalSearchParams<{ groupId?: string }>();
  const groupId = Array.isArray(rawGroupId) ? rawGroupId[0] : rawGroupId;
  return <ExpenseFormScreen groupId={groupId} />;
}
