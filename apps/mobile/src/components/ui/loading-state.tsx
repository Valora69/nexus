/**
 * Centered spinner block. Small enough to swap in wherever a query is
 * pending — usually the top-level query on a screen.
 */

import { ActivityIndicator, View } from 'react-native';

import { BRAND_ACCENT_HEX } from '../../lib/theme';

type Props = {
  size?: 'small' | 'large';
};

export function LoadingState({ size = 'large' }: Props) {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size={size} color={BRAND_ACCENT_HEX} />
    </View>
  );
}
