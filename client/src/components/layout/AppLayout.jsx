import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import MainLayout from './MainLayout'
import PageLoader from '../PageLoader'

/**
 * Wraps MainLayout for app routes (dashboard, tasks, post-task, profile, etc.).
 * Guests can see all pages; login is asked only inside each page (CTA or on submit).
 * When user is authenticated: enforce setup-profile and admin redirects only.
 */
function AppLayout() {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return <PageLoader />
  }

  const token = localStorage.getItem('kaam247_token')
  const userInfo = localStorage.getItem('kaam247_user')
  const hasAuth = isAuthenticated || (token && userInfo)

  if (!hasAuth) {
    return <MainLayout />
  }

  const effectiveUser = user || (() => {
    try {
      return userInfo ? JSON.parse(userInfo) : null
    } catch {
      return null
    }
  })()

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

  if (effectiveUser?.role === 'admin' && location.pathname === '/dashboard') {
    return <Navigate to="/admin" replace />
  }

  return <MainLayout />
}

export default AppLayout
