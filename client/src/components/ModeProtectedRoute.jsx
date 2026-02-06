import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUserMode } from '../context/UserModeContext'

/**
 * For guests: allow through (they see the page with login CTA).
 * For logged-in users: ensure mode matches (worker vs poster); else redirect to dashboard.
 */
function ModeProtectedRoute({ children, allowedMode }) {
  const { user } = useAuth()
  const { userMode } = useUserMode()

  if (!user?.id) return children
  if (userMode !== allowedMode) return <Navigate to="/dashboard" replace />
  return children
}

export default ModeProtectedRoute

