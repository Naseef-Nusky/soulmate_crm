/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gurulink: {
          primary: '#1A2336',
          accent: '#D4A34B',
          accentHover: '#c4933a',
          bg: '#FFFFFF',
          bgLight: '#F8FAFC',
          bgSoft: '#F5F5F5',
          text: '#1A2336',
          textSecondary: '#4B5563',
          textMuted: '#666',
          border: '#E5E7EB',
          accentSoft: '#FFF8F2'
        }
      }
    }
  },
  plugins: []
};


