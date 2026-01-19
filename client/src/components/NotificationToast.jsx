import { useNavigate } from 'react-router-dom'
import { useNotification } from '../context/NotificationContext'

function NotificationToast() {
  const { notification, hideNotification } = useNotification()
  const navigate = useNavigate()

  const handleNotificationClick = () => {
    if (notification) {
      navigate(`/tasks/${notification.id}`)
      hideNotification()
    }
  }

  if (!notification) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-[1500] flex items-start justify-center bg-black/50 animate-slide-in"
      onClick={hideNotification}
    >
      <div
        onClick={(e) => {
          e.stopPropagation()
          handleNotificationClick()
        }}
        className="mt-0 w-full h-full max-w-screen max-h-screen bg-white text-gray-900 rounded-none shadow-2xl border-0 transition-all duration-200 cursor-pointer overflow-hidden"
      >
        <div className="flex items-start justify-between gap-4 h-full">
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <h3 className="font-semibold text-xl tracking-tight">New task near you</h3>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  hideNotification()
                }}
                className="text-gray-400 hover:text-gray-700 transition-colors p-1 rounded-full hover:bg-gray-100 flex-shrink-0"
                aria-label="Close notification"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-center">
              <p className="text-lg text-gray-900 mb-3 font-semibold leading-snug line-clamp-3">
                {notification.title}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800 font-medium">
                  {notification.category}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-base font-semibold">
                  ₹{notification.budget}
                </span>
                {notification.distance && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {notification.distance}
                  </span>
                )}
                {notification.location && (
                  <span className="block w-full mt-2 text-xs text-gray-500 truncate">
                    {notification.location}
                  </span>
                )}
              </div>
            </div>

            <p className="mt-6 text-xs text-gray-500 text-center">
              Tap anywhere to open task details and accept.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotificationToast

