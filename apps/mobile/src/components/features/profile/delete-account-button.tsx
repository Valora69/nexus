/**
 * Delete-account button. Required by App Store Guideline 5.1.1(v) — an
 * in-app path to permanently delete the account, not just sign out. The
 * server cascades the User row's dependents (groups/expenses/payments/
 * friendships), so all we need on the client is a hard confirmation, the
 * DELETE call, and a local sign-out.
 *
 * The confirmation prompt is intentionally two-tap (Alert → destructive
 * button) so a stray tap never fires the DELETE.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Pressable, Text, View } from 'react-native';

import type { User } from '@repo/shared/types/entities';

import { useRemoveUser } from '../../../lib/api/mutations/userMutations';
import { useAuth } from '../../../lib/auth/auth-context';
import { deleteAllForUser } from '../../../lib/offline/outbox';
import { colors } from '../../../lib/theme';
import { GlassCard } from '../../ui';

export function DeleteAccountButton({ user }: { user: User }) {
  const { signOut } = useAuth();

  const remove = useRemoveUser({
    onSuccess: () => {
      // Purge queued offline writes for this user — the account row is
      // gone server-side, so any replay would just 404. Fire-and-forget:
      // signing out first would leave orphaned SQLite rows if the delete
      // failed, so we chain them explicitly.
      void deleteAllForUser(user.id).finally(() => {
        // Local sign-out clears the token + resets the query cache. The
        // authenticated-only layout redirects to /(auth)/login next render.
        void signOut();
      });
    },
    onError: (err) => {
      Alert.alert(
        'Could not delete account',
        err.message || 'Please try again in a moment.',
      );
    },
  });

  const confirm = () => {
    Alert.alert(
      'Delete account?',
      "This permanently removes your account, groups you created, expenses, and payment history. This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => remove.mutate({ id: user.id }),
        },
      ],
    );
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Delete account"
      onPress={confirm}
      disabled={remove.isPending}
    >
      <GlassCard>
        <View className="flex-row items-center gap-3">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-card-strong border border-loss/40">
            <Ionicons name="trash-outline" size={16} color={colors.loss} />
          </View>
          <View className="flex-1">
            <Text className="text-loss font-sans-semibold text-sm">
              Delete account
            </Text>
            <Text className="text-muted font-sans text-xs mt-0.5">
              Permanently removes your account and all data.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.muted} />
        </View>
      </GlassCard>
    </Pressable>
  );
}
