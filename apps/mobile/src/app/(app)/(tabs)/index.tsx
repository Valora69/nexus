import { Text, View } from 'react-native';

import { EmptyState, Screen } from '../../../components/ui';

export default function HomeScreen() {
  return (
    <Screen>
      <View className="px-6 pt-6">
        <Text className="text-foreground font-sans-bold text-3xl">Home</Text>
      </View>
      <EmptyState
        title="Dashboard coming soon"
        description="Your monthly summary, recent activity, and quick capture land here in stage 6."
      />
    </Screen>
  );
}
