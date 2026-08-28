/**
 * Design tokens for MoneyApp — the single source of truth consumed by
 * both the web app (Tailwind CSS variables in `apps/web/app/globals.css`)
 * and the mobile app (plain `StyleSheet` values in `apps/mobile/lib/theme`).
 *
 * These are transcribed from `apps/web/app/globals.css`. If you change a
 * value here, mirror it into globals.css (and vice versa).
 *
 * Colors are stored as CSS-compatible `rgb()` strings so they drop into
 * both Tailwind and React Native `StyleSheet` without adapters.
 */

export type ThemeName = 'light' | 'dark';

export type Palette = {
  background: string;
  foreground: string;
  muted: string;
  gain: string;
  loss: string;
  accent: string;
  accent2: string;
  card: string;
  cardHover: string;
  cardStrong: string;
  border: string;
  borderStrong: string;
  overlay: string;
  scrim: string;
};

/** Brand neon green — matches the favicon (#00ff41) exactly. */
export const BRAND_ACCENT_HEX = '#00ff41';

export const palettes: Record<ThemeName, Palette> = {
  light: {
    background: 'rgb(246, 248, 252)',
    foreground: 'rgb(15, 23, 42)',
    muted: 'rgb(100, 116, 139)',
    gain: 'rgb(0, 200, 51)',
    loss: 'rgb(220, 38, 38)',
    accent: 'rgb(0, 255, 65)',
    accent2: 'rgb(0, 255, 65)',
    card: 'rgba(255, 255, 255, 0.6)',
    cardHover: 'rgba(255, 255, 255, 0.85)',
    cardStrong: 'rgba(255, 255, 255, 0.78)',
    border: 'rgba(15, 23, 42, 0.08)',
    borderStrong: 'rgba(15, 23, 42, 0.16)',
    overlay: 'rgba(255, 255, 255, 0.94)',
    scrim: 'rgba(15, 23, 42, 0.32)',
  },
  dark: {
    background: 'rgb(0, 0, 0)',
    foreground: 'rgb(232, 237, 244)',
    muted: 'rgb(142, 151, 169)',
    gain: 'rgb(0, 255, 65)',
    loss: 'rgb(248, 113, 113)',
    accent: 'rgb(0, 255, 65)',
    accent2: 'rgb(0, 255, 65)',
    card: 'rgba(255, 255, 255, 0.05)',
    cardHover: 'rgba(255, 255, 255, 0.10)',
    cardStrong: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.09)',
    borderStrong: 'rgba(255, 255, 255, 0.18)',
    overlay: 'rgba(13, 17, 28, 0.92)',
    scrim: 'rgba(0, 0, 0, 0.7)',
  },
};

/**
 * Radii — in `rem` on web (via Tailwind `borderRadius` extension) and in
 * pixels on mobile (1rem = 16px baseline). Exposed as pixel values here
 * so mobile can use them directly; web keeps consuming the Tailwind names.
 */
export const radii = {
  sm: 6, // 0.375rem
  md: 8, // 0.5rem
  lg: 12, // 0.75rem
  xl: 16, // 1rem
  '2xl': 20, // 1.25rem
  '3xl': 24, // 1.5rem
  '4xl': 32, // 2rem
  '5xl': 40, // 2.5rem
  full: 9999,
} as const;

/**
 * Font family names. Web loads Inter + JetBrains Mono via `next/font`;
 * mobile loads them via `@expo-google-fonts/inter` +
 * `@expo-google-fonts/jetbrains-mono`. Same names → shared references
 * in components.
 */
export const fonts = {
  sans: 'Inter',
  mono: 'JetBrains Mono',
} as const;

/**
 * Font weights actually used by the app (subset of what Google Fonts ships).
 * Body copy is `light` (300); headings are `regular` (400).
 */
export const fontWeights = {
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;
