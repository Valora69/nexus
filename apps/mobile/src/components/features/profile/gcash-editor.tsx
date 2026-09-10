/**
 * GCash number editor. Read-only "display" mode until the pencil is
 * tapped; the sheet is the mutation surface so a user can't accidentally
 * blank the field with a fat-finger tap on the input.
 *
 * We normalize the local Filipino format (spaces, dashes, leading 0)
 * before submitting so the server sees a consistent shape.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { User } from '@repo/shared/types/entities';

import { useUpdateUser } from '../../../lib/api/mutations/userMutations';
import { colors } from '../../../lib/theme';
import { GlassCard, ModalSheet, PillButton, TextField } from '../../ui';

function normalizeGcash(raw: string): string {
  // Strip everything but digits; the server stores the canonical 11-digit
  // "09XXXXXXXXX" form so we keep the leading zero and drop separators.
  return raw.replace(/\D+/g, '');
}

function displayGcash(value?: string | null): string {
  if (!value) return 'Not set';
  // 0917 123 4567 — a common local presentation.
  if (value.length === 11) {
    return `${value.slice(0, 4)} ${value.slice(4, 7)} ${value.slice(7)}`;
  }
  return value;
}

export function GcashEditor({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(user.gcashNumber ?? '');
  const [error, setError] = useState<string | null>(null);

  const update = useUpdateUser({
    onSuccess: () => {
      setOpen(false);
    },
    onError: (err) => setError(err.message || 'Failed to update GCash number'),
  });

  const handleOpen = () => {
    setDraft(user.gcashNumber ?? '');
    setError(null);
    setOpen(true);
  };

  const handleClose = () => {
    if (update.isPending) return;
    setOpen(false);
    setError(null);
  };

  const handleSave = () => {
    const normalized = normalizeGcash(draft);
    if (normalized.length === 0) {
      // Explicit clear — send empty string so the server can null it out.
      setError(null);
      update.mutate({
        id: user.id,
        userData: { gcashNumber: '' },
      });
      return;
    }
    if (normalized.length !== 11 || !normalized.startsWith('09')) {
      setError('Enter an 11-digit number starting with 09');
      return;
    }
    setError(null);
    update.mutate({
      id: user.id,
      userData: { gcashNumber: normalized },
    });
  };

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit GCash number"
        onPress={handleOpen}
      >
        <GlassCard>
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-card-strong border border-border">
              <Ionicons name="phone-portrait-outline" size={16} color={colors.foreground} />
            </View>
            <View className="flex-1">
              <Text className="text-muted font-sans-medium text-xs uppercase tracking-wider">
                GCash number
              </Text>
              <Text
                className="text-foreground font-sans-medium text-sm mt-0.5"
                numberOfLines={1}
              >
                {displayGcash(user.gcashNumber)}
              </Text>
            </View>
            <Ionicons name="pencil-outline" size={18} color={colors.muted} />
          </View>
        </GlassCard>
      </Pressable>

      <ModalSheet
        visible={open}
        onClose={handleClose}
        title="GCash number"
        subtitle="Shown to people paying you back so they can transfer via GCash."
        footer={
          <View className="flex-row gap-3">
            <View className="flex-1">
              <PillButton
                label="Cancel"
                variant="ghost"
                onPress={handleClose}
                disabled={update.isPending}
              />
            </View>
            <View className="flex-1">
              <PillButton
                label="Save"
                variant="primary"
                onPress={handleSave}
                loading={update.isPending}
                disabled={update.isPending}
              />
            </View>
          </View>
        }
      >
        <TextField
          label="Number"
          placeholder="09171234567"
          value={draft}
          onChangeText={(next) => {
            setDraft(next);
            if (error) setError(null);
          }}
          keyboardType="phone-pad"
          inputMode="tel"
          autoComplete="tel"
          maxLength={16}
          error={error}
          helper="Leave empty to remove."
        />
      </ModalSheet>
    </>
  );
}
