import { Redirect } from 'expo-router';

import { useAuth } from '../lib/auth/auth-context';

/**
 * Root route splits traffic based on auth status. Kept intentionally
 * dumb — the guarded and public layouts own their own screens.
 */
export default function Index() {
  const { status } = useAuth();
  if (status === 'loading') return null;
  return <Redirect href={status === 'signedIn' ? '/(app)' : '/(auth)/login'} />;
}
