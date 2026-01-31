import { useNavigate } from 'react-router-dom'
import { useNotification } from '../context/NotificationContext'

function ReminderToast() {
  const { reminder, hideReminder } = useNotification()
  const navigate = useNavigate()

  const handleView = (e) => {
    e?.stopPropagation?.()
    if (reminder?.taskId) {
      navigate(`/tasks/${reminder.taskId}`)
      hideReminder()
    } else {
      hideReminder()
    }
  }

  if (!reminder) return null

  return (
    <div
      className="fixed top-20 right-4 sm:right-6 z-[1490] animate-slide-in max-w-sm"
      role="alert"
    >
      <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl shadow-lg p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm">{reminder.title}</p>
          <p className="text-amber-800 dark:text-amber-200 text-sm mt-0.5">{reminder.message}</p>
          {reminder.taskId && (
            <button
              type="button"
              onClick={handleView}
              className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300 hover:underline"
            >
              View task →
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={hideReminder}
          className="flex-shrink-0 p-1 rounded text-amber-600 dark:text-amber-400 hover:bg-amber-200/50 dark:hover:bg-amber-700/50"
          aria-label="Dismiss"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default ReminderToast
