/**
 * Mobile theme surface — deliberately tiny.
 *
 * NativeWind handles almost all styling via `className`. The two exports
 * kept here are the ones NativeWind cannot reach:
 *
 * - `colors.background` feeds `Stack.screenOptions.contentStyle`, which
 *   expo-router types as a plain RN `ViewStyle` (no className).
 * - `BRAND_ACCENT_HEX` is passed to `react-native-svg`'s `fill` prop,
 *   which also only accepts a raw color string.
 *
 * Both values come from `@repo/shared/theme/tokens` so web and mobile
 * cannot drift.
 */

import { BRAND_ACCENT_HEX, palettes } from '@repo/shared/theme/tokens';

export { BRAND_ACCENT_HEX };

/** Dark is the app's only palette today. */
export const colors = palettes.dark;
