import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function AdminRoute({ children }) {
    const { isAuthenticated, user, loading } = useAuth()

    if (loading) {
        console.log('⏳ [AdminRoute] Still loading, showing spinner...')
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
        )
    }

    // Check both state and localStorage as fallback (for Google redirect cases)
    const token = localStorage.getItem('kaam247_token')
    const userInfo = localStorage.getItem('kaam247_user')
    const hasAuth = isAuthenticated || (token && userInfo)
    
    // Parse user from localStorage if state doesn't have it yet
    let currentUser = user
    if (!currentUser && userInfo) {
        try {
            currentUser = JSON.parse(userInfo)
        } catch {
            // Invalid user info
        }
    }

    console.log('🔒 [AdminRoute] Checking authentication:', {
        isAuthenticated,
        hasToken: !!token,
        hasUserInfo: !!userInfo,
        hasAuth,
        userRole: currentUser?.role
    })

    if (!hasAuth) {
        console.log('❌ [AdminRoute] Not authenticated, redirecting to home')
        return <Navigate to="/" replace />
    }

    // Check if user is admin
    if (currentUser?.role !== 'admin') {
        console.log('❌ [AdminRoute] User is not admin, redirecting to dashboard')
        return <Navigate to="/dashboard" replace />
    }

    console.log('✅ [AdminRoute] User is admin, allowing access')
    return children
}

export default AdminRoute

