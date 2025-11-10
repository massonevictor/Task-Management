/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        accent: {
          DEFAULT: '#6366f1',
          foreground: '#ffffff',
        },
      },
      boxShadow: {
        card: '0 10px 25px -20px rgba(15, 23, 42, 0.45)',
      },
    },
  },
  plugins: [],
};
