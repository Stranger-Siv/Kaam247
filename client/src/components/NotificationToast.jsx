import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotification } from '../context/NotificationContext'

function NotificationToast() {
  const { notification, hideNotification } = useNotification()
  const navigate = useNavigate()
  const navigatedRef = useRef(false)

  const handleViewTask = (e) => {
    e.stopPropagation()
    if (notification) {
      navigatedRef.current = true
      navigate(`/tasks/${notification.id}`)
      hideNotification()
    }
  }

  // Auto-navigate to /tasks after 15 seconds (alert behavior)
  useEffect(() => {
    if (!notification) return
    navigatedRef.current = false

    const t = setTimeout(() => {
      if (navigatedRef.current) return
      navigatedRef.current = true
      navigate('/tasks')
      hideNotification()
    }, 15000)

    return () => clearTimeout(t)
  }, [notification, navigate, hideNotification])

  if (!notification) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[1500] bg-black/50 animate-slide-in"
      onClick={hideNotification}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      <div className="w-full h-full bg-white flex flex-col overflow-hidden shadow-2xl">
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
            <h3 className="font-semibold text-lg sm:text-xl text-gray-900 tracking-tight">New Task Available</h3>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigatedRef.current = true
              hideNotification()
            }}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors rounded-full hover:bg-gray-100 flex-shrink-0 touch-manipulation"
            aria-label="Close notification"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content - Scrollable middle section */}
        <div className="flex-1 flex flex-col justify-center px-4 py-6 overflow-y-auto">
          {/* Task Title */}
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 leading-tight line-clamp-3">
            {notification.title}
          </h2>

          {/* Info Chips */}
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 text-gray-800 text-sm font-medium">
              {notification.category}
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-base font-bold">
              ₹{notification.budget}
            </span>
            {notification.distance && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium gap-1.5">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {notification.distance}
              </span>
            )}
          </div>

          {/* Location */}
          {notification.location && (
            <div className="flex items-start gap-2 mb-6">
              <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm text-gray-600 leading-relaxed flex-1">{notification.location}</p>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleViewTask}
            className="w-full px-6 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 touch-manipulation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            View & Accept Task
          </button>
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="px-4 pt-3 pb-4 border-t border-gray-200 flex-shrink-0">
          <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden mb-2">
            <div className="h-full bg-blue-600 rounded-full" style={{ width: '100%', animation: 'toastProgress 15s linear forwards' }} />
          </div>
          <p className="text-xs text-gray-500 text-center">
            Auto-opening Tasks page in 15 seconds…
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotificationToast

