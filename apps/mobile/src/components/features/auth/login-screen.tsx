/**
 * Login screen (feature component).
 *
 * Sign-in pipeline is split so no state can get stuck:
 *   1. Tap → `promptAsync()` opens the Google account chooser.
 *   2. `useGoogleAuth` publishes `idToken` when Google returns success —
 *      this happens via the hook's `response` effect, NOT the promise
 *      returned by `promptAsync` (iOS often resolves that as `dismiss`
 *      even on real success; that was the root cause of the dead login).
 *   3. An effect here consumes `idToken`, exchanges it for our JWT, and
 *      only then navigates. `submitting` is true across the whole
 *      pipeline (prompt → exchange), never just one leg of it.
 *
 * Navigation: we call `router.replace('/(app)')` explicitly after
 * `signIn` resolves instead of relying on the `(auth)` layout's
 * `<Redirect />`. The declarative redirect is racy on the same-tick
 * state flip a successful sign-in produces.
 *
 * Layout notes: the outer container uses inline styles deliberately —
 * NativeWind `cssInterop` isn't wired for `SafeAreaView` in every build
 * variant, and a broken `flex-1` there collapses both children to the
 * top. Don't "clean up" those inline styles without re-testing.
 */

import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '../../brand-logo';
import { useAuth } from '../../../lib/auth/auth-context';
import { useGoogleAuth } from '../../../lib/auth/use-google-auth';
import { ApiError } from '../../../lib/api/client';
import { colors } from '../../../lib/theme';

export function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const { promptAsync, ready, configError, idToken, authError, reset } =
    useGoogleAuth();
  const [submitting, setSubmitting] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);

  const disabled = submitting || !ready;

  // Consume the id token produced by the hook's response effect. Kept
  // separate from `onPress` so the exchange runs no matter how the token
  // arrived (fast return, slow return, cold-boot resume of a pending
  // response). `reset()` clears the hook state after each attempt.
  useEffect(() => {
    if (!idToken) return;
    let cancelled = false;
    (async () => {
      try {
        await signIn(idToken);
        if (cancelled) return;
        router.replace('/(app)');
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Sign-in failed. Please try again.';
        setExchangeError(message);
        setSubmitting(false);
      } finally {
        reset();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idToken, signIn, router, reset]);

  // Any error surfaced by the hook (cancelled config, native failure)
  // ends the submitting state so the button re-arms.
  useEffect(() => {
    if (authError) setSubmitting(false);
  }, [authError]);

  const onPress = async () => {
    if (disabled) return;
    setExchangeError(null);
    setSubmitting(true);
    try {
      await promptAsync();
      // If the sheet was cancelled/dismissed, no `idToken` and no
      // `authError` will fire. Give iOS one tick to publish `response`,
      // then release the spinner if nothing landed.
      setTimeout(() => setSubmitting((s) => (idToken || authError ? s : false)), 250);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Sign-in failed. Please try again.';
      setExchangeError(message);
      setSubmitting(false);
    }
  };

  const errorText = exchangeError ?? authError;

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
        {errorText ? (
          <Text className="text-loss font-sans text-sm text-center">
            {errorText}
          </Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
