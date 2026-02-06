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
    <div className={`rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 p-4 sm:p-6 text-center ${className}`}>
      <p className="text-gray-700 dark:text-gray-200 font-medium mb-4">{message}</p>
      <Link
        to={url}
        className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors min-h-[48px]"
      >
        Login
      </Link>
    </div>
  )
}

export default LoginCTA
