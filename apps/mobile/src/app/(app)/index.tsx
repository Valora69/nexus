import { Pressable, SafeAreaView, Text, View } from 'react-native';

import { BrandMark } from '../../components/brand-logo';
import { useAuth } from '../../lib/auth/auth-context';

export default function Home() {
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center gap-6 px-6">
        <BrandMark size={64} fontSize={40} />
        <Text className="text-muted font-sans-light text-base text-center">
          Split expenses. Track cash. Zero fees.
        </Text>
        {user ? (
          <View className="items-center gap-1">
            <Text className="text-foreground font-sans-semibold text-lg">{user.name}</Text>
            <Text className="text-muted font-sans text-sm">{user.email}</Text>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            void signOut();
          }}
          className="mt-4 px-6 py-3 rounded-full border border-muted active:opacity-60"
        >
          <Text className="text-foreground font-sans-medium text-sm">Sign out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
