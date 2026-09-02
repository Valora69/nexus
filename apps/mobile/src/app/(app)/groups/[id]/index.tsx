import { useLocalSearchParams } from 'expo-router';

import { GroupDetailScreen } from '../../../../components/features/groups';

export default function GroupDetail() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const groupId = Array.isArray(rawId) ? rawId[0] : rawId;
  return <GroupDetailScreen groupId={groupId} />;
}
