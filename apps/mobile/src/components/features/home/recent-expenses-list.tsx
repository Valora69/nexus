import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

import { formatDate } from '@repo/shared/utils/formatters';
import type { FeedItem } from '@repo/shared/types/entities';

import { Amount, GlassCard } from '../../ui';
import { colors } from '../../../lib/theme';
import { EmptyRow, SectionHeader } from './parts';

export function RecentExpensesList({ feed }: { feed: FeedItem[] }) {
  return (
    <GlassCard>
      <SectionHeader title="Recent activity" count={feed.length} />
      {feed.length === 0 ? (
        <EmptyRow message="No activity this month" />
      ) : (
        <View className="gap-3">
          {feed.map((item, i) => (
            <FeedRow key={item.id} item={item} isLast={i === feed.length - 1} />
          ))}
        </View>
      )}
    </GlassCard>
  );
}

function FeedRow({ item, isLast }: { item: FeedItem; isLast: boolean }) {
  const iconName = item.isCredit ? 'arrow-up-outline' : 'arrow-down-outline';
  const iconColor = item.isCredit ? colors.gain : colors.loss;
  const signedAmount = item.isCredit ? item.amount : -item.amount;
  return (
    <View
      className={`flex-row items-center gap-3 ${isLast ? '' : 'border-b border-border pb-3'}`}
    >
      <View className="h-8 w-8 items-center justify-center rounded-full bg-card border border-border">
        <Ionicons name={iconName} size={16} color={iconColor} />
      </View>
      <View className="flex-1 pr-3">
        <Text className="text-foreground font-sans-medium text-sm" numberOfLines={1}>
          {item.label}
        </Text>
        <Text className="text-muted font-sans text-xs mt-0.5" numberOfLines={1}>
          {item.sublabel ? `${item.sublabel} · ` : ''}
          {formatDate(item.date)}
        </Text>
      </View>
      <Amount value={signedAmount} size="md" tone="auto" signed />
    </View>
  );
}
