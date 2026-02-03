import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserMode } from '../context/UserModeContext'
import { useOnboarding } from '../context/OnboardingContext'

const SLIDE_COUNT = 6
const FADE_DURATION_MS = 280

function OnboardingSlides() {
  const [step, setStep] = useState(0)
  const [exiting, setExiting] = useState(false)
  const navigate = useNavigate()
  const { userMode } = useUserMode()
  const { completeOnboarding } = useOnboarding()

  const isLast = step === SLIDE_COUNT - 1

  const finishOnboarding = useCallback(
    (path = null) => {
      setExiting(true)
      setTimeout(() => {
        completeOnboarding()
        if (path) navigate(path)
      }, FADE_DURATION_MS)
    },
    [completeOnboarding, navigate]
  )

  const handleNext = () => {
    if (isLast) return
    setStep((s) => s + 1)
  }

  const handleSkip = () => finishOnboarding()
  const handlePrimaryCta = () => {
    if (userMode === 'poster') finishOnboarding('/post-task')
    else finishOnboarding('/tasks')
  }
  const handleExplore = () => finishOnboarding('/dashboard')

  // Fully opaque so background page never shows through (light and dark)
  const containerClass = [
    'fixed inset-0 z-[2000] flex flex-col transition-opacity duration-300',
    'bg-gradient-to-b from-slate-50 via-white to-blue-50',
    'dark:bg-gradient-to-b dark:from-slate-900 dark:via-gray-900 dark:to-gray-950',
    exiting ? 'opacity-0' : 'opacity-100'
  ].join(' ')

  const dotActive = 'w-7 h-7 bg-blue-500 dark:bg-blue-400 shadow-md shadow-blue-500/30 text-white'
  const dotInactive = 'w-7 h-7 bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 text-gray-600 dark:text-slate-400'

  return (
    <div
      className={containerClass}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Kaam247"
    >
      {/* Progress rail: track bar + blue fill + dots */}
      <div className="relative flex flex-col items-center pt-6 pb-4 px-4">
        <div className="relative w-[85vw] min-w-[200px] max-w-[300px] h-12 flex items-center">
          {/* Rail track - single full-width bar, high contrast */}
          <div
            className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-3 rounded-full border border-gray-300 dark:border-slate-600 bg-gray-200 dark:bg-slate-700"
            style={{ width: '100%' }}
            aria-hidden
          />
          {/* Rail fill - left-aligned, grows with step */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-3 rounded-full bg-blue-500 dark:bg-blue-400 transition-[width] duration-500 ease-out"
            style={{ width: `${((step + 0.5) / SLIDE_COUNT) * 100}%` }}
            aria-hidden
          />
          {/* Dots - step numbers inside rings */}
          <div className="absolute inset-0 flex items-center justify-between px-0.5">
            {Array.from({ length: SLIDE_COUNT }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setStep(i)}
                className={`relative z-10 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-300 ring-2 ring-white dark:ring-gray-900 ${i === step ? dotActive : dotInactive}`}
                aria-label={`Step ${i + 1} of ${SLIDE_COUNT}`}
              >
                <span className="text-[10px] sm:text-xs font-bold leading-none select-none">
                  {i + 1}
                </span>
              </button>
            ))}
          </div>
        </div>
        <p className="text-center text-xs text-gray-500 dark:text-slate-400 mt-3 tabular-nums">
          {step + 1} of {SLIDE_COUNT}
        </p>
      </div>

      {/* Slide content - key forces re-mount and replay animation on step change */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-4 min-h-0 overflow-hidden">
        <div key={step} className="w-full max-w-sm flex flex-col items-center animate-onboarding-fade-in">

          {/* Slide 0: Welcome */}
          {step === 0 && (
            <>
              <div className="text-5xl sm:text-6xl mb-5 animate-onboarding-float" aria-hidden>
                📍
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white text-center mb-3">
                Welcome to Kaam247 👋
              </h1>
              <p className="text-base sm:text-lg text-gray-600 dark:text-slate-200 text-center max-w-sm leading-snug">
                Get local help for everyday tasks — or earn by helping nearby people.
              </p>
            </>
          )}

          {/* Slide 1: Two ways */}
          {step === 1 && (
            <>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
                Choose how you want to use Kaam247
              </h1>
              <div className="w-full space-y-3">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 shadow-lg shadow-gray-200/50 dark:shadow-none animate-onboarding-scale-in" style={{ animationDelay: '0ms' }}>
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">Post Tasks</p>
                  <p className="text-sm text-gray-600 dark:text-slate-300 leading-snug">
                    Need help? Post a task and get it done nearby.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 shadow-lg shadow-gray-200/50 dark:shadow-none animate-onboarding-scale-in" style={{ animationDelay: '80ms' }}>
                  <p className="font-semibold text-gray-900 dark:text-white mb-1">Perform Tasks</p>
                  <p className="text-sm text-gray-600 dark:text-slate-300 leading-snug">
                    Want to earn? Accept nearby tasks when you're free.
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-slate-400 text-center mt-4 max-w-xs animate-onboarding-fade-in" style={{ animationDelay: '200ms' }}>
                You can switch modes anytime.
              </p>
            </>
          )}

          {/* Slide 2: Poster flow */}
          {step === 2 && (
            <>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
                Posting a task is simple
              </h1>
              <ol className="w-full space-y-3 text-left">
                {[
                  'Post your task with budget & location',
                  'Nearby worker accepts',
                  'Task gets done'
                ].map((text, i) => (
                  <li key={i} className="flex gap-3 animate-onboarding-slide-in-right" style={{ animationDelay: `${i * 80}ms` }}>
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 dark:bg-blue-600 text-white text-sm font-bold flex items-center justify-center shadow-md shadow-blue-500/30 dark:shadow-blue-600/40">
                      {i + 1}
                    </span>
                    <p className="text-gray-700 dark:text-slate-200 text-sm sm:text-base leading-snug pt-1">{text}</p>
                  </li>
                ))}
              </ol>
              <p className="text-sm text-gray-500 dark:text-slate-400 text-center mt-4 max-w-xs animate-onboarding-fade-in" style={{ animationDelay: '280ms' }}>
                You stay in control at every step.
              </p>
            </>
          )}

          {/* Slide 3: Worker flow */}
          {step === 3 && (
            <>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
                Earn money nearby
              </h1>
              <ol className="w-full space-y-3 text-left">
                {[
                  "Go online when you're free",
                  'Get alerts for nearby tasks',
                  'Accept → Complete → Earn'
                ].map((text, i) => (
                  <li key={i} className="flex gap-3 animate-onboarding-slide-in-right" style={{ animationDelay: `${i * 80}ms` }}>
                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 dark:bg-emerald-600 text-white text-sm font-bold flex items-center justify-center shadow-md shadow-emerald-500/30 dark:shadow-emerald-600/40">
                      {i + 1}
                    </span>
                    <p className="text-gray-700 dark:text-slate-200 text-sm sm:text-base leading-snug pt-1">{text}</p>
                  </li>
                ))}
              </ol>
              <p className="text-sm text-emerald-700 dark:text-emerald-300/90 text-center mt-4 max-w-xs font-medium animate-onboarding-fade-in" style={{ animationDelay: '280ms' }}>
                You choose when to work. No fixed schedule.
              </p>
            </>
          )}

          {/* Slide 4: Controls */}
          {step === 4 && (
            <>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white text-center mb-4">
                You're always in control
              </h1>
              <ul className="w-full space-y-2.5 text-left text-sm sm:text-base text-gray-700 dark:text-slate-200">
                {[
                  'Go online/offline anytime',
                  'Accept or reject tasks freely',
                  'Chat only after task acceptance',
                  'Cancel tasks if needed (with limits)'
                ].map((item, i) => (
                  <li key={i} className="flex gap-2 items-start animate-onboarding-slide-in-right" style={{ animationDelay: `${i * 70}ms` }}>
                    <span className="text-blue-500 dark:text-blue-400 mt-0.5">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 px-4 py-3 rounded-2xl bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700/50 w-full animate-onboarding-scale-in" style={{ animationDelay: '320ms' }}>
                <p className="text-sm text-blue-800 dark:text-blue-200 text-center font-medium">
                  Go online to receive task alerts.
                </p>
              </div>
            </>
          )}

          {/* Slide 5: CTA */}
          {step === 5 && (
            <>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
                What to do next
              </h1>
              <p className="text-gray-500 dark:text-slate-400 text-sm text-center mb-6 max-w-xs">
                Pick an action below to get started.
              </p>
              <div className="w-full space-y-3">
                <button
                  type="button"
                  onClick={handlePrimaryCta}
                  className="w-full px-5 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-base font-semibold transition-all duration-200 min-h-[48px] shadow-lg shadow-blue-500/30 dark:shadow-blue-600/40 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] animate-onboarding-scale-in"
                  style={{ animationDelay: '0ms' }}
                >
                  {userMode === 'poster' ? 'Post your first task' : 'Go online & find work'}
                </button>
                <button
                  type="button"
                  onClick={handleExplore}
                  className="w-full px-5 py-3 rounded-2xl border-2 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-gray-400 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-800/50 text-sm font-medium transition-all duration-200 animate-onboarding-scale-in"
                  style={{ animationDelay: '80ms' }}
                >
                  Explore the app
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 sm:px-8 pb-8 pt-2 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <button
          type="button"
          onClick={handleSkip}
          className="order-2 sm:order-1 sm:mr-auto px-4 py-3 text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300 text-sm font-medium transition-colors"
        >
          Skip
        </button>
        {!isLast && (
          <button
            type="button"
            onClick={handleNext}
            className="order-1 sm:order-2 flex-1 sm:flex-none px-6 py-3.5 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-base font-semibold rounded-2xl transition-all duration-200 min-h-[48px] shadow-md shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98]"
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}

export default OnboardingSlides
