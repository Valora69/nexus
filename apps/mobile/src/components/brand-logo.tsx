import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { fontFamilies } from '../lib/theme/fonts';
import { BRAND_ACCENT_HEX, colors } from '../lib/theme';

/**
 * Vector recreation of `apps/web/app/icon.svg` — a brand-green rounded
 * square with a dark diagonal arrow. Sized in points, scales cleanly on
 * any DPI.
 */
export function BrandLogo({ size = 28 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Rect width={32} height={32} rx={7} fill={BRAND_ACCENT_HEX} />
      <Path
        d="M11 11h10v10"
        stroke="#0a0a0a"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M11 21 21 11"
        stroke="#0a0a0a"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/**
 * Logo + "MoneyApp" wordmark with the second word in brand green —
 * mirror of `BrandMark` in `apps/web/components/ui/brand-logo.tsx`.
 */
export function BrandMark({
  size = 28,
  fontSize = 20,
}: {
  size?: number;
  fontSize?: number;
}) {
  return (
    <View style={styles.row}>
      <BrandLogo size={size} />
      <Text style={[styles.text, { fontSize }]}>
        Money<Text style={styles.accent}>App</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  text: {
    color: colors.foreground,
    fontFamily: fontFamilies.sans.bold,
    letterSpacing: -0.4,
  },
  accent: {
    color: colors.accent,
  },
});
