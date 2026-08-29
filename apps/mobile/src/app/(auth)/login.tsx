/**
 * Public sign-in screen.
 *
 * Layout: a bulletproof two-block stack — flex-1 hero (BrandMark
 * vertically centered) + fixed-height CTA anchored to the bottom safe
 * area. The outer container uses inline styles so we don't depend on
 * NativeWind having `cssInterop` wired for `SafeAreaView` in every
 * build variant — a broken `flex-1` class on the outer element
 * collapses both children to the top, which is what we saw in the
 * previous iteration.
 *
 * Navigation: we call `router.replace('/(app)/(tabs)')` explicitly
 * after `signIn` resolves instead of relying purely on the `(auth)`
 * layout's declarative `<Redirect />`. The layout redirect fires on
 * cold-start but is racy on the same-tick state flip a successful
 * sign-in produces — an explicit replace makes navigation happen
 * deterministically the moment the JWT is stored.
 */

import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '../../components/brand-logo';
import { useAuth } from '../../lib/auth/auth-context';
import { useGoogleAuth } from '../../lib/auth/use-google-auth';
import { ApiError } from '../../lib/api/client';
import { colors } from '../../lib/theme';

export default function Login() {
  const router = useRouter();
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
      router.replace('/(app)');
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
    <SafeAreaView
      edges={['top', 'bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={{ flex: 1 }} className="items-center justify-center px-6">
        <BrandMark size={64} fontSize={36} />
        <Text className="text-muted font-sans-light text-base text-center mt-4">
          Split expenses. Track cash. Zero fees.
        </Text>
      </View>

      <View className="px-6 pb-6 gap-3">
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
