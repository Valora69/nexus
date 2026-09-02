import { useLocalSearchParams } from 'expo-router';

import { ExpenseDetailScreen } from '../../../components/features/expenses';

export default function ExpenseDetail() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  return <ExpenseDetailScreen id={id} />;
}
