import { Text, View } from 'react-native';

import { EmptyState, Screen } from '../../../components/ui';

export default function FriendsScreen() {
  return (
    <Screen>
      <View className="px-6 pt-6">
        <Text className="text-foreground font-sans-bold text-3xl">Friends</Text>
      </View>
      <EmptyState
        title="Friends coming soon"
        description="Send and accept friend requests, browse balances, and start group splits."
      />
    </Screen>
  );
}
