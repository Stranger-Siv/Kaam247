import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getLoginRedirectParams, RETURN_URL_PARAM } from '../utils/authIntents'

/**
 * Intent-based route guard: protected app routes (dashboard, tasks, post-task, profile, etc.).
 * Unauthenticated users are sent to /login with returnUrl and optional message (worker/poster)
 * so they can resume the intended action after login. No task data is shown before login.
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    )
  }

  // Check both state and localStorage as fallback (for Google redirect cases)
  const token = localStorage.getItem('kaam247_token')
  const userInfo = localStorage.getItem('kaam247_user')
  const hasAuth = isAuthenticated || (token && userInfo)

  // Intent-based redirect: send to login with destination and optional intent message
  if (!hasAuth) {
    const { returnUrl, message } = getLoginRedirectParams(location)
    const loginPath = `/login?${RETURN_URL_PARAM}=${encodeURIComponent(returnUrl)}${message ? `&message=${encodeURIComponent(message)}` : ''}`
    return <Navigate to={loginPath} replace />
  }

  const effectiveUser = user || (() => {
    try {
      return userInfo ? JSON.parse(userInfo) : null
    } catch {
      return null
    }
  })()

  // Require name and 10-digit phone (no bypass for Google auth)
  const nameOk = effectiveUser?.name && String(effectiveUser.name).trim().length > 0
  const phoneDigits = (effectiveUser?.phone && String(effectiveUser.phone).replace(/\D/g, '')) || ''
  const phoneOk = phoneDigits.length === 10
  const setupRequired = effectiveUser?.profileSetupCompleted === false || !nameOk || !phoneOk

  if (setupRequired && location.pathname !== '/setup-profile') {
    return <Navigate to="/setup-profile" replace />
  }
  if (!setupRequired && location.pathname === '/setup-profile') {
    return <Navigate to={effectiveUser?.role === 'admin' ? '/admin' : '/dashboard'} replace />
  }

  // Redirect admin users away from regular dashboard to admin dashboard
  if (effectiveUser?.role === 'admin' && location.pathname === '/dashboard') {
    return <Navigate to="/admin" replace />
  }

  // Redirect non-admin users away from admin routes
  if (effectiveUser?.role !== 'admin' && location.pathname.startsWith('/admin')) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute

