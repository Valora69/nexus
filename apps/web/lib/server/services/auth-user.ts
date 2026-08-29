import { prisma } from '@/lib/server/db';

export interface FindOrCreateOAuthUserInput {
  /**
   * OAuth provider. Google-only today; Apple is added in stage 16.
   * Signature is provider-generic so callers don't need to change later.
   */
  provider: 'google';
  /** Stable provider-side user ID (e.g. Google's `sub`). */
  providerId: string;
  /** Email as returned by the provider — case is normalized inside. */
  email: string;
  name: string;
  picture?: string;
}

/**
 * Find-or-create the local `User` for an OAuth sign-in, then claim any
 * pending friend requests addressed to their email.
 *
 * Matching order (must stay identical to the web callback's original logic):
 *   1. Match by `googleId`.
 *   2. Fallback: match by lowercased email; if found, backfill `googleId`
 *      + profile fields on the existing row.
 *   3. Otherwise: create a fresh user.
 */
export async function findOrCreateOAuthUser(input: FindOrCreateOAuthUserInput) {
  const email = input.email.toLowerCase();
  const { providerId: googleId, name, picture } = input;

  let user = await prisma.user.findUnique({
    where: { googleId },
  });

  if (!user) {
    user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      user = await prisma.user.update({
        where: { email },
        data: {
          googleId,
          picture: picture || user.picture,
          name: user.name || name,
        },
      });
    } else {
      user = await prisma.user.create({
        data: { email, name, googleId, picture },
      });
    }
  }

  await prisma.friendRequest.updateMany({
    where: {
      recipientEmail: email,
      recipientId: null,
      status: 'PENDING',
    },
    data: { recipientId: user.id },
  });

  return user;
}
