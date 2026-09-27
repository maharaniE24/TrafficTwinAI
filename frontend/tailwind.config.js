/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mission: {
          bg: '#070B14',
          card: '#0F172A',
          cardBorder: '#1E293B',
          accent: '#00F2FE',
          accentGlow: 'rgba(0, 242, 254, 0.15)',
          amber: '#F59E0B',
          red: '#EF4444',
          green: '#10B981',
          surface: '#111C33',
          muted: '#64748B'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 242, 254, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 242, 254, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
