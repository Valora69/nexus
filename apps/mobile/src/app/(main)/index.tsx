import { View } from 'react-native';

import { Button, Card, Screen, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';

export default function HomeScreen() {
  const { signOut } = useAuth();

  return (
    <Screen>
      <View className="flex-1 gap-4 pt-4">
        <Text variant="title">Home</Text>

        <Card>
          <Text variant="label">Balance</Text>
          <Text variant="heading" className="mt-1">
            Dashboard wires up in M4
          </Text>
          <Text variant="muted" className="mt-1">
            This screen will use useGetDashboard + useCurrentUser from @repo/core.
          </Text>
        </Card>

        <View className="mt-auto">
          <Button title="Sign out" variant="secondary" onPress={() => void signOut()} />
        </View>
      </View>
    </Screen>
  );
}
