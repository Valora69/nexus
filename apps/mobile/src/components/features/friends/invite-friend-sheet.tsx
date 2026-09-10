/**
 * "Invite friend by email" bottom sheet. The server-side handler sends
 * the Resend email with a magic link — that link is a web URL today and
 * becomes a universal link in stage 13, so nothing about the mobile
 * client changes when we swap the domain over.
 */

import { useState } from 'react';
import { View } from 'react-native';

import { useSendFriendRequest } from '../../../lib/api/mutations/friendMutations';
import { ModalSheet, PillButton, TextField } from '../../ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteFriendSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const invite = useSendFriendRequest({
    onSuccess: (result) => {
      setConfirmation(
        result.message ?? 'Invite sent. We emailed them a link to connect.',
      );
      setEmail('');
    },
    onError: (err) =>
      setError(err.message || 'Failed to send friend request'),
  });

  const resetAndClose = () => {
    setEmail('');
    setError(null);
    setConfirmation(null);
    onClose();
  };

  const handleClose = () => {
    if (invite.isPending) return;
    resetAndClose();
  };

  const handleSend = () => {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setError('Enter a valid email address');
      return;
    }
    setError(null);
    setConfirmation(null);
    invite.mutate({ data: { email: trimmed } });
  };

  const canSubmit = email.trim().length > 0 && !invite.isPending;

  return (
    <ModalSheet
      visible={visible}
      onClose={handleClose}
      title="Invite a friend"
      subtitle="We'll email them a link to connect. Works even if they don't have an account yet."
      footer={
        <View className="flex-row gap-3">
          <View className="flex-1">
            <PillButton
              label="Close"
              variant="ghost"
              onPress={handleClose}
              disabled={invite.isPending}
            />
          </View>
          <View className="flex-1">
            <PillButton
              label="Send invite"
              variant="primary"
              onPress={handleSend}
              disabled={!canSubmit}
              loading={invite.isPending}
            />
          </View>
        </View>
      }
    >
      <View className="gap-3">
        <TextField
          label="Email"
          placeholder="friend@example.com"
          value={email}
          onChangeText={(next) => {
            setEmail(next);
            if (error) setError(null);
            if (confirmation) setConfirmation(null);
          }}
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect={false}
          keyboardType="email-address"
          inputMode="email"
          returnKeyType="send"
          onSubmitEditing={handleSend}
          error={error}
          helper={confirmation ?? undefined}
        />
      </View>
    </ModalSheet>
  );
}
