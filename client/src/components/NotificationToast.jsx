import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotification } from '../context/NotificationContext'

const AUTO_DISMISS_MS = 15000
const FADE_OUT_MS = 300

function NotificationToast() {
  const { notifications, dismissAllNotifications } = useNotification()
  const navigate = useNavigate()
  const [isExiting, setIsExiting] = useState(false)
  const timerRef = useRef(null)
  const navigatedRef = useRef(false)
  const dismissAllRef = useRef(dismissAllNotifications)
  const navigateRef = useRef(navigate)
  dismissAllRef.current = dismissAllNotifications
  navigateRef.current = navigate

  const dismissPanel = (shouldNavigate) => {
    if (navigatedRef.current) return
    navigatedRef.current = true
    setIsExiting(true)
    const afterFade = () => {
      dismissAllRef.current()
      if (shouldNavigate) navigateRef.current('/tasks')
    }
    timerRef.current = setTimeout(afterFade, FADE_OUT_MS)
  }

  const handleViewTask = (e, taskId) => {
    e.stopPropagation()
    if (taskId) {
      navigatedRef.current = true
      navigate(`/tasks/${taskId}`)
      dismissAllNotifications()
    }
  }

  const handleClose = (e) => {
    e?.stopPropagation?.()
    dismissPanel(true)
  }

  // One 15s timer for the whole panel; when it fires, fade out then dismiss all and go to /tasks
  useEffect(() => {
    if (!notifications?.length) {
      setIsExiting(false)
      navigatedRef.current = false
      return
    }
    navigatedRef.current = false
    setIsExiting(false)

    const t = setTimeout(() => {
      dismissPanel(true)
    }, AUTO_DISMISS_MS)

    return () => {
      clearTimeout(t)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [notifications?.length])

  if (!notifications?.length) {
    return null
  }

  const fadeClass = isExiting ? 'animate-toast-fade-out' : 'animate-slide-in'
  const title = notifications.length === 1 ? 'New Task Available' : `New Tasks (${notifications.length})`

  // Full-screen overlay on all screens (PWA: force show over app, alert user)
  return (
    <div
      className={`fixed inset-0 z-[2147483647] bg-slate-950/50 backdrop-blur-sm ${fadeClass}`}
      onClick={handleClose}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)'
      }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="new-task-title"
    >
      <div
        className="w-full h-full max-w-2xl mx-auto bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 flex flex-col overflow-hidden shadow-2xl border border-white/10 rounded-2xl sm:my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" aria-hidden />
            <h3 id="new-task-title" className="font-semibold text-lg text-slate-50 tracking-tight">{title}</h3>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center text-slate-200 hover:text-white transition-colors rounded-full hover:bg-white/10 flex-shrink-0 touch-manipulation"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable list of tasks */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 min-h-0">
          <div className="space-y-4 pb-4">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col gap-3"
              >
                <h2 className="text-lg font-bold text-slate-50 leading-tight line-clamp-2">{n.title}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/10 text-slate-50 text-sm font-medium">
                    {n.category}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-400/15 text-emerald-200 text-sm font-bold">
                    ₹{n.budget}
                  </span>
                  {n.distance && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-sky-400/15 text-sky-100 text-sm font-medium px-2.5 py-1">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {n.distance}
                    </span>
                  )}
                </div>
                {n.location && (
                  <p className="text-sm text-slate-300 line-clamp-1">{n.location}</p>
                )}
                <button
                  onClick={(e) => handleViewTask(e, n.id)}
                  className="w-full px-4 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 touch-manipulation"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  View & Accept
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
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
  )
}

export default NotificationToast
