import { Text, View } from 'react-native';

import { EmptyState, Screen } from '../../../components/ui';

export default function GroupsScreen() {
  return (
    <Screen>
      <View className="px-6 pt-6">
        <Text className="text-foreground font-sans-bold text-3xl">Groups</Text>
      </View>
      <EmptyState
        title="Groups coming soon"
        description="Shared expense groups, members, and balances will render here."
      />
    </Screen>
  );
}
