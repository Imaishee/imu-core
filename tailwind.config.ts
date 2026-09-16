import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#F5F0EB',
          200: '#EDE5DB',
          300: '#DDD0C1',
        },
        warm: {
          bg: '#F5F0EB',
          card: '#FFFFFF',
          border: '#E8DFD5',
        },
        violet: {
          primary: '#7C3AED',
          light: '#A78BFA',
          dark: '#5B21B6',
          glow: '#EDE9FE',
        },
        coral: {
          primary: '#F97316',
          light: '#FDBA74',
        },
        mint: {
          primary: '#10B981',
          light: '#A7F3D0',
        },
        rose: {
          primary: '#F43F5E',
          light: '#FECDD3',
        },
        amber: {
          primary: '#F59E0B',
          light: '#FDE68A',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'card': '0 2px 12px rgba(124, 58, 237, 0.06)',
        'card-hover': '0 4px 20px rgba(124, 58, 237, 0.12)',
        'glow': '0 0 20px rgba(124, 58, 237, 0.15)',
        'bottom-nav': '0 -4px 20px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'confetti': 'confetti 1s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(-100px) rotate(720deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
