import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, Text, View } from 'react-native';

import { colors } from '../../../lib/theme';

/** Current month in `YYYY-MM`, matching the server's `parseMonth` default. */
export function currentMonthParam(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/** Shift a `YYYY-MM` param by ±N months. */
export function shiftMonth(param: string, delta: number): string {
  const [yearStr, monthStr] = param.split('-');
  const base = new Date(Number(yearStr), Number(monthStr) - 1 + delta, 1);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}`;
}

/** Prevent forward navigation past the current month. */
export function isCurrentOrLater(param: string): boolean {
  return param >= currentMonthParam();
}

export function DashboardHeader({
  label,
  onPrev,
  onNext,
  nextDisabled,
}: {
  label: string;
  onPrev: () => void;
  onNext: () => void;
  nextDisabled: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <MonthArrow direction="prev" onPress={onPrev} disabled={false} />
      <Text className="text-foreground font-sans-bold text-2xl">{label}</Text>
      <MonthArrow direction="next" onPress={onNext} disabled={nextDisabled} />
    </View>
  );
}

function MonthArrow({
  direction,
  onPress,
  disabled,
}: {
  direction: 'prev' | 'next';
  onPress: () => void;
  disabled: boolean;
}) {
  const iconName = direction === 'prev' ? 'chevron-back' : 'chevron-forward';
  const label = direction === 'prev' ? 'Previous month' : 'Next month';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      hitSlop={12}
      className={`h-10 w-10 items-center justify-center rounded-full border border-border ${
        disabled ? 'opacity-30' : 'active:bg-card'
      }`}
    >
      <Ionicons name={iconName} size={20} color={colors.foreground} />
    </Pressable>
  );
}
