import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotification } from '../context/NotificationContext'

function NotificationToast() {
  const { notification, hideNotification } = useNotification()
  const navigate = useNavigate()
  const navigatedRef = useRef(false)

  const handleNotificationClick = () => {
    if (notification) {
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
      className="fixed inset-0 z-[1500] bg-black/60 animate-slide-in"
      onClick={hideNotification}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
          handleNotificationClick()
        }}
        className="w-full h-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden"
      >
        {/* Header - Fixed at top */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse flex-shrink-0"></div>
            <h3 className="font-semibold text-lg sm:text-xl text-slate-100 tracking-tight">New Task Available</h3>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              hideNotification()
            }}
            className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-white transition-colors rounded-full hover:bg-white/10 flex-shrink-0 touch-manipulation"
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
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 leading-tight line-clamp-3">
            {notification.title}
          </h2>

          {/* Info Chips */}
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white/10 text-slate-100 text-sm font-medium">
              {notification.category}
            </span>
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 text-base font-bold">
              ₹{notification.budget}
            </span>
            {notification.distance && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-500/15 text-blue-200 text-sm font-medium gap-1.5">
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
              <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm text-slate-300 leading-relaxed flex-1">{notification.location}</p>
            </div>
          )}
        </div>

        {/* Footer - Fixed at bottom */}
        <div className="px-4 pt-3 pb-4 border-t border-white/10 flex-shrink-0">
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden mb-3">
            <div className="h-full bg-emerald-400 rounded-full" style={{ width: '100%', animation: 'toastProgress 15s linear forwards' }} />
          </div>
          <p className="text-xs text-slate-400 text-center">
            Auto-opening Tasks in 15 seconds…
          </p>
        </div>
      </div>
    </div>
  )
}

export default NotificationToast

