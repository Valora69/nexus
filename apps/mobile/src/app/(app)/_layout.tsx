import { Redirect, Stack } from 'expo-router';

import { useAuth } from '../../lib/auth/auth-context';
import { colors } from '../../lib/theme';

/**
 * Authenticated-only group. Any 401 in `apiFetch` clears the session and
 * flips `status` back to `signedOut`; this guard then bounces the user to
 * the login screen on the next render.
 */
export default function AppLayout() {
  const { status } = useAuth();
  if (status === 'loading') return null;
  if (status === 'signedOut') return <Redirect href="/(auth)/login" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
