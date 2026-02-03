import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const DISMISS_STORAGE_KEY = 'kaam247_pwa_dismissed_until'
const DISMISS_DAYS = 7

const PWAInstallContext = createContext()

export function PWAInstallProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true ||
      document.referrer.includes('android-app://')
    setIsStandalone(standalone)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const isDismissed = useCallback(() => {
    try {
      const until = localStorage.getItem(DISMISS_STORAGE_KEY)
      if (!until) return false
      return Date.now() < parseInt(until, 10)
    } catch {
      return false
    }
  }, [])

  const requestShow = useCallback(() => {
    if (isStandalone) return
    if (isDismissed()) return
    setShowPrompt(true)
  }, [isDismissed])

  const dismiss = useCallback(() => {
    setShowPrompt(false)
    try {
      const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000
      localStorage.setItem(DISMISS_STORAGE_KEY, String(until))
    } catch (_) { }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return false
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setDeferredPrompt(null)
    setShowPrompt(false)
    return outcome === 'accepted'
  }, [deferredPrompt])

  return (
    <PWAInstallContext.Provider
      value={{
        canInstall: !!deferredPrompt && !isStandalone,
        isStandalone,
        showPrompt,
        requestShow,
        dismiss,
        install
      }}
    >
      {children}
    </PWAInstallContext.Provider>
  )
}

export function usePWAInstall() {
  const context = useContext(PWAInstallContext)
  if (!context) return { canInstall: false, isStandalone: false, showPrompt: false, requestShow: () => { }, dismiss: () => { }, install: async () => false }
  return context
}
