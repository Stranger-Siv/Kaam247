import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'kaam247_onboarding_completed'

const OnboardingContext = createContext()

export function OnboardingProvider({ children }) {
  const [completed, setCompleted] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      setCompleted(raw === 'true')
    } catch (_) {
      setCompleted(false)
    }
    setLoaded(true)
  }, [])

  const completeOnboarding = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
      setCompleted(true)
    } catch (_) { }
  }, [])

  const resetOnboarding = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setCompleted(false)
    } catch (_) { }
  }, [])

  return (
    <OnboardingContext.Provider
      value={{
        hasCompletedOnboarding: completed,
        onboardingLoaded: loaded,
        completeOnboarding,
        resetOnboarding
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}

export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider')
  }
  return context
}
