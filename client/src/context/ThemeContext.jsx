import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

// Detect system preference
const getSystemPreference = () => {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  // Check localStorage for saved theme preference, or use system preference
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark'
    const savedTheme = localStorage.getItem('kaam247_theme')
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme
    }
    // No saved preference, use system preference
    return getSystemPreference()
  })

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      const savedTheme = localStorage.getItem('kaam247_theme')
      if (!savedTheme || savedTheme === 'system') {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange)
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleSystemThemeChange)
      return () => mediaQuery.removeListener(handleSystemThemeChange)
    }
  }, [])

  useEffect(() => {
    // Apply theme to document root with smooth transition
    const root = document.documentElement

    // Add transition class for smooth theme switching
    root.classList.add('theme-transition')

    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Save to localStorage (only if not 'system')
    if (theme !== 'system') {
      localStorage.setItem('kaam247_theme', theme)
    } else {
      localStorage.removeItem('kaam247_theme')
    }

    // Remove transition class after transition completes
    const timeout = setTimeout(() => {
      root.classList.remove('theme-transition')
    }, 300)

    return () => clearTimeout(timeout)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dark'
      if (prev === 'dark') return 'light'
      return getSystemPreference() === 'dark' ? 'light' : 'dark'
    })
  }

  const setThemeMode = (mode) => {
    if (mode === 'system') {
      setTheme(getSystemPreference())
    } else {
      setTheme(mode)
    }
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      setTheme: setThemeMode,
      isDark: theme === 'dark',
      systemPreference: getSystemPreference()
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

