import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function AdminRoute({ children }) {
    const { isAuthenticated, user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
        )
    }

    const token = localStorage.getItem('kaam247_token')
    const userInfo = localStorage.getItem('kaam247_user')
    const hasAuth = isAuthenticated || (token && userInfo)

    let currentUser = user
    if (!currentUser && userInfo) {
        try {
            currentUser = JSON.parse(userInfo)
        } catch {
            currentUser = null
        }
    }

    if (!hasAuth) {
        return <Navigate to="/" replace />
    }

    // Require name and phone (no bypass for Google auth)
    const nameOk = currentUser?.name && String(currentUser.name).trim().length > 0
    const phoneDigits = (currentUser?.phone && String(currentUser.phone).replace(/\D/g, '')) || ''
    const phoneOk = phoneDigits.length === 10
    const setupRequired = currentUser?.profileSetupCompleted === false || !nameOk || !phoneOk

    if (setupRequired && location.pathname !== '/setup-profile') {
        return <Navigate to="/setup-profile" replace />
    }

    if (currentUser?.role !== 'admin') {
        return <Navigate to="/dashboard" replace />
    }

    return children
}

export default AdminRoute

