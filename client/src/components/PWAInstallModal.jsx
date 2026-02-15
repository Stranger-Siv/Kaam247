import { usePWAInstall } from '../context/PWAInstallContext'
import { useCloseTransition } from '../hooks/useCloseTransition'

const BENEFITS = [
  'Faster access from home screen',
  'App-like experience',
  'No Play Store required',
  'Works well on low network'
]

function PWAInstallModal() {
  const { showPrompt, canInstall, dismiss, install } = usePWAInstall()
  const { isExiting, requestClose } = useCloseTransition(dismiss, 200)

  const handleInstall = async () => {
    const ok = await install()
    if (ok) requestClose()
  }

  if (!showPrompt && !isExiting) return null

  return (
    <div className="fixed inset-0 z-[1999] flex items-end sm:items-center justify-center p-4">
      <div className={`absolute inset-0 bg-black/50 dark:bg-black/60 ${isExiting ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'}`} onClick={requestClose} aria-hidden />
      <div className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-md w-full p-6 ${isExiting ? 'animate-modal-panel-out' : 'animate-modal-panel-in'}`}>
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Install Kaam247</h2>
          <button
            type="button"
            onClick={requestClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-lg"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Add to your home screen for a better experience.</p>
        <ul className="space-y-2 mb-6">
          {BENEFITS.map((b, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
              <span className="text-green-500 dark:text-green-400">✓</span>
              {b}
            </li>
          ))}
        </ul>
        {canInstall ? (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleInstall}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold rounded-xl transition-colors"
            >
              Install app
            </button>
            <button
              type="button"
              onClick={requestClose}
              className="px-4 py-3 text-gray-600 dark:text-gray-400 font-medium rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Not now
            </button>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Add to Home Screen</p>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2 mb-4">
              <p><strong>Android (Chrome):</strong> Tap ⋮ → Add to Home screen</p>
              <p><strong>iOS (Safari):</strong> Tap Share → Add to Home Screen</p>
            </div>
            <button
              type="button"
              onClick={requestClose}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Got it
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default PWAInstallModal
