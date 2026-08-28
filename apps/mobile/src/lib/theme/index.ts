/**
 * Mobile theme surface. Colors, radii, and weights come straight from
 * `@repo/shared` so web and mobile can never drift. Font *loading* lives
 * here because it is platform-specific (Expo Google Fonts).
 */

import {
  BRAND_ACCENT_HEX,
  fonts,
  fontWeights,
  palettes,
  radii,
} from '@repo/shared/theme/tokens';

export { BRAND_ACCENT_HEX, fonts, fontWeights, palettes, radii };

/** Dark is the app's default; light is exposed for parity but unused today. */
export const colors = palettes.dark;

/** Point-based spacing scale — mirrors Tailwind defaults on web. */
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
} as const;
