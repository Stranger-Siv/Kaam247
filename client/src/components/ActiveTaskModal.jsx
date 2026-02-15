import { useNavigate } from 'react-router-dom'
import { useAvailability } from '../context/AvailabilityContext'

function ActiveTaskModal({ isOpen, onClose, activeTaskId, activeTaskTitle, role, type = 'mode', isOnline = false }) {
  const navigate = useNavigate()
  const { setOnline } = useAvailability()

  if (!isOpen) return null

  const handleGoToTask = () => {
    if (activeTaskId) {
      navigate(`/tasks/${activeTaskId}`)
    }
    onClose()
  }

  const handleStayOnline = () => {
    onClose()
  }

  const handleGoOffline = async () => {
    await setOnline(false)
    onClose()
    // After going offline, user can switch modes
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black bg-opacity-50 dark:bg-black/80 p-4 animate-modal-backdrop-in">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 animate-modal-panel-in" style={{ zIndex: 2001 }}>
        <div className="flex items-start gap-4 mb-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {type === 'mode' ? 'Finish current task first' : 'Cannot Go Offline'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {type === 'mode' 
                ? 'You have an active task or you are online. Please complete the task or go offline before switching modes.'
                : 'You cannot go offline while a task is active. Please complete or resolve the task first.'}
            </p>
            {activeTaskTitle && (
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-2">
                Task: {activeTaskTitle}
              </p>
            )}
            {type === 'mode' && isOnline && !activeTaskId && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                You are currently ON DUTY. Go offline to switch modes.
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3 mt-6">
          {activeTaskId && (
            <button
              onClick={handleGoToTask}
              className="w-full px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors min-h-[44px]"
            >
              View Active Task
            </button>
          )}
          {type === 'mode' && isOnline && (
            <button
              onClick={handleGoOffline}
              className="w-full px-4 py-3 bg-orange-600 dark:bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors min-h-[44px]"
            >
              Go Offline
            </button>
          )}
          {type === 'offline' && (
            <button
              onClick={handleStayOnline}
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-h-[44px]"
            >
              Stay Online
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors min-h-[44px]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default ActiveTaskModal

