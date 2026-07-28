import { View } from 'react-native';

import { Empty, Screen, Text } from '@/components/ui';

export default function GroupsScreen() {
  return (
    <Screen>
      <View className="pt-4">
        <Text variant="title">Groups</Text>
      </View>
      <Empty
        title="No groups yet"
        hint="Group list + detail arrive in M4, wired to useGetAllGroups."
      />
    </Screen>
  );
}
