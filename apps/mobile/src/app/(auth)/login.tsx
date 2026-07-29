import { useState } from 'react';
import { View } from 'react-native';

import { Button, Screen, Text } from '@/components/ui';
import { useAuth } from '@/lib/auth-context';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPress = async () => {
    setError(null);
    setBusy(true);
    try {
      await signIn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-3">
        <Text variant="title">Money App</Text>
        <Text variant="muted" className="mb-6">
          Sign in to continue
        </Text>

        <View className="w-full">
          <Button
            title="Continue with Google"
            loading={busy}
            onPress={onPress}
          />
        </View>

        {error ? (
          <Text className="mt-2 text-center text-[#ff6b6b]">{error}</Text>
        ) : null}
      </View>
    </Screen>
  );
}
