import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useCloseTransition } from '../hooks/useCloseTransition'

const TRANSITION_MS = 280

function TaskCancelledOverlay({ isOpen, onClose, message = 'This task has been cancelled.' }) {
  const { isExiting, requestClose } = useCloseTransition(onClose, TRANSITION_MS)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const content = (
    <div
      className={`fixed inset-0 z-[2500] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 ${isExiting ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'}`}
      onClick={requestClose}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="task-cancelled-title"
    >
      <div
        className={`w-[92vw] max-w-xl min-h-[50vh] sm:min-h-[45vh] flex flex-col items-center justify-center rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 sm:p-10 ${isExiting ? 'animate-modal-panel-out' : 'animate-modal-panel-in'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0" aria-hidden>
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="space-y-2">
            <h2 id="task-cancelled-title" className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
              Task cancelled
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-400 max-w-sm">
              {message}
            </p>
          </div>
          <button
            onClick={requestClose}
            className="px-6 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 font-semibold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors min-h-[44px] min-w-[44px]"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

export default TaskCancelledOverlay
