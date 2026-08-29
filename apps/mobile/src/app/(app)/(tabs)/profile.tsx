/**
 * Profile tab is Stage 5's proof that the whole data pipeline works:
 * useCurrentUser (query) → getCurrentUser (service) → apiFetch (Bearer
 * from auth context) → /api/user/currentuser. The rest of the app in
 * stages 6+ just repeats this pattern per domain.
 */

import { Text, View } from 'react-native';

import { Avatar, ErrorState, LoadingState, PillButton, Screen } from '../../../components/ui';
import { useCurrentUser } from '../../../lib/api/queries/userQueries';
import { useAuth } from '../../../lib/auth/auth-context';

export default function ProfileScreen() {
  const { signOut } = useAuth();
  const { data: user, isPending, error, refetch } = useCurrentUser();

  if (isPending) return <Screen><LoadingState /></Screen>;
  if (error) {
    return (
      <Screen>
        <ErrorState error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="px-6 pt-6">
        <Text className="text-foreground font-sans-bold text-3xl">Profile</Text>
      </View>

      <View className="flex-1 items-center justify-center gap-4 px-6">
        <Avatar uri={user?.picture ?? null} name={user?.name ?? null} size={64} />
        <View className="items-center gap-1">
          <Text className="text-foreground font-sans-semibold text-xl">
            {user?.name}
          </Text>
          <Text className="text-muted font-sans text-sm">{user?.email}</Text>
        </View>
        <View className="mt-4">
          <PillButton
            label="Sign out"
            variant="ghost"
            onPress={() => {
              void signOut();
            }}
          />
        </View>
      </View>
    </Screen>
  );
}
