import { useState } from 'react'
import { useAvailability } from '../context/AvailabilityContext'
import { useUserMode } from '../context/UserModeContext'
import ActiveTaskModal from './ActiveTaskModal'

function AvailabilityToggle() {
  const { isOnline, setOnline, checkingActiveTask } = useAvailability()
  const { userMode } = useUserMode()
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTaskData, setActiveTaskData] = useState(null)

  // Disable toggle in POST TASK mode
  const isDisabled = userMode === 'poster' || checkingActiveTask

  const toggleAvailability = async () => {
    if (isDisabled) return

    const newStatus = !isOnline

    // Only check for active tasks when trying to go offline
    if (!newStatus) {
      const success = await setOnline(newStatus, (data) => {
        setActiveTaskData(data)
        setModalOpen(true)
      })

      if (!success) {
        // Going offline was blocked
        return
      }
    } else {
      // Going online - no check needed
      await setOnline(newStatus)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 md:gap-3 relative group">
        {/* Toggle Switch */}
        <button
          onClick={toggleAvailability}
          disabled={isDisabled}
          type="button"
          role="switch"
          aria-checked={isOnline}
          aria-label={isOnline ? 'Online' : 'Offline'}
          className={`relative inline-flex h-6 w-16 md:h-7 md:w-16 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation ${isOnline ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 hover:bg-gray-400'
            }`}
        >
          <span
            className={`inline-block h-5 w-5 md:h-6 md:w-6 transform rounded-full bg-white border-2 border-gray-200 shadow-lg transition-transform duration-200 ${isOnline ? 'translate-x-10 md:translate-x-9' : 'translate-x-0.5'
              }`}
          />
        </button>

        {/* Status Text */}
        <span className={`text-xs md:text-sm font-semibold whitespace-nowrap min-w-[65px] md:min-w-[70px] ${isOnline ? 'text-green-600' : 'text-gray-500'
          }`}>
          {isOnline ? 'ON DUTY' : 'OFF DUTY'}
        </span>

        {/* Tooltip - Desktop Only */}
        {userMode === 'worker' && !isOnline && (
          <div className="absolute left-0 top-full mt-2 hidden md:block group-hover:block z-50">
            <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
              Go online to receive nearby task alerts
              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
            </div>
          </div>
        )}
      </div>
      <ActiveTaskModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        activeTaskId={activeTaskData?.activeTaskId}
        activeTaskTitle={activeTaskData?.activeTaskTitle}
        role={activeTaskData?.role}
        type="offline"
      />
    </>
  )
}

export default AvailabilityToggle
