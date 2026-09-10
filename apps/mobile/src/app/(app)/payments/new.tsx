import { useLocalSearchParams } from 'expo-router';

import { RecordPaymentScreen } from '../../../components/features/payments';

export default function NewPayment() {
  const { splitId: rawSplitId } = useLocalSearchParams<{ splitId?: string }>();
  const splitId = Array.isArray(rawSplitId) ? rawSplitId[0] : rawSplitId;
  return <RecordPaymentScreen splitId={splitId} />;
}
