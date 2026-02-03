import { useState } from 'react'
import { useUserMode } from '../context/UserModeContext'
import { useOnboarding } from '../context/OnboardingContext'

const SLIDES = [
  {
    title: 'Welcome to Kaam247',
    subtitle: 'Hyperlocal task marketplace',
    body: 'Get everyday help from people nearby, or earn by completing tasks. All within your locality.',
    icon: '🏠'
  },
  {
    title: 'As a Worker',
    subtitle: 'Find tasks and earn',
    body: 'Go ON DUTY to see tasks near you. Accept a task, complete it, and get paid. You can filter by category, distance, and budget.',
    icon: '💼'
  },
  {
    title: 'As a Poster',
    subtitle: 'Get help for your tasks',
    body: 'Post a task with a budget and location. Workers nearby get notified and can accept. You can track progress and pay when done.',
    icon: '📋'
  },
  {
    title: 'Switch anytime',
    subtitle: 'One app, two modes',
    body: 'Use the mode toggle in the header to switch between Worker and Poster. Your dashboard, tasks, and earnings are all in one place.',
    icon: '🔄'
  }
]

function OnboardingSlides() {
  const [step, setStep] = useState(0)
  const { userMode } = useUserMode()
  const { completeOnboarding } = useOnboarding()

  const isLast = step === SLIDES.length - 1

  const handleNext = () => {
    if (isLast) {
      completeOnboarding()
    } else {
      setStep(s => s + 1)
    }
  }

  const handleSkip = () => {
    completeOnboarding()
  }

  const slide = SLIDES[step]

  return (
    <div
      className="fixed inset-0 z-[2000] bg-slate-900 dark:bg-gray-950 flex flex-col"
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
      <div className="flex-1 flex flex-col items-center justify-center px-6 sm:px-10 py-8">
        <div className="text-5xl sm:text-6xl mb-6 sm:mb-8" aria-hidden>
          {slide.icon}
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white text-center mb-2">
          {slide.title}
        </h1>
        <p className="text-sm sm:text-base text-slate-300 dark:text-slate-400 text-center mb-6 max-w-md">
          {slide.subtitle}
        </p>
        <p className="text-base sm:text-lg text-slate-200 dark:text-slate-300 text-center max-w-lg leading-relaxed">
          {slide.body}
        </p>
      </div>

      <div className="flex justify-center gap-2 mb-6 sm:mb-8">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setStep(i)}
            className={`h-2 rounded-full transition-all duration-200 ${i === step
                ? 'w-6 bg-blue-500 dark:bg-blue-400'
                : 'w-2 bg-slate-500 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
              }`}
            aria-label={`Go to step ${i + 1}`}
          />
        ))}
      </div>

      <div className="px-6 sm:px-10 pb-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
        <button
          type="button"
          onClick={handleSkip}
          className="order-2 sm:order-1 px-5 py-3.5 text-slate-400 dark:text-slate-500 hover:text-white dark:hover:text-slate-200 text-sm font-medium rounded-xl border border-slate-600 dark:border-slate-700 hover:border-slate-500 transition-colors"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="order-1 sm:order-2 flex-1 px-6 py-3.5 bg-blue-600 dark:bg-blue-500 text-white text-base font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors min-h-[48px]"
        >
          {isLast ? 'Get started' : 'Next'}
        </button>
      </div>
    </div>
  )
}

export default OnboardingSlides
