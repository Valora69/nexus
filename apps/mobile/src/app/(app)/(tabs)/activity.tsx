import { Text, View } from 'react-native';

import { EmptyState, Screen } from '../../../components/ui';

export default function ActivityScreen() {
  return (
    <Screen>
      <View className="px-6 pt-6">
        <Text className="text-foreground font-sans-bold text-3xl">Activity</Text>
      </View>
      <EmptyState
        title="Activity coming soon"
        description="A running feed of expenses, payments, and friend events will live here."
      />
    </Screen>
  );
}
