import { useState } from 'react';
import { ActivityIndicator, Pressable, SafeAreaView, Text, View } from 'react-native';

import { BrandMark } from '../../components/brand-logo';
import { useAuth } from '../../lib/auth/auth-context';
import { useGoogleAuth } from '../../lib/auth/use-google-auth';
import { ApiError } from '../../lib/api/client';

export default function Login() {
  const { signIn } = useAuth();
  const { promptAsync, ready, configError } = useGoogleAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = submitting || !ready;

  const onPress = async () => {
    if (disabled) return;
    setError(null);
    setSubmitting(true);
    try {
      const idToken = await promptAsync();
      if (!idToken) {
        // User cancelled or Google returned no id_token.
        setSubmitting(false);
        return;
      }
      await signIn(idToken);
      // Layout guard redirects to (app) as soon as status flips.
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Sign-in failed. Please try again.';
      setError(message);
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-between px-6 py-12">
        <View className="items-center gap-4 mt-16">
          <BrandMark size={72} fontSize={44} />
          <Text className="text-muted font-sans-light text-base text-center">
            Split expenses. Track cash. Zero fees.
          </Text>
        </View>

        <View className="gap-4">
          <Pressable
            accessibilityRole="button"
            onPress={onPress}
            disabled={disabled}
            className={`bg-accent rounded-full py-4 items-center justify-center min-h-14 ${
              disabled ? 'opacity-50' : 'active:opacity-80'
            }`}
          >
            {submitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text className="text-background font-sans-semibold text-base tracking-wide">
                Continue with Google
              </Text>
            )}
          </Pressable>

          {configError ? (
            <Text className="text-loss font-sans text-sm text-center">{configError}</Text>
          ) : null}
          {error ? (
            <Text className="text-loss font-sans text-sm text-center">{error}</Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
