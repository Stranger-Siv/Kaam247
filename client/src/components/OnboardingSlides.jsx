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

  return (
    <div
      className={`fixed inset-0 z-[2000] bg-slate-900 dark:bg-gray-950 flex flex-col transition-opacity duration-300 ${exiting ? 'opacity-0' : 'opacity-100'
        }`}
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
      {/* Progress: step count */}
      <div className="flex justify-center gap-1.5 pt-5 pb-2">
        {Array.from({ length: SLIDE_COUNT }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStep(i)}
            className={`h-1.5 rounded-full transition-all duration-200 ${i === step
                ? 'w-6 bg-blue-500'
                : 'w-1.5 bg-slate-600 hover:bg-slate-500'
              }`}
            aria-label={`Step ${i + 1} of ${SLIDE_COUNT}`}
          />
        ))}
      </div>

      {/* Slide content - no scroll, 2-3 lines per slide */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 sm:px-8 py-4 min-h-0 overflow-hidden">
        {step === 0 && (
          <>
            <div className="text-5xl sm:text-6xl mb-5" aria-hidden>
              📍
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white text-center mb-3">
              Welcome to Kaam247 👋
            </h1>
            <p className="text-base sm:text-lg text-slate-200 text-center max-w-sm leading-snug">
              Get local help for everyday tasks — or earn by helping nearby people.
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="text-xl sm:text-2xl font-bold text-white text-center mb-4">
              Choose how you want to use Kaam247
            </h1>
            <div className="w-full max-w-sm space-y-3">
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="font-semibold text-white mb-1">Post Tasks</p>
                <p className="text-sm text-slate-300 leading-snug">
                  Need help? Post a task and get it done nearby.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
                <p className="font-semibold text-white mb-1">Perform Tasks</p>
                <p className="text-sm text-slate-300 leading-snug">
                  Want to earn? Accept nearby tasks when you're free.
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-400 text-center mt-4 max-w-xs">
              You can switch modes anytime.
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-xl sm:text-2xl font-bold text-white text-center mb-4">
              Posting a task is simple
            </h1>
            <ol className="w-full max-w-sm space-y-3 text-left">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">1</span>
                <p className="text-slate-200 text-sm sm:text-base leading-snug pt-0.5">Post your task with budget & location</p>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">2</span>
                <p className="text-slate-200 text-sm sm:text-base leading-snug pt-0.5">Nearby worker accepts</p>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">3</span>
                <p className="text-slate-200 text-sm sm:text-base leading-snug pt-0.5">Task gets done</p>
              </li>
            </ol>
            <p className="text-sm text-slate-400 text-center mt-4 max-w-xs">
              You stay in control at every step.
            </p>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-xl sm:text-2xl font-bold text-white text-center mb-4">
              Earn money nearby
            </h1>
            <ol className="w-full max-w-sm space-y-3 text-left">
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center">1</span>
                <p className="text-slate-200 text-sm sm:text-base leading-snug pt-0.5">Go online when you're free</p>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center">2</span>
                <p className="text-slate-200 text-sm sm:text-base leading-snug pt-0.5">Get alerts for nearby tasks</p>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-600 text-white text-sm font-bold flex items-center justify-center">3</span>
                <p className="text-slate-200 text-sm sm:text-base leading-snug pt-0.5">Accept → Complete → Earn</p>
              </li>
            </ol>
            <p className="text-sm text-emerald-300/90 text-center mt-4 max-w-xs font-medium">
              You choose when to work. No fixed schedule.
            </p>
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="text-xl sm:text-2xl font-bold text-white text-center mb-4">
              You're always in control
            </h1>
            <ul className="w-full max-w-sm space-y-2 text-left text-sm sm:text-base text-slate-200">
              <li className="flex gap-2 items-start">
                <span className="text-slate-500 mt-0.5">•</span>
                <span>Go online/offline anytime</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="text-slate-500 mt-0.5">•</span>
                <span>Accept or reject tasks freely</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="text-slate-500 mt-0.5">•</span>
                <span>Chat only after task acceptance</span>
              </li>
              <li className="flex gap-2 items-start">
                <span className="text-slate-500 mt-0.5">•</span>
                <span>Cancel tasks if needed (with limits)</span>
              </li>
            </ul>
            <div className="mt-4 px-4 py-3 rounded-xl bg-blue-900/40 border border-blue-700/50 w-full max-w-sm">
              <p className="text-sm text-blue-200 text-center font-medium">
                Go online to receive task alerts.
              </p>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h1 className="text-xl sm:text-2xl font-bold text-white text-center mb-2">
              What to do next
            </h1>
            <p className="text-slate-400 text-sm text-center mb-6 max-w-xs">
              Pick an action below to get started.
            </p>
            <div className="w-full max-w-sm space-y-3">
              <button
                type="button"
                onClick={handlePrimaryCta}
                className="w-full px-5 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold transition-colors min-h-[48px]"
              >
                {userMode === 'poster' ? 'Post your first task' : 'Go online & find work'}
              </button>
              <button
                type="button"
                onClick={handleExplore}
                className="w-full px-5 py-3 rounded-xl border border-slate-600 text-slate-300 hover:text-white hover:border-slate-500 text-sm font-medium transition-colors"
              >
                Explore the app
              </button>
            </div>
          </>
        )}
      </div>

      {/* Footer: Skip always visible; Next or slide-6 CTAs */}
      <div className="px-5 sm:px-8 pb-8 pt-2 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <button
          type="button"
          onClick={handleSkip}
          className="order-2 sm:order-1 sm:mr-auto px-4 py-3 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
        >
          Skip
        </button>
        {!isLast && (
          <button
            type="button"
            onClick={handleNext}
            className="order-1 sm:order-2 flex-1 sm:flex-none px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-base font-semibold rounded-xl transition-colors min-h-[48px]"
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}

export default OnboardingSlides
