import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotification } from '../context/NotificationContext'

const FADE_OUT_MS = 300

function NotificationToast() {
  const { notifications, dismissAllNotifications, dismissTask } = useNotification()
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

  const handleDismissTask = (e, taskId) => {
    e.stopPropagation()
    if (taskId) dismissTask(taskId)
  }

  const handleClose = (e) => {
    e?.stopPropagation?.()
    dismissPanel(true)
  }

  if (!notifications?.length) {
    return null
  }

  const fadeClass = isExiting ? 'animate-toast-fade-out' : 'animate-slide-in'
  const title = notifications.length === 1 ? 'New Task Available' : `New Tasks (${notifications.length})`
  const zPanel = 'z-[2147483647]'

  return (
    <>
      {/* Mobile: full-screen overlay */}
      <div
        className={`fixed inset-0 ${zPanel} bg-slate-950/50 backdrop-blur-sm sm:hidden ${fadeClass}`}
        onClick={handleClose}
        style={{
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)'
        }}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="new-task-title-mobile"
      >
        <div
          className="w-full h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-50 flex flex-col overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse flex-shrink-0" aria-hidden />
              <h3 id="new-task-title-mobile" className="font-semibold text-lg text-slate-50 tracking-tight">{title}</h3>
            </div>
            <button onClick={handleClose} className="w-10 h-10 flex items-center justify-center text-slate-200 hover:text-white rounded-full hover:bg-white/10 flex-shrink-0 touch-manipulation" aria-label="Close">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 min-h-0">
            <div className="space-y-4 pb-4">
              {notifications.map((n) => (
                <div key={n.id} className="rounded-xl bg-white/5 border border-white/10 p-4 flex flex-col gap-3 relative">
                  <button onClick={(e) => handleDismissTask(e, n.id)} className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-200 rounded-full hover:bg-white/10 touch-manipulation" aria-label="Dismiss this task">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <h2 className="text-lg font-bold text-slate-50 leading-tight line-clamp-2 pr-8">{n.title}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/10 text-slate-50 text-sm font-medium">{n.category}</span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-400/15 text-emerald-200 text-sm font-bold">₹{n.budget}</span>
                    {n.distance && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-sky-400/15 text-sky-100 text-sm font-medium px-2.5 py-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                        {n.distance}
                      </span>
                    )}
                  </div>
                  {n.location && <p className="text-sm text-slate-300 line-clamp-1">{n.location}</p>}
                  <button onClick={(e) => handleViewTask(e, n.id)} className="w-full px-4 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-500 flex items-center justify-center gap-2 touch-manipulation">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    View & Accept
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="px-4 pt-3 pb-4 border-t border-white/10 flex-shrink-0">
            <p className="text-xs text-slate-400 text-center">Each task disappears after 15 seconds. Dismiss individually or close all.</p>
          </div>
        </div>
      </div>

      {/* Desktop / large screens: side panel (top-right) */}
      <div className={`hidden sm:block fixed top-20 right-4 sm:right-6 ${zPanel} ${fadeClass}`}>
        <div className="w-[22rem] max-h-[min(32rem,calc(100vh-6rem))] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 bg-green-500 dark:bg-green-400 rounded-full animate-pulse flex-shrink-0" />
              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100 tracking-tight">{title}</h3>
            </div>
            <button onClick={handleClose} className="w-8 h-8 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0" aria-label="Close">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
            <div className="p-4 space-y-4">
              {notifications.map((n) => (
                <div key={n.id} className="rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 p-4 flex flex-col gap-2.5 relative">
                  <button onClick={(e) => handleDismissTask(e, n.id)} className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600" aria-label="Dismiss this task">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 leading-tight line-clamp-2 pr-7">{n.title}</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium">{n.category}</span>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-bold">₹{n.budget}</span>
                    {n.distance && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium px-2.5 py-1">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                        {n.distance}
                      </span>
                    )}
                  </div>
                  {n.location && <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{n.location}</p>}
                  <button onClick={(e) => handleViewTask(e, n.id)} className="w-full px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    View & Accept
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="px-4 pt-2 pb-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Each task disappears after 15 seconds. Dismiss individually or close all.</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default NotificationToast
