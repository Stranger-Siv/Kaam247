import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Redirect admin users away from regular dashboard to admin dashboard
  if (user?.role === 'admin' && location.pathname === '/dashboard') {
    return <Navigate to="/admin" replace />
  }

  // Redirect non-admin users away from admin routes
  if (user?.role !== 'admin' && location.pathname.startsWith('/admin')) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute

