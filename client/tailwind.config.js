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
        'onboarding-fade-in': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'onboarding-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'onboarding-scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'onboarding-slide-in-right': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'stat-pop': {
          from: { opacity: '0', transform: 'scale(0.85) translateY(8px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'modal-backdrop-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'modal-panel-in': {
          from: { opacity: '0', transform: 'scale(0.98) translateY(8px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'modal-sheet-in': {
          from: { opacity: '0', transform: 'translateY(100%)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'drawer-left-in': {
          from: { opacity: '0', transform: 'translateX(-100%)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'modal-backdrop-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'modal-panel-out': {
          from: { opacity: '1', transform: 'scale(1) translateY(0)' },
          to: { opacity: '0', transform: 'scale(0.98) translateY(8px)' },
        },
        'modal-sheet-out': {
          from: { opacity: '1', transform: 'translateY(0)' },
          to: { opacity: '0', transform: 'translateY(100%)' },
        },
        'drawer-left-out': {
          from: { opacity: '1', transform: 'translateX(0)' },
          to: { opacity: '0', transform: 'translateX(-100%)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s ease-out',
        'modal-backdrop-in': 'modal-backdrop-in 0.2s ease-out forwards',
        'modal-panel-in': 'modal-panel-in 0.25s ease-out forwards',
        'modal-sheet-in': 'modal-sheet-in 0.3s ease-out forwards',
        'drawer-left-in': 'drawer-left-in 0.25s ease-out forwards',
        'modal-backdrop-out': 'modal-backdrop-out 0.2s ease-in forwards',
        'modal-panel-out': 'modal-panel-out 0.2s ease-in forwards',
        'modal-sheet-out': 'modal-sheet-out 0.25s ease-in forwards',
        'drawer-left-out': 'drawer-left-out 0.2s ease-in forwards',
        'task-countdown': 'task-countdown 15s linear forwards',
        'onboarding-fade-in': 'onboarding-fade-in 0.7s ease-out forwards',
        'onboarding-float': 'onboarding-float 4.5s ease-in-out infinite',
        'onboarding-scale-in': 'onboarding-scale-in 0.6s ease-out forwards',
        'onboarding-slide-in-right': 'onboarding-slide-in-right 0.55s ease-out forwards',
        'stat-pop': 'stat-pop 0.5s ease-out forwards',
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

