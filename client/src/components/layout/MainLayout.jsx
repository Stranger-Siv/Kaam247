import { useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'

// Redirect to mode-appropriate page when mode changes and current route doesn't match (e.g. guest on /post-task switches to worker)
function useRedirectOnModeMismatch() {
    const navigate = useNavigate()
    const location = useLocation()
    const { userMode } = useUserMode()

    useEffect(() => {
        const path = location.pathname
        if (userMode === 'worker' && path === '/post-task') {
            navigate('/tasks', { replace: true })
        } else if (userMode === 'poster' && path === '/tasks') {
            navigate('/post-task', { replace: true })
        }
    }, [userMode, location.pathname, navigate])
}
import { useAuth } from '../../context/AuthContext'
import { useUserMode } from '../../context/UserModeContext'
import { useOnboarding } from '../../context/OnboardingContext'
import { usePWAInstall } from '../../context/PWAInstallContext'
import ModeToggle from '../ModeToggle'
import AvailabilityToggle from '../AvailabilityToggle'
import ThemeToggle from '../ThemeToggle'
import Footer from './Footer'
import NotificationToast from '../NotificationToast'
import ReminderToast from '../ReminderToast'
import OnboardingSlides from '../OnboardingSlides'
import PWAInstallModal from '../PWAInstallModal'

function MainLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const { logout, user } = useAuth()
    const { userMode } = useUserMode()
    const { hasCompletedOnboarding, onboardingLoaded } = useOnboarding()
    const { requestShow: requestPWAInstall } = usePWAInstall()
    const pwaPromptShownRef = useRef(false)

    // After login/signup: suggest PWA install once per session (when onboarding is done)
    useEffect(() => {
        if (!user?.id || !hasCompletedOnboarding || pwaPromptShownRef.current) return
        pwaPromptShownRef.current = true
        const t = setTimeout(() => requestPWAInstall(), 1500)
        return () => clearTimeout(t)
    }, [user?.id, hasCompletedOnboarding, requestPWAInstall])

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    useRedirectOnModeMismatch()

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col">
            {/* First-time onboarding overlay */}
            {onboardingLoaded && !hasCompletedOnboarding && <OnboardingSlides />}
            <PWAInstallModal />
            {/* Header - fixed on small screens so nav is always visible */}
            <header className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-900/50 sticky top-0 z-[1000] border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-14 md:h-16">
                        {/* Logo + Brand Name */}
                        <Link to="/dashboard" className="flex items-center gap-2 sm:gap-2.5 min-h-[44px]">
                            <img
                                src="/logo.svg"
                                alt="Kaam247"
                                className="h-8 sm:h-9 w-auto object-contain flex-shrink-0"
                            />
                            <span className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                                Kaam247
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-1">
                            <Link
                                to="/dashboard"
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors min-h-[36px] flex items-center ${location.pathname === '/dashboard'
                                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40'
                                    : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                Dashboard
                            </Link>
                            {userMode === 'worker' && (
                                <Link
                                    to="/tasks"
                                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors min-h-[36px] flex items-center ${location.pathname === '/tasks'
                                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    Tasks
                                </Link>
                            )}
                            {userMode === 'poster' && (
                                <Link
                                    to="/post-task"
                                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors min-h-[36px] flex items-center ${location.pathname === '/post-task'
                                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    Post a Task
                                </Link>
                            )}
                            <Link
                                to="/activity"
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors min-h-[36px] flex items-center ${location.pathname === '/activity'
                                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40'
                                    : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                Activity
                            </Link>
                            {userMode === 'worker' && (
                                <Link
                                    to="/earnings"
                                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors min-h-[36px] flex items-center ${location.pathname === '/earnings'
                                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    Earnings
                                </Link>
                            )}
                            {userMode === 'poster' && (
                                <Link
                                    to="/transactions"
                                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors min-h-[36px] flex items-center ${location.pathname === '/transactions'
                                        ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                                        : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    Transactions
                                </Link>
                            )}
                            <Link
                                to="/profile"
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors min-h-[36px] flex items-center ${location.pathname === '/profile'
                                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40'
                                    : 'text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                                    }`}
                            >
                                Profile
                            </Link>
                            <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
                            {!(!user?.id) && userMode === 'worker' && <AvailabilityToggle />}
                            <ThemeToggle />
                            <ModeToggle />
                            {!user?.id ? (
                                <Link
                                    to="/login"
                                    className="inline-flex items-center justify-center px-4 py-2.5 min-h-[36px] rounded-xl bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors active:scale-[0.98]"
                                >
                                    Login
                                </Link>
                            ) : (
                                <button onClick={handleLogout} className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors min-h-[36px] flex items-center">Logout</button>
                            )}
                        </nav>

                        <div className="md:hidden flex items-center gap-2">
                            {!(!user?.id) && userMode === 'worker' && <AvailabilityToggle />}
                            <ThemeToggle />
                            <ModeToggle />
                            {!user?.id ? (
                                <Link
                                    to="/login"
                                    className="inline-flex items-center justify-center px-3 py-2 min-h-[36px] rounded-xl bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors active:scale-[0.98]"
                                >
                                    Login
                                </Link>
                            ) : (
                                <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-600 dark:hover:text-red-400 rounded-md min-h-[36px] flex items-center" aria-label="Logout">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Mobile: horizontal nav strip (fixed at top, content scrolls below) */}
                    <nav className="md:hidden flex items-center gap-1 overflow-x-auto overflow-y-hidden py-2 -mx-4 px-4 scrollbar-hide border-t border-gray-100 dark:border-gray-800 shrink-0" style={{ WebkitOverflowScrolling: 'touch' }}>
                        <Link to="/dashboard" className={`flex flex-col items-center justify-center min-w-[56px] py-1.5 rounded-lg text-[10px] font-medium shrink-0 transition-colors ${location.pathname === '/dashboard' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                            <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            Dashboard
                        </Link>
                        {userMode === 'worker' && (
                            <Link to="/tasks" className={`flex flex-col items-center justify-center min-w-[56px] py-1.5 rounded-lg text-[10px] font-medium shrink-0 transition-colors ${location.pathname === '/tasks' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                Tasks
                            </Link>
                        )}
                        {userMode === 'poster' && (
                            <Link to="/post-task" className={`flex flex-col items-center justify-center min-w-[56px] py-1.5 rounded-lg text-[10px] font-medium shrink-0 transition-colors ${location.pathname === '/post-task' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Post
                            </Link>
                        )}
                        <Link to="/activity" className={`flex flex-col items-center justify-center min-w-[56px] py-1.5 rounded-lg text-[10px] font-medium shrink-0 transition-colors ${location.pathname === '/activity' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                            <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Activity
                        </Link>
                        {user?.id && userMode === 'worker' && (
                            <Link to="/earnings" className={`flex flex-col items-center justify-center min-w-[56px] py-1.5 rounded-lg text-[10px] font-medium shrink-0 transition-colors ${location.pathname === '/earnings' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Earnings
                            </Link>
                        )}
                        {user?.id && userMode === 'poster' && (
                            <Link to="/transactions" className={`flex flex-col items-center justify-center min-w-[56px] py-1.5 rounded-lg text-[10px] font-medium shrink-0 transition-colors ${location.pathname === '/transactions' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                                <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                Trans.
                            </Link>
                        )}
                        <Link to="/profile" className={`flex flex-col items-center justify-center min-w-[56px] py-1.5 rounded-lg text-[10px] font-medium shrink-0 transition-colors ${location.pathname === '/profile' ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                            <svg className="w-5 h-5 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                            Profile
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main Content - scrolls below fixed top nav; no bottom nav on small screens */}
            <main className="flex-1 max-w-7xl mx-auto sm:px-6 lg:px-8 py-4 sm:py-6 w-full overflow-x-hidden">
                <div className="w-full max-w-full overflow-x-hidden">
                    <Outlet />
                </div>
            </main>

            {/* Footer - visible on all screens */}
            <Footer />

            {/* Global Notification Toast */}
            <NotificationToast />
            <ReminderToast />
        </div>
    )
}

export default MainLayout

