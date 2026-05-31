/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--color-background) / <alpha-value>)',
        foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        muted: {
          DEFAULT: 'rgb(var(--color-muted) / <alpha-value>)',
          foreground: 'rgb(var(--color-muted) / <alpha-value>)',
        },
        gain: 'rgb(var(--color-gain) / <alpha-value>)',
        loss: 'rgb(var(--color-loss) / <alpha-value>)',
        card: {
          DEFAULT: 'var(--color-card)',
          hover: 'var(--color-card-hover)',
          strong: 'var(--color-card-strong)',
          foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          strong: 'var(--color-border-strong)',
        },
        input: 'var(--color-border)',
        ring: 'rgb(var(--color-accent) / <alpha-value>)',
        overlay: 'var(--color-overlay)',
        scrim: 'var(--color-scrim)',
        popover: {
          DEFAULT: 'var(--color-overlay)',
          foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          2: 'rgb(var(--color-accent2) / <alpha-value>)',
          foreground: 'rgb(var(--color-background) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--color-accent) / <alpha-value>)',
          foreground: 'rgb(var(--color-background) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'var(--color-card)',
          foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--color-loss) / <alpha-value>)',
          foreground: 'rgb(255 255 255 / <alpha-value>)',
        },
        sidebar: {
          DEFAULT: 'var(--color-card)',
          foreground: 'rgb(var(--color-foreground) / <alpha-value>)',
          primary: 'rgb(var(--color-accent) / <alpha-value>)',
          'primary-foreground': 'rgb(var(--color-background) / <alpha-value>)',
          accent: 'var(--color-card-hover)',
          'accent-foreground': 'rgb(var(--color-foreground) / <alpha-value>)',
          border: 'var(--color-border)',
          ring: 'rgb(var(--color-accent) / <alpha-value>)',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'monospace'],
      },
      boxShadow: {
        glass:
          '0 10px 30px -12px rgb(0 0 0 / 0.45), 0 4px 12px -6px rgb(0 0 0 / 0.28)',
        lift:
          '0 26px 60px -20px rgb(0 0 0 / 0.5), 0 8px 20px -8px rgb(0 0 0 / 0.32)',
        neu:
          'inset 0 1px 0 0 rgb(255 255 255 / 0.18), 0 12px 30px -14px rgb(0 0 0 / 0.45)',
        'neu-inset':
          'inset 0 2px 5px 0 rgb(0 0 0 / 0.18), inset 0 -1px 0 0 rgb(255 255 255 / 0.06)',
        glow:
          '0 0 0 1px rgb(0 255 106 / 0.2), 0 10px 34px -8px rgb(0 255 106 / 0.4)',
        'glow-cyan':
          '0 0 0 1px rgb(52 211 153 / 0.2), 0 10px 34px -8px rgb(52 211 153 / 0.4)',
      },
      backdropBlur: { xs: '2px' },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.4s ease-out both',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
