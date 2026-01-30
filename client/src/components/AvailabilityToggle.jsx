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
      // Going online - require successful location capture
      const success = await setOnline(newStatus)
      if (!success) {
        // Block going ON DUTY if we couldn't get location or permission
        alert('Location permission is required to go ON DUTY. Please enable location access and try again.')
        return
      }
    }
  }

  return (
    <>
      <div className="flex items-center gap-2 relative group flex-shrink-0">
        {/* Toggle Switch - 72×36px track */}
        <button
          onClick={toggleAvailability}
          disabled={isDisabled}
          type="button"
          role="switch"
          aria-checked={isOnline}
          aria-label={isOnline ? "Online" : "Offline"}
          className={`relative inline-flex h-9 w-[72px] rounded-full transition-colors duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shrink-0
    ${isOnline
              ? "bg-green-500 dark:bg-green-600 hover:bg-green-600 dark:hover:bg-green-500"
              : "bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600"
            }`}
        >
          {/* KNOB (BIG PILL) */}
          <span
            className={`absolute top-1/2 left-[2px] -translate-y-1/2 flex items-center justify-center
      h-8 w-11 rounded-full bg-white dark:bg-gray-100 shadow-md
      transition-transform duration-200 ease-out
      ${isOnline ? "translate-x-[27px]" : "translate-x-0"}
    `}
          >
            {/* INNER BALL */}
            <span className="h-[22px] w-[22px] rounded-full bg-gray-300 dark:bg-gray-400" />
          </span>
        </button>

        {/* Status Text - fixed width so layout doesn't shift */}
        <span className={`text-xs font-semibold whitespace-nowrap w-[70px] text-left ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
          }`}>
          {isOnline ? 'ON DUTY' : 'OFF DUTY'}
        </span>

        {/* Tooltip - Desktop Only */}
        {userMode === 'worker' && !isOnline && (
          <div className="absolute left-0 top-full mt-2 hidden md:block group-hover:block z-50">
            <div className="bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 text-xs rounded-lg px-4 py-2 shadow-lg w-56 text-left border border-gray-700">
              Go online to receive nearby task alerts
              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-800 transform rotate-45 border-l border-t border-gray-700"></div>
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
