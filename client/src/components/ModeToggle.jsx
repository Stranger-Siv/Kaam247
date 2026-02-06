import { useState } from 'react'
import { useUserMode } from '../context/UserModeContext'
import { useAvailability } from '../context/AvailabilityContext'
import ActiveTaskModal from './ActiveTaskModal'

function ModeToggle({ isMobile = false }) {
  const { userMode, toggleMode, checkingActiveTask } = useUserMode()
  const { isOnline, setOnline } = useAvailability()
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTaskData, setActiveTaskData] = useState(null)

  const modeLabelLong = userMode === 'worker' ? 'Perform Tasks' : 'Post Tasks'
  const modeLabelShort = userMode === 'worker' ? 'Worker' : 'Poster'

  const handleToggleMode = async () => {
    const success = await toggleMode(
      (data) => {
        setActiveTaskData(data)
        setModalOpen(true)
      },
      (offlineStatus) => {
        // Force offline when switching to POST TASK mode
        setOnline(offlineStatus)
      },
      isOnline // Pass online status to check
    )

    if (success) {
      // Mode switch was successful
      setModalOpen(false)
      setActiveTaskData(null)
    }
  }

  if (isMobile) {
    return (
      <>
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Mode: {modeLabelLong}</span>
          </div>
          <button
            onClick={handleToggleMode}
            disabled={checkingActiveTask}
            className="w-full px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkingActiveTask ? 'Checking...' : `Switch to ${userMode === 'worker' ? 'Post Tasks' : 'Perform Tasks'}`}
          </button>
        </div>
        <ActiveTaskModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          activeTaskId={activeTaskData?.activeTaskId}
          activeTaskTitle={activeTaskData?.activeTaskTitle}
          role={activeTaskData?.role}
          type="mode"
          isOnline={activeTaskData?.isOnline || false}
        />
      </>
    )
  }

  return (
    <>
      <div className="flex items-center shrink-0">
        <button
          onClick={handleToggleMode}
          disabled={checkingActiveTask}
          type="button"
          aria-label={checkingActiveTask ? 'Checking…' : `Switch to ${userMode === 'worker' ? 'Post Tasks' : 'Perform Tasks'}`}
          className={`relative inline-flex items-center min-h-[36px] w-[5.25rem] rounded-full border transition-all duration-200 ease-out
            focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900
            disabled:opacity-50 disabled:cursor-not-allowed
            ${userMode === 'worker'
              ? 'bg-blue-600 dark:bg-blue-500 border-blue-600 dark:border-blue-500'
              : 'bg-transparent border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
        >
          <span
            className={`absolute top-1/2 -translate-y-1/2 text-[9px] font-semibold uppercase tracking-wide transition-all duration-200 whitespace-nowrap
              ${userMode === 'worker'
                ? 'left-2 text-white'
                : 'right-2 text-gray-700 dark:text-gray-300'
              }`}
          >
            {checkingActiveTask ? '…' : (userMode === 'worker' ? 'Work' : 'Post')}
          </span>
          <span
            className="absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white dark:bg-gray-100 shadow-sm border border-gray-200 dark:border-gray-600 transition-all duration-200"
            style={userMode === 'worker' ? { right: '0.25rem' } : { left: '0.25rem' }}
          />
        </button>
      </div>
      <ActiveTaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        activeTaskId={activeTaskData?.activeTaskId}
        activeTaskTitle={activeTaskData?.activeTaskTitle}
        role={activeTaskData?.role}
        type="mode"
        isOnline={activeTaskData?.isOnline || false}
      />
    </>
  )
}

export default ModeToggle

