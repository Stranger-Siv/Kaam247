import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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

  if (!hasAuth) {
    return <Navigate to="/" replace />
  }

  const effectiveUser = user || (() => {
    try {
      return userInfo ? JSON.parse(userInfo) : null
    } catch {
      return null
    }
  })()

  // After Google login: profile not completed → must visit setup first
  if (effectiveUser?.profileSetupCompleted === false && location.pathname !== '/setup-profile') {
    return <Navigate to="/setup-profile" replace />
  }
  if (effectiveUser?.profileSetupCompleted !== false && location.pathname === '/setup-profile') {
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

