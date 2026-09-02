import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import type { GroupWithRelations } from '@repo/shared/types/entities';

import { Amount, GlassCard, PillButton, TextField } from '../../ui';
import { BRAND_ACCENT_HEX } from '../../../lib/theme';
import type { SplitMode } from '../../../lib/expenses/split-form';

type Member = NonNullable<GroupWithRelations['members']>[number];

export function SplitEditor({
  members,
  currentUserId,
  selectedIds,
  onToggleMember,
  splitMode,
  onSplitModeChange,
  customSplits,
  onCustomSplitsChange,
  amount,
  totalAmount,
}: {
  members: Member[];
  currentUserId: string;
  selectedIds: string[];
  onToggleMember: (userId: string) => void;
  splitMode: SplitMode;
  onSplitModeChange: (mode: SplitMode) => void;
  customSplits: Record<string, string>;
  onCustomSplitsChange: (
    updater: (prev: Record<string, string>) => Record<string, string>,
  ) => void;
  amount: string;
  totalAmount: number;
}) {
  const equalShare = selectedIds.length ? totalAmount / selectedIds.length : 0;

  const activeCustomIds = useMemo(() => {
    if (splitMode !== 'custom') return selectedIds;
    return selectedIds.filter((id) => {
      const v = parseFloat(customSplits[id] || '0');
      return Number.isFinite(v) && v > 0;
    });
  }, [selectedIds, splitMode, customSplits]);

  const customTotal = useMemo(
    () =>
      activeCustomIds.reduce(
        (sum, id) => sum + (parseFloat(customSplits[id] || '0') || 0),
        0,
      ),
    [activeCustomIds, customSplits],
  );

  const excludedFromCustom = selectedIds.length - activeCustomIds.length;
  const customValid =
    splitMode !== 'custom' ||
    (activeCustomIds.length > 0 &&
      Math.abs(customTotal - totalAmount) <= 0.01);

  return (
    <>
      <GlassCard>
        <View className="flex-row items-center gap-2 mb-3">
          <Ionicons name="people-outline" size={18} color={BRAND_ACCENT_HEX} />
          <Text className="text-foreground font-sans-semibold text-base">
            Split with
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {members.map((m) => {
            const active = selectedIds.includes(m.userId);
            const label = m.user?.name ?? 'Unknown';
            return (
              <Pressable
                key={m.userId}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => onToggleMember(m.userId)}
                className={`px-3 py-1.5 rounded-full border ${
                  active
                    ? 'bg-accent border-accent'
                    : 'bg-card border-border-strong'
                }`}
              >
                <Text
                  className={`text-xs font-sans-medium ${
                    active ? 'text-accent-foreground' : 'text-foreground'
                  }`}
                >
                  {label}
                  {m.userId === currentUserId ? ' (You)' : ''}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </GlassCard>

      <GlassCard>
        <Text className="text-foreground font-sans-semibold text-base mb-3">
          Split type
        </Text>
        <View className="flex-row gap-2">
          <View className="flex-1">
            <PillButton
              label="Equal"
              variant={splitMode === 'equal' ? 'primary' : 'ghost'}
              onPress={() => onSplitModeChange('equal')}
            />
          </View>
          <View className="flex-1">
            <PillButton
              label="Custom"
              variant={splitMode === 'custom' ? 'primary' : 'ghost'}
              onPress={() => onSplitModeChange('custom')}
            />
          </View>
        </View>

        {selectedIds.length > 0 && amount ? (
          <View className="mt-4 gap-2">
            {selectedIds.map((userId) => {
              const member = members.find((m) => m.userId === userId);
              const isMe = userId === currentUserId;
              const custom = parseFloat(customSplits[userId] || '0');
              const isZeroCustom =
                splitMode === 'custom' &&
                (!Number.isFinite(custom) || custom <= 0);
              return (
                <View
                  key={userId}
                  className={`flex-row items-center justify-between gap-3 p-3 rounded-xl bg-card ${
                    isZeroCustom ? 'opacity-60' : ''
                  }`}
                >
                  <Text
                    className={`flex-1 font-sans text-sm ${
                      isMe ? 'text-accent font-sans-semibold' : 'text-foreground'
                    }`}
                    numberOfLines={1}
                  >
                    {member?.user?.name ?? 'Unknown'}
                    {isMe ? ' (Paid)' : ''}
                    {isZeroCustom ? ' — excluded' : ''}
                  </Text>
                  {splitMode === 'equal' ? (
                    <Amount value={equalShare} size="sm" tone="neutral" />
                  ) : (
                    <TextField
                      placeholder="0.00"
                      value={customSplits[userId] ?? ''}
                      keyboardType="decimal-pad"
                      onChangeText={(v) =>
                        onCustomSplitsChange((prev) => ({ ...prev, [userId]: v }))
                      }
                      containerClassName="w-28"
                    />
                  )}
                </View>
              );
            })}
            {splitMode === 'custom' ? (
              <View className="gap-1">
                <Text
                  className={`text-xs font-sans ${
                    customValid ? 'text-muted' : 'text-loss font-sans-semibold'
                  }`}
                >
                  Assigned ₱{customTotal.toFixed(2)} of ₱{totalAmount.toFixed(2)}
                  {customValid ? '' : ' — must match'}
                </Text>
                {excludedFromCustom > 0 ? (
                  <Text className="text-xs text-muted font-sans">
                    {excludedFromCustom} member
                    {excludedFromCustom > 1 ? 's' : ''} excluded
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </GlassCard>
    </>
  );
}

export function isCustomSplitValid({
  splitMode,
  selectedIds,
  customSplits,
  totalAmount,
}: {
  splitMode: SplitMode;
  selectedIds: string[];
  customSplits: Record<string, string>;
  totalAmount: number;
}): boolean {
  if (splitMode !== 'custom') return true;
  const active = selectedIds.filter((id) => {
    const v = parseFloat(customSplits[id] || '0');
    return Number.isFinite(v) && v > 0;
  });
  const total = active.reduce(
    (sum, id) => sum + (parseFloat(customSplits[id] || '0') || 0),
    0,
  );
  return active.length > 0 && Math.abs(total - totalAmount) <= 0.01;
}
