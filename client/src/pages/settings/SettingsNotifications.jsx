import { Link } from 'react-router-dom'
import { usePushNotifications } from '../../hooks/usePushNotifications'

export default function SettingsNotifications() {
  const {
    permission: pushPermission,
    loading: pushLoading,
    error: pushError,
    enable: enablePush
  } = usePushNotifications()

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 overflow-x-hidden">
      <div className="mb-4 sm:mb-6">
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          ← Back to Settings
        </Link>
      </div>
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
        Notifications
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Get push notifications for new tasks, task updates, and important reminders.
      </p>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
        {pushPermission === 'granted' ? (
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            Push notifications are enabled for this browser.
            <br />
            To turn them off, manage notifications in your browser or system settings.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={enablePush}
              disabled={pushLoading}
              className="h-11 px-5 bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {pushLoading ? 'Enabling...' : 'Enable push notifications'}
            </button>
            {pushError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{pushError}</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}
