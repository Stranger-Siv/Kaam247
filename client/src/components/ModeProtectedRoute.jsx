import { Navigate } from 'react-router-dom'
import { useUserMode } from '../context/UserModeContext'

function ModeProtectedRoute({ children, allowedMode }) {
  const { userMode } = useUserMode()

  if (userMode !== allowedMode) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ModeProtectedRoute

