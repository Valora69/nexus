/**
 * A single row in the activity feed. Formats one `Activity` as a
 * human-readable sentence + relative timestamp, with an icon matching
 * the surface the change happened on.
 */

import Ionicons from '@expo/vector-icons/Ionicons';
import { Text, View } from 'react-native';

import {
  ActivityNameEnum,
  ActivityOnEnum,
  type ActivityWithRelations,
} from '@repo/shared/types/entities';

import { colors } from '../../../lib/theme';
import { GlassCard } from '../../ui';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function iconFor(on: ActivityOnEnum): IoniconName {
  switch (on) {
    case ActivityOnEnum.EXPENSE:
      return 'receipt-outline';
    case ActivityOnEnum.PAYMENT:
      return 'cash-outline';
    case ActivityOnEnum.GROUP_MEMBER:
      return 'person-add-outline';
    case ActivityOnEnum.EXPENSE_PAYEE:
    case ActivityOnEnum.EXPENSE_PAYER:
      return 'swap-horizontal-outline';
    case ActivityOnEnum.GROUP_DETAILS:
    default:
      return 'people-outline';
  }
}

function subjectFor(on: ActivityOnEnum): string {
  switch (on) {
    case ActivityOnEnum.EXPENSE:
      return 'an expense';
    case ActivityOnEnum.PAYMENT:
      return 'a payment';
    case ActivityOnEnum.GROUP_MEMBER:
      return 'group members';
    case ActivityOnEnum.EXPENSE_PAYEE:
      return 'the expense payee';
    case ActivityOnEnum.EXPENSE_PAYER:
      return 'the expense payer';
    case ActivityOnEnum.GROUP_DETAILS:
    default:
      return 'group details';
  }
}

function verbFor(name: ActivityNameEnum): string {
  switch (name) {
    case ActivityNameEnum.CREATED:
      return 'created';
    case ActivityNameEnum.UPDATED:
      return 'updated';
    case ActivityNameEnum.DELETED:
      return 'deleted';
    case ActivityNameEnum.ASSIGNED:
      return 'assigned';
    default:
      return 'changed';
  }
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return 'just now';
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function ActivityRow({
  activity,
}: {
  activity: ActivityWithRelations;
}) {
  const actor = activity.createdBy?.name ?? 'Someone';
  const groupName = activity.group?.name;
  const sentence = `${actor} ${verbFor(activity.activityName)} ${subjectFor(activity.activityOn)}${
    groupName ? ` in ${groupName}` : ''
  }.`;

  return (
    <GlassCard>
      <View className="flex-row items-start gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-card-strong border border-border">
          <Ionicons
            name={iconFor(activity.activityOn)}
            size={16}
            color={colors.foreground}
          />
        </View>
        <View className="flex-1">
          <Text className="text-foreground font-sans text-sm">{sentence}</Text>
          <Text className="text-muted font-sans text-xs mt-1">
            {timeAgo(activity.createdAt)}
          </Text>
        </View>
      </View>
    </GlassCard>
  );
}
