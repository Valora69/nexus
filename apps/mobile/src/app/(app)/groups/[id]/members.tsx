import { useLocalSearchParams } from 'expo-router';

import { ManageMembersScreen } from '../../../../components/features/groups';

export default function GroupMembers() {
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const groupId = Array.isArray(rawId) ? rawId[0] : rawId;
  return <ManageMembersScreen groupId={groupId} />;
}
