import { Link } from 'react-router-dom'
import { RETURN_URL_PARAM } from '../utils/authIntents'

/**
 * Reusable "Login to see / do X" prompt for guest users.
 * Use on dashboard, tasks, profile, etc. so guests see content and a clear login action.
 */
function LoginCTA({ message = 'Login to see details', returnUrl, className = '' }) {
  const url = returnUrl
    ? `/login?${RETURN_URL_PARAM}=${encodeURIComponent(returnUrl)}`
    : '/login'
  return (
    <div className={`rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-gray-900/50 overflow-hidden ${className}`}>
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <span className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400" aria-hidden>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">Login to see</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{message}</p>
            <Link
              to={url}
              className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors min-h-[44px]"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginCTA
