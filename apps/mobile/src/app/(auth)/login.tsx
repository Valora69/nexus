/**
 * Public sign-in screen. Layout is intentionally simple:
 *
 *   [ hero block: brand mark + tagline ]           — vertically centered
 *   [ CTA block: Google button + error text ]      — pinned near bottom
 *
 * We anchor the CTA with `paddingBottom` inside a `SafeAreaView` bottom
 * edge instead of relying on `flex-1 justify-between` on a
 * `SafeAreaView`, which has been fragile in Expo Router + NativeWind
 * combos (safe-area padding vs. flex distribution).
 */

import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
        setSubmitting(false);
        return;
      }
      await signIn(idToken);
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
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom', 'left', 'right']}>
      <View className="flex-1 items-center justify-center px-6">
        <BrandMark size={64} fontSize={36} />
        <Text className="text-muted font-sans-light text-base text-center mt-4">
          Split expenses. Track cash. Zero fees.
        </Text>
      </View>

      <View className="px-6 pb-8 gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled }}
          onPress={onPress}
          disabled={disabled}
          className={`bg-accent rounded-full py-4 items-center justify-center min-h-14 ${
            disabled ? 'opacity-50' : 'active:opacity-80'
          }`}
        >
          {submitting ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text className="text-accent-foreground font-sans-semibold text-base tracking-wide">
              Continue with Google
            </Text>
          )}
        </Pressable>

        {configError ? (
          <Text className="text-loss font-sans text-xs text-center">
            {configError}
          </Text>
        ) : null}
        {error ? (
          <Text className="text-loss font-sans text-sm text-center">{error}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
