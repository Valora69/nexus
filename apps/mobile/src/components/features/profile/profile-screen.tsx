/**
 * Profile tab — identity, GCash number, and account controls.
 *
 * Uses `useCurrentUser` for the fresh authoritative record (the cached
 * JWT-decoded `useAuth().user` doesn't carry `gcashNumber`, and stale
 * name/picture edits on another surface should show up here on next
 * refetch). Sign-out and Delete Account both hand control back to the
 * auth context so the `(app)` layout redirects to `/(auth)/login`.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import { Alert, ScrollView, Text, View } from 'react-native';

import {
  Avatar,
  ErrorState,
  GlassCard,
  LoadingState,
  PillButton,
  Screen,
} from '../../ui';
import { useCurrentUser } from '../../../lib/api/queries/userQueries';
import { useAuth } from '../../../lib/auth/auth-context';
import { handleSignOutWithOutboxConfirm } from './sign-out-helpers';
import { colors } from '../../../lib/theme';
import { DeleteAccountButton } from './delete-account-button';
import { GcashEditor } from './gcash-editor';

const APP_VERSION = Constants.expoConfig?.version ?? '—';

export function ProfileScreen() {
  const { signOut } = useAuth();
  const { data: user, isPending, error, refetch } = useCurrentUser();

  if (isPending) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <LoadingState />
      </Screen>
    );
  }
  if (error || !user) {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <ErrorState error={error} onRetry={() => void refetch()} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: 32,
          gap: 24,
        }}
      >
        <View>
          <Text className="text-foreground font-sans-bold text-3xl">
            Profile
          </Text>
        </View>

        <GlassCard>
          <View className="flex-row items-center gap-4">
            <Avatar uri={user.picture ?? null} name={user.name} size={64} />
            <View className="flex-1 gap-1">
              <Text
                className="text-foreground font-sans-semibold text-lg"
                numberOfLines={1}
              >
                {user.name}
              </Text>
              <Text
                className="text-muted font-sans text-sm"
                numberOfLines={1}
              >
                {user.email}
              </Text>
            </View>
          </View>
        </GlassCard>

        <View className="gap-3">
          <Text className="text-muted font-sans-medium text-xs uppercase tracking-wider">
            Payment details
          </Text>
          <GcashEditor user={user} />
        </View>

        <View className="gap-3">
          <Text className="text-muted font-sans-medium text-xs uppercase tracking-wider">
            Account
          </Text>
          <PillButton
            label="Sign out"
            variant="secondary"
            onPress={() => {
              void handleSignOutWithOutboxConfirm(user.id, signOut);
            }}
          />
          <DeleteAccountButton user={user} />
        </View>

        <View className="gap-3">
          <Text className="text-muted font-sans-medium text-xs uppercase tracking-wider">
            About
          </Text>
          <GlassCard>
            <View className="flex-row items-center gap-3">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-card-strong border border-border">
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={colors.foreground}
                />
              </View>
              <View className="flex-1">
                <Text className="text-muted font-sans-medium text-xs uppercase tracking-wider">
                  App version
                </Text>
                <Text className="text-foreground font-sans-medium text-sm mt-0.5">
                  {APP_VERSION}
                </Text>
              </View>
            </View>
          </GlassCard>
        </View>
      </ScrollView>
    </Screen>
  );
}
