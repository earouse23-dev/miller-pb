/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#080D14',
          secondary: '#0F1923',
          card: '#141F2E',
          'card-hover': '#1A2840',
        },
        accent: {
          DEFAULT: '#C8F060',
          dark: '#9BBF3A',
        },
        content: {
          primary: '#FFFFFF',
          secondary: '#8A9BB0',
          muted: '#4A5A6A',
        },
        line: {
          DEFAULT: '#1E2D40',
          accent: '#C8F060',
        },
        danger: '#FF5757',
        success: '#4ADE80',
        court1: '#C8F060',
        court2: '#5BA3F0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        input: '8px',
        pill: '24px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(200,240,96,0.15)',
        'glow-lg': '0 0 32px rgba(200,240,96,0.25)',
        card: '0 4px 24px rgba(0,0,0,0.4)',
      },
      letterSpacing: {
        label: '0.12em',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-8px)' },
          '40%, 80%': { transform: 'translateX(8px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
        'pulse-soft': 'pulse-soft 1.8s ease-in-out infinite',
        spin: 'spin 0.8s linear infinite',
      },
    },
  },
  plugins: [],
};
