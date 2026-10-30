/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './features/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'rgb(var(--border-rgb) / <alpha-value>)',
        input: 'rgb(var(--input-rgb) / <alpha-value>)',
        ring: 'rgb(var(--ring-rgb) / <alpha-value>)',
        background: 'rgb(var(--background-rgb) / <alpha-value>)',
        foreground: 'rgb(var(--foreground-rgb) / <alpha-value>)',
        navbar: 'rgb(var(--navbar-rgb) / <alpha-value>)',
        'on-brand': 'rgb(var(--on-brand-rgb) / <alpha-value>)',
        'success-on-brand': 'rgb(var(--success-on-brand-rgb) / <alpha-value>)',
        brand: {
          950: 'rgb(var(--brand-950-rgb) / <alpha-value>)',
          900: 'rgb(var(--brand-900-rgb) / <alpha-value>)',
          800: 'rgb(var(--brand-800-rgb) / <alpha-value>)',
          700: 'rgb(var(--brand-700-rgb) / <alpha-value>)',
          600: 'rgb(var(--brand-600-rgb) / <alpha-value>)',
          500: 'rgb(var(--brand-500-rgb) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'rgb(var(--primary-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--primary-foreground-rgb) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--secondary-foreground-rgb) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'rgb(var(--destructive-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--destructive-foreground-rgb) / <alpha-value>)',
        },
        success: {
          DEFAULT: 'rgb(var(--success-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--success-foreground-rgb) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--warning-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--warning-foreground-rgb) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--info-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--info-foreground-rgb) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--danger-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--danger-foreground-rgb) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'rgb(var(--muted-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--muted-foreground-rgb) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'rgb(var(--accent-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--accent-foreground-rgb) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'rgb(var(--popover-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--popover-foreground-rgb) / <alpha-value>)',
        },
        card: {
          DEFAULT: 'rgb(var(--card-rgb) / <alpha-value>)',
          foreground: 'rgb(var(--card-foreground-rgb) / <alpha-value>)',
        },
        violet: 'rgb(var(--violet-rgb) / <alpha-value>)',
        'violet-foreground': 'rgb(var(--violet-foreground-rgb) / <alpha-value>)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        nav: 'var(--shadow-navbar)',
        card: 'var(--shadow-card)',
        logo: 'var(--shadow-logo)',
        'accent-button': 'var(--shadow-accent-button)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
