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
    <div className="fixed top-20 right-6 left-6 sm:left-auto sm:max-w-md z-[1500] animate-slide-in">
      <div
        onClick={handleNotificationClick}
        className="block bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl shadow-2xl p-6 border-2 border-blue-400 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 cursor-pointer transform hover:scale-[1.02]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <h3 className="font-bold text-2xl">New Task Available!</h3>
            </div>
            <p className="text-lg text-blue-50 mb-4 font-medium leading-relaxed">
              {notification.title}
            </p>
            <div className="flex items-center gap-4 text-base flex-wrap">
              <span className="bg-blue-500/30 px-3 py-1.5 rounded-lg font-medium">
                {notification.category}
              </span>
              <span className="text-xl font-bold text-yellow-300">
                ₹{notification.budget}
              </span>
              {notification.distance && (
                <span className="text-sm text-green-300 font-semibold flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {notification.distance}
                </span>
              )}
              {notification.location && (
                <span className="text-sm text-blue-100 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {notification.location}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              hideNotification()
            }}
            className="text-blue-100 hover:text-white transition-colors p-1 rounded-full hover:bg-blue-500/30 flex-shrink-0"
            aria-label="Close notification"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default NotificationToast

