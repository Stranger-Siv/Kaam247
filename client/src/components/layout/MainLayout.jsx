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
import BottomNav from './BottomNav'
import OnboardingSlides from '../OnboardingSlides'
import PWAInstallModal from '../PWAInstallModal'

function MainLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const { logout, user } = useAuth()
    const { userMode } = useUserMode()
    const { hasCompletedOnboarding, onboardingLoaded } = useOnboarding()
    const isGuest = !user?.id
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
            {/* Header */}
            <header className="bg-white dark:bg-gray-900 shadow-sm dark:shadow-gray-900/50 sticky top-0 z-[1000] border-b border-gray-200 dark:border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
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
                            {!isGuest && userMode === 'worker' && (
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
                            {!isGuest && userMode === 'poster' && (
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
                            {!isGuest && userMode === 'worker' && <AvailabilityToggle />}
                            <ThemeToggle />
                            <ModeToggle />
                            {isGuest ? (
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
                            {!isGuest && userMode === 'worker' && <AvailabilityToggle />}
                            <ModeToggle />
                            {isGuest && (
                                <Link
                                    to="/login"
                                    className="inline-flex items-center justify-center px-3 py-2 min-h-[36px] rounded-xl bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors active:scale-[0.98]"
                                >
                                    Login
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content - No padding on mobile, padding on larger screens */}
            <main className="flex-1 max-w-7xl mx-auto sm:px-6 lg:px-8 py-4 sm:py-6 w-full pb-20 md:pb-6 overflow-x-hidden">
                <div className="w-full max-w-full overflow-x-hidden">
                    <Outlet />
                </div>
            </main>

            {/* Footer - Hidden on mobile when bottom nav is present */}
            <Footer className="hidden md:block" />

            {/* Bottom Navigation - Mobile Only */}
            <BottomNav />

            {/* Global Notification Toast */}
            <NotificationToast />
            <ReminderToast />
        </div>
    )
}

export default MainLayout

