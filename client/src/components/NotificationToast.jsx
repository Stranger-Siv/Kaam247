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
    <>
      {/* Mobile: Full screen overlay */}
      <div
        className="fixed inset-0 z-[1500] bg-slate-950/40 backdrop-blur-[2px] animate-slide-in sm:hidden"
        onClick={hideNotification}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)'
        }}
      >
        <div className="w-full h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 flex flex-col overflow-hidden shadow-2xl">
          {/* Header - Fixed at top */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse flex-shrink-0"></div>
              <h3 className="font-semibold text-lg text-slate-50 tracking-tight">New Task Available</h3>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigatedRef.current = true
                hideNotification()
              }}
              className="w-10 h-10 flex items-center justify-center text-slate-200 hover:text-white transition-colors rounded-full hover:bg-white/10 flex-shrink-0 touch-manipulation"
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
            <h2 className="text-xl font-bold text-slate-50 mb-4 leading-tight line-clamp-3">
              {notification.title}
            </h2>

            {/* Info Chips */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/10 text-slate-50 text-sm font-medium">
                {notification.category}
              </span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-400/15 text-emerald-200 text-base font-bold">
                ₹{notification.budget}
              </span>
              {notification.distance && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-sky-400/15 text-sky-100 text-sm font-medium gap-1.5">
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
                <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm text-slate-200 leading-relaxed flex-1">{notification.location}</p>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleViewTask}
              className="w-full px-6 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-500 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 touch-manipulation"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              View & Accept Task
            </button>
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="px-4 pt-3 pb-4 border-t border-white/10 flex-shrink-0">
            <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden mb-2">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%', animation: 'toastProgress 15s linear forwards' }} />
            </div>
            <p className="text-xs text-slate-400 text-center">
              Auto-opening Tasks page in 15 seconds…
            </p>
          </div>
        </div>
      </div>

      {/* Desktop/Tablet: Toast notification (top-right) */}
      <div
        className="hidden sm:block fixed top-20 right-4 sm:right-6 z-[1500] animate-slide-in"
        onClick={handleViewTask}
      >
        <div className="w-[20vw] max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-3xl transition-shadow">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 bg-green-500 dark:bg-green-400 rounded-full animate-pulse flex-shrink-0"></div>
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 tracking-tight">New Task Available</h3>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigatedRef.current = true
                hideNotification()
              }}
              className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
              aria-label="Close notification"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-4 py-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3 leading-tight line-clamp-2">
              {notification.title}
            </h2>

            {/* Info Chips */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium">
                {notification.category}
              </span>
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-base font-bold">
                ₹{notification.budget}
              </span>
              {notification.distance && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium gap-1.5">
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
              <div className="flex items-start gap-2 mb-4">
                <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed flex-1 line-clamp-1">{notification.location}</p>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={handleViewTask}
              className="w-full px-4 py-3 bg-blue-600 dark:bg-blue-500 text-white text-base font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              View & Accept Task
            </button>
          </div>

          {/* Footer */}
          <div className="px-4 pt-2 pb-3 border-t border-gray-200 dark:border-gray-700">
            <div className="h-1 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden mb-1.5">
              <div className="h-full bg-blue-600 dark:bg-blue-500 rounded-full" style={{ width: '100%', animation: 'toastProgress 15s linear forwards' }} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Auto-opening Tasks page in 15 seconds…
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default NotificationToast

