/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        imu: {
          dark: '#09090B',
          card: '#18181B',
          border: '#27272A',
          muted: '#A1A1AA',
        },
      },
    },
  },
  plugins: [],
};
