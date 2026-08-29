import { Redirect, Stack } from 'expo-router';

import { useAuth } from '../../lib/auth/auth-context';
import { colors } from '../../lib/theme';

/**
 * Public auth group. Signed-in users bounce straight to the app so the
 * back button on the login screen can never re-enter it.
 */
export default function AuthLayout() {
  const { status } = useAuth();
  if (status === 'loading') return null;
  if (status === 'signedIn') return <Redirect href="/(app)" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
