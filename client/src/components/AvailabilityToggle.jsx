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
        {/* Capsule toggle with ON/OFF text and knob, similar to reference */}
        <button
          onClick={toggleAvailability}
          disabled={isDisabled}
          type="button"
          role="switch"
          aria-checked={isOnline}
          aria-label={isOnline ? 'On duty' : 'Off duty'}
          className={`relative inline-flex items-center h-8 w-20 rounded-full border-2 transition-colors duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-1
            disabled:opacity-50 disabled:cursor-not-allowed shrink-0
            ${isOnline
              ? 'bg-emerald-400 border-emerald-400'
              : 'bg-transparent border-gray-300 dark:border-gray-500'
            }`}
        >
          <span className="flex items-center justify-between w-full px-2">
            <span
              className={`text-[11px] font-semibold tracking-wide
                ${isOnline ? 'text-gray-900' : 'text-gray-600 dark:text-gray-300'}
              `}
            >
              {checkingActiveTask ? '...' : (isOnline ? 'ON' : 'OFF')}
            </span>
            <span
              className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200
                ${isOnline ? 'translate-x-0' : 'translate-x-0'}
              `}
            />
          </span>
        </button>

        {/* Tooltip - desktop only (no hover popover on small screens) */}
        {userMode === 'worker' && !isOnline && (
          <div className="absolute left-0 top-full mt-2 hidden md:group-hover:block z-50">
            <div className="relative bg-gray-900 dark:bg-gray-800 text-white dark:text-gray-100 text-xs rounded-lg px-3 py-2 shadow-lg w-52 text-left border border-gray-700">
              Go online to receive nearby task alerts
              <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-900 dark:bg-gray-800 transform rotate-45 border-l border-t border-gray-700" />
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
