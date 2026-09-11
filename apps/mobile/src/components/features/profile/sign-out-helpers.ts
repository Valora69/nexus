/**
 * Sign-out flow helpers that keep the outbox intent explicit.
 *
 * Two flows collapse into one confirmation:
 *   - No pending outbox rows → straight sign-out.
 *   - N pending rows → three-way prompt: keep queued (resume on next
 *     sign-in of the *same* user), discard and sign out, or cancel.
 *
 * A 401-driven auto-signout (the api client's `emitUnauthorized`) skips
 * this flow entirely — see auth-context's `clearSession` — so a session
 * timeout can't silently discard writes without the user's consent.
 */

import { Alert } from 'react-native';

import { countsForUser, deleteAllForUser } from '../../../lib/offline/outbox';

export { deleteAllForUser } from '../../../lib/offline/outbox';

/**
 * Non-throwing wrapper so a broken outbox DB (extremely unlikely, but
 * we open it on demand) never blocks a user from signing out. Returns
 * zeros on any failure — the prompt just short-circuits to a direct
 * sign-out, which is exactly what a user in that state wants anyway.
 */
export async function countsForUserSafe(userId: string) {
  try {
    return await countsForUser(userId);
  } catch {
    return { pending: 0, syncing: 0, failed: 0, total: 0 };
  }
}

export async function handleSignOutWithOutboxConfirm(
  userId: string,
  signOut: () => Promise<void>,
): Promise<void> {
  const counts = await countsForUserSafe(userId);
  if (counts.total === 0) {
    await signOut();
    return;
  }

  Alert.alert(
    'Unsynced writes',
    `You have ${counts.total} write${counts.total === 1 ? '' : 's'} that haven't reached the server yet.`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Keep and sign out',
        // Rows stay in SQLite tagged with this userId; the replay engine
        // resumes them on the same account's next sign-in.
        onPress: () => {
          void signOut();
        },
      },
      {
        text: 'Discard and sign out',
        style: 'destructive',
        onPress: async () => {
          await deleteAllForUser(userId);
          await signOut();
        },
      },
    ],
  );
}
