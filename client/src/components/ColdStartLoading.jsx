import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/env'

const POLL_INTERVAL_MS = 3000
const POLL_INTERVAL_AFTER_100_MS = 5000
const MAX_RETRIES_BEFORE_SLOW = 100

const MICRO_COPY = [
  'Your tasks and account remain fully protected.',
  'All requests are served directly from Kaam247.',
  'Hyperlocal tasks and nearby work.',
]

/**
 * ColdStartLoading – shown when the initial backend check failed (backend sleeping).
 * Polls the same health endpoint every 3s (up to 100 times), then every 5s.
 * When backend responds, calls onReady(); App.jsx then hides this after 500ms and shows the app.
 */
function ColdStartLoading({ onReady }) {
  const [attempt, setAttempt] = useState(0)
  const [microCopyIndex, setMicroCopyIndex] = useState(0)

  useEffect(() => {
    let cancelled = false

    const check = async () => {
      if (cancelled) return
      try {
        const res = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          credentials: 'omit'
        })
        if (res.ok && !cancelled) {
          onReady()
          return
        }
      } catch {
        // Backend not up yet
      }
      if (!cancelled) setAttempt((a) => a + 1)
    }

    // First poll after 1s; then every 3s until 100 attempts, then every 5s
    const delay =
      attempt === 0
        ? 1000
        : attempt >= MAX_RETRIES_BEFORE_SLOW
          ? POLL_INTERVAL_AFTER_100_MS
          : POLL_INTERVAL_MS
    const timeoutId = setTimeout(check, delay)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [attempt, onReady])

  // Rotate micro-copy every 4.5s
  useEffect(() => {
    const id = setInterval(() => {
      setMicroCopyIndex((i) => (i + 1) % MICRO_COPY.length)
    }, 4500)
    return () => clearInterval(id)
  }, [])

  const progress = Math.min((attempt / MAX_RETRIES_BEFORE_SLOW) * 100, 95)

  return (
    <div
      className="min-h-[100dvh] bg-[#0f172a] flex items-center justify-center p-3 sm:p-6 py-6"
      style={{
        paddingLeft: 'max(12px, env(safe-area-inset-left))',
        paddingRight: 'max(12px, env(safe-area-inset-right))',
        paddingTop: 'max(24px, env(safe-area-inset-top))',
        paddingBottom: 'max(24px, env(safe-area-inset-bottom))'
      }}
    >
      <div className="max-w-md w-full max-h-[100dvh] overflow-y-auto">
        <div className="bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 text-center border border-gray-700">
          <div className="mb-4 sm:mb-6 flex justify-center">
            <img
              src="/icons/kaam247_pwa.jpeg"
              alt=""
              className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl object-contain bg-gray-700/50 p-1 sm:p-1.5"
            />
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-3 leading-tight">
            Waking up Kaam247
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mb-2 sm:mb-3 leading-relaxed">
            Our servers pause when inactive to keep the platform fast and affordable.
          </p>
          <p className="text-xs sm:text-sm text-gray-300 mb-3 sm:mb-4">
            This usually takes 20–40 seconds.
          </p>
          <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6 min-h-[2.25rem] sm:min-h-[2.5rem]">
            {MICRO_COPY[microCopyIndex]}
          </p>
          <div className="w-full bg-gray-700 rounded-full h-1.5 sm:h-2 mb-2 overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] sm:text-xs text-gray-500 mt-4 sm:mt-6">
            All requests are served directly from Kaam247.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ColdStartLoading
