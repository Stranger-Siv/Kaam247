import { useTheme } from '../context/ThemeContext'

function ThemeToggle({ mobile = false }) {
  const { toggleTheme, isDark } = useTheme()

  const iconClass = mobile ? 'w-6 h-6' : 'w-5 h-5'
  const sun = (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
  const moon = (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  )

  if (mobile) {
    return (
      <button
        onClick={toggleTheme}
        className="flex flex-col items-center justify-center py-2.5 px-2 text-[10px] font-medium transition-colors min-h-[64px] touch-manipulation text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600"
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      >
        <span className="mb-1">{isDark ? sun : moon}</span>
        <span className="text-[10px] leading-tight">Theme</span>
      </button>
    )
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? sun : moon}
    </button>
  )
}

export default ThemeToggle

