import { Caveat, Plus_Jakarta_Sans } from 'next/font/google';

// Landing-only faces. The variables are applied on the landing root div, so
// the rest of the app keeps Inter.
export const displayFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

export const handFont = Caveat({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--font-hand',
  display: 'swap',
});

export const landingFontVariables = `${displayFont.variable} ${handFont.variable}`;
