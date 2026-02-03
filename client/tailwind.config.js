/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'task-countdown': {
          from: { width: '100%' },
          to: { width: '0%' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s ease-out',
        'task-countdown': 'task-countdown 15s linear forwards',
      },
      colors: {
        // Override gray scale with neutral (less blue) dark tones
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#18181b', // softer neutral dark (zinc-like)
          900: '#111111', // page background
          950: '#050505', // deepest shade, still not pure black
        },
      },
    },
  },
  plugins: [],
}

