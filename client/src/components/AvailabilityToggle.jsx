import { useState, useEffect } from 'react'
import { useAvailability } from '../context/AvailabilityContext'
import { useUserMode } from '../context/UserModeContext'
import ActiveTaskModal from './ActiveTaskModal'

function AvailabilityToggle() {
  const { isOnline, setOnline, checkingActiveTask } = useAvailability()
  const { userMode } = useUserMode()
  const [modalOpen, setModalOpen] = useState(false)
  const [activeTaskData, setActiveTaskData] = useState(null)
  const [uiOnline, setUiOnline] = useState(isOnline)

  // Keep visual state in sync with context
  useEffect(() => {
    setUiOnline(isOnline)
  }, [isOnline])

  // Disable toggle in POST TASK mode
  const isDisabled = userMode === 'poster' || checkingActiveTask

  const toggleAvailability = async () => {
    if (isDisabled) return

    const newStatus = !uiOnline

    // Optimistically update UI for snappy feel
    setUiOnline(newStatus)

    // Only check for active tasks when trying to go offline
    if (!newStatus) {
      const success = await setOnline(newStatus, (data) => {
        setActiveTaskData(data)
        setModalOpen(true)
      })

      if (!success) {
        // Going offline was blocked, revert UI
        setUiOnline(true)
        return
      }
    } else {
      // Going online - require successful location capture
      const success = await setOnline(newStatus)
      if (!success) {
        // Block going ON DUTY if we couldn't get location or permission
        alert('Location permission is required to go ON DUTY. Please enable location access and try again.')
        // Revert UI
        setUiOnline(false)
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
          aria-checked={uiOnline}
          aria-label={uiOnline ? 'On duty' : 'Off duty'}
          className={`relative inline-flex h-8 w-20 rounded-full border-2 transition-all duration-300 ease-out
            focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-1
            disabled:opacity-50 disabled:cursor-not-allowed shrink-0
            ${uiOnline
              ? 'bg-emerald-400 border-emerald-400'
              : 'bg-transparent border-gray-300 dark:border-gray-500'
            }`}
        >
          {/* Label switches side with state */}
          <span
            className={`absolute top-1/2 -translate-y-1/2 text-[11px] font-semibold tracking-wide transition-all duration-300 ease-out
              ${uiOnline
                ? 'left-3 text-gray-900'
                : 'right-3 text-gray-600 dark:text-gray-300'
              }`}
          >
            {checkingActiveTask ? '...' : (uiOnline ? 'ON' : 'OFF')}
          </span>
          {/* Knob slides opposite to label with smooth easing */}
          <span
            className={`absolute top-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-white shadow-md transition-all duration-300 ease-out
              ${uiOnline ? 'right-1.5' : 'left-1.5'}
            `}
          />
        </button>

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
