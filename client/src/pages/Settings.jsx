import { Link, useNavigate } from 'react-router-dom'
import { useUserMode } from '../context/UserModeContext'

function Settings() {
  const navigate = useNavigate()
  const { userMode } = useUserMode()

  const menuItems = [
    { to: '/settings/profile', label: 'Profile', description: 'Name and account details' },
    ...(userMode === 'worker'
      ? [
        { to: '/settings/preferences', label: 'Worker preferences', description: 'Categories and search radius' },
        { to: '/settings/availability', label: 'Availability schedule', description: 'When you\'re typically available' }
      ]
      : []),
    { to: '/settings/data-export', label: 'Data & export', description: 'Download activity as CSV' },
    { to: '/settings/notifications', label: 'Notifications', description: 'Push notifications' },
    { to: '/settings/account', label: 'Account', description: 'Phone change request and support' }
  ]

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 overflow-x-hidden">
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
            Settings
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage your preferences, notifications, and account details.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Back to profile
        </button>
      </div>

      {/* Settings menu - phone-style list */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 overflow-hidden">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {menuItems.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 sm:py-5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {item.label}
                  </span>
                  <span className="block text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                    {item.description}
                  </span>
                </div>
                <span className="flex-shrink-0 text-gray-400 dark:text-gray-500" aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default Settings
