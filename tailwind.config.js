/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Premium dark athletic — strict palette (design v2).
        bg: {
          primary: '#0A0C10', // --bg
          secondary: '#12151C', // --surface
          card: '#12151C', // --surface
          'card-hover': '#1A1E28', // --surface-2 (elevated)
        },
        surface: {
          DEFAULT: '#12151C',
          2: '#1A1E28',
        },
        accent: {
          DEFAULT: '#4ADE80', // electric green — primary actions only
          dark: '#3FBF6E', // press / hover
          dim: '#1A3D2A', // accent backgrounds, badges
        },
        ink: '#0A0C10', // text on accent
        content: {
          primary: '#F0F4F8',
          secondary: '#6B7A8D',
          muted: '#46505E', // faint: placeholders, tertiary
        },
        line: {
          DEFAULT: '#1E2330',
          accent: '#4ADE80',
        },
        danger: '#F87171',
        'danger-dim': '#3A1E22',
        success: '#4ADE80',
        court1: '#4ADE80',
        court2: '#6B7A8D',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Bebas Neue"', 'sans-serif'],
        mono: ['"DM Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '14px',
        input: '12px',
        sm: '10px',
        pill: '999px',
      },
      boxShadow: {
        // Borders, not shadows. The one allowed surface treatment is a 1px
        // inset top highlight. Former glow utilities collapse to this.
        glow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        'glow-lg': 'inset 0 1px 0 rgba(255,255,255,0.04)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        card: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      },
      letterSpacing: {
        label: '0.16em',
        wider2: '0.42em',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-8px)' },
          '40%, 80%': { transform: 'translateX(8px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        spin: { to: { transform: 'rotate(360deg)' } },
        flip: {
          '0%': { transform: 'rotateX(0)' },
          '45%': { transform: 'rotateX(90deg)', opacity: '0.25' },
          '55%': { transform: 'rotateX(-90deg)', opacity: '0.25' },
          '100%': { transform: 'rotateX(0)', opacity: '1' },
        },
      },
      animation: {
        shake: 'shake 0.4s cubic-bezier(0.22,1,0.36,1)',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
        spin: 'spin 0.7s linear infinite',
        flip: 'flip 300ms cubic-bezier(0.22,1,0.36,1)',
      },
    },
  },
  plugins: [],
};
