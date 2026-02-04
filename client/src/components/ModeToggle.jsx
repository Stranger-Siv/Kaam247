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
      <div className="flex items-center gap-2 md:gap-3">
        <button
          onClick={handleToggleMode}
          disabled={checkingActiveTask}
          className="px-2.5 md:px-3.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[11px] md:text-xs font-semibold rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed h-7 md:h-8 flex items-center touch-manipulation"
        >
          {checkingActiveTask ? 'Checking...' : (
            <span className="px-1">{modeLabelShort}</span>
          )}
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

