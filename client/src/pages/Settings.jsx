import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUserMode } from '../context/UserModeContext'
import { useOnboarding } from '../context/OnboardingContext'
import LoginCTA from '../components/LoginCTA'

function Settings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { userMode } = useUserMode()
  const { resetOnboarding } = useOnboarding()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefreshApp = async () => {
    if (refreshing) return
    setRefreshing(true)
    try {
      if ('caches' in window) {
        const names = await caches.keys()
        await Promise.all(names.map((name) => caches.delete(name)))
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((r) => r.unregister()))
      }
    } catch (_) {
      // Continue to reload anyway
    }
    window.location.reload()
  }

  if (!user?.id) {
    return (
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">Manage your account and preferences.</p>
        <LoginCTA message="Login to access settings" returnUrl="/settings" />
      </div>
    )
  }

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

      {/* Show onboarding again */}
      <div className="mt-6 p-4 sm:p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Show onboarding again</p>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
          Replay the welcome slides that explain Worker and Poster modes.
        </p>
        <button
          type="button"
          onClick={resetOnboarding}
          className="px-4 py-2.5 text-sm font-medium rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Show onboarding again
        </button>
      </div>

      {/* Refresh app - PWA update */}
      <div className="mt-6 p-4 sm:p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Refresh app</p>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-3">
          If the app feels outdated or something isn&apos;t working, tap below to load the latest version.
        </p>
        <button
          type="button"
          onClick={handleRefreshApp}
          disabled={refreshing}
          className="px-4 py-2.5 text-sm font-medium rounded-xl bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {refreshing ? 'Refreshing…' : 'Refresh app to get latest version'}
        </button>
      </div>
    </div>
  )
}

export default Settings
