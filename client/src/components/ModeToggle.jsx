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
      <div
        className="relative inline-flex rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/80 p-0.5 shrink-0"
        role="group"
        aria-label="Switch between Work and Post mode"
      >
        {/* Sliding pill indicator */}
        <span
          className="absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-4px)] rounded-md bg-white dark:bg-gray-700 shadow-sm border border-gray-200 dark:border-gray-600 pointer-events-none transition-transform duration-300 ease-out"
          style={{ transform: userMode === 'worker' ? 'translateX(0)' : 'translateX(calc(100% + 4px))' }}
          aria-hidden
        />
        <button
          onClick={userMode === 'worker' ? undefined : handleToggleMode}
          disabled={checkingActiveTask}
          type="button"
          aria-pressed={userMode === 'worker'}
          aria-label={userMode === 'worker' ? 'Find work (current)' : 'Switch to Find work'}
          className={`relative z-10 inline-flex flex-1 items-center justify-center min-h-[32px] min-w-[52px] rounded-md text-xs font-semibold transition-colors duration-300 ease-out
            focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-1 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800
            disabled:opacity-50 disabled:cursor-not-allowed
            ${userMode === 'worker'
              ? 'text-blue-600 dark:text-blue-400 cursor-default'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer'
            }`}
        >
          {checkingActiveTask && userMode === 'poster' ? '…' : 'Work'}
        </button>
        <button
          onClick={userMode === 'poster' ? undefined : handleToggleMode}
          disabled={checkingActiveTask}
          type="button"
          aria-pressed={userMode === 'poster'}
          aria-label={userMode === 'poster' ? 'Post tasks (current)' : 'Switch to Post tasks'}
          className={`relative z-10 inline-flex flex-1 items-center justify-center min-h-[32px] min-w-[52px] rounded-md text-xs font-semibold transition-colors duration-300 ease-out
            focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-1 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-800
            disabled:opacity-50 disabled:cursor-not-allowed
            ${userMode === 'poster'
              ? 'text-blue-600 dark:text-blue-400 cursor-default'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer'
            }`}
        >
          {checkingActiveTask && userMode === 'worker' ? '…' : 'Post'}
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

