/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          bg: '#FBF6EC',
          surface: '#FFFDF8',
          elevated: '#FFFFFF',
          border: '#E9E0CE',
          text: '#EAF4EE',
          muted: '#9DB3A6',
        },
        dark: {
          bg: '#0E1512',
          surface: '#16211C',
          elevated: '#1C2A23',
          border: '#2A3B32',
        },
        green: {
          primary: '#2D6A4F',
          dark: '#1B4332',
          medium: '#40916C',
          light: '#52B788',
          pale: '#95D5B2',
          mint: '#D8F3DC',
        },
        ink: {
          DEFAULT: '#1F2A24',
          muted: '#5C6B62',
        },
      },
      borderRadius: {
        glass: '18px',
      },
      backdropBlur: {
        glass: '18px',
      },
      boxShadow: {
        glass: '0 8px 24px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        'glass-lg': '0 12px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        'green-glow': '0 0 40px rgba(82, 183, 136, 0.15), 0 0 80px rgba(45, 106, 79, 0.08)',
      },
      fontFamily: {
        display: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
