/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Override gray scale with completely neutral colors (no blue tint)
        // Light mode grays stay the same, dark grays become neutral charcoal
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1a1a1a', // Neutral dark charcoal (was blue-tinted)
          900: '#0f0f0f', // Neutral dark charcoal (was blue-tinted)
          950: '#0a0a0a', // True black/charcoal (was blue-tinted)
        },
      },
    },
  },
  plugins: [],
}

