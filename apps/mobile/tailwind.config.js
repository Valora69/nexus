/**
 * Mobile Tailwind config — dark-only palette that mirrors `apps/web`'s
 * dark theme so both surfaces read as the same product. Color values come
 * from `@repo/shared/theme/tokens` (dark palette) inlined as literals so
 * this file stays synchronous (Tailwind's config loader is CJS-only).
 *
 * If you change a color here, update `packages/shared/src/theme/tokens.ts`
 * and `apps/web/app/globals.css` in the same commit.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: 'rgb(0, 0, 0)',
        foreground: 'rgb(232, 237, 244)',
        muted: 'rgb(142, 151, 169)',
        gain: 'rgb(0, 255, 65)',
        loss: 'rgb(248, 113, 113)',
        accent: {
          DEFAULT: 'rgb(0, 255, 65)',
          foreground: 'rgb(0, 0, 0)',
        },
        card: {
          DEFAULT: 'rgba(255, 255, 255, 0.05)',
          hover: 'rgba(255, 255, 255, 0.10)',
          strong: 'rgba(255, 255, 255, 0.08)',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.09)',
          strong: 'rgba(255, 255, 255, 0.18)',
        },
      },
      borderRadius: {
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
        '5xl': '40px',
      },
      fontFamily: {
        sans: ['Inter_400Regular'],
        'sans-light': ['Inter_300Light'],
        'sans-medium': ['Inter_500Medium'],
        'sans-semibold': ['Inter_600SemiBold'],
        'sans-bold': ['Inter_700Bold'],
        mono: ['JetBrainsMono_400Regular'],
        'mono-medium': ['JetBrainsMono_500Medium'],
        'mono-bold': ['JetBrainsMono_700Bold'],
      },
    },
  },
  plugins: [],
};
