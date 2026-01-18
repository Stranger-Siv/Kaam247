import { useState } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useUserMode } from '../../context/UserModeContext'
import ModeToggle from '../ModeToggle'
import AvailabilityToggle from '../AvailabilityToggle'
import Footer from './Footer'
import NotificationToast from '../NotificationToast'
import BottomNav from './BottomNav'

function MainLayout() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const { logout } = useAuth()
    const { userMode } = useUserMode()

    const handleLogout = () => {
        setIsMenuOpen(false)
        logout()
        navigate('/')
    }

    const handleNavClick = (path) => {
        navigate(path)
        setIsMenuOpen(false)
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-[1000]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo + Brand Name */}
                        <Link to="/dashboard" className="flex items-center h-full gap-2 sm:gap-2.5">
                            <img
                                src="/logo.svg"
                                alt="Kaam247"
                                className="h-8 sm:h-10 max-h-12 w-auto object-contain"
                            />
                            <span className="text-base sm:text-lg font-medium text-gray-900 whitespace-nowrap">
                                Kaam247
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center space-x-6">
                            <Link
                                to="/dashboard"
                                className={`text-base font-medium transition-colors ${location.pathname === '/dashboard'
                                    ? 'text-blue-600'
                                    : 'text-gray-700 hover:text-gray-900'
                                    }`}
                            >
                                Dashboard
                            </Link>
                            {userMode === 'worker' && (
                                <Link
                                    to="/tasks"
                                    className={`text-base font-medium transition-colors ${location.pathname.startsWith('/tasks') && !location.pathname.match(/\/tasks\/\d+/)
                                        ? 'text-blue-600'
                                        : 'text-gray-700 hover:text-gray-900'
                                        }`}
                                >
                                    Tasks
                                </Link>
                            )}
                            {userMode === 'poster' && (
                                <Link
                                    to="/post-task"
                                    className={`text-base font-medium transition-colors ${location.pathname === '/post-task'
                                        ? 'text-blue-600'
                                        : 'text-gray-700 hover:text-gray-900'
                                        }`}
                                >
                                    Post a Task
                                </Link>
                            )}
                            <Link
                                to="/activity"
                                className={`text-base font-medium transition-colors ${location.pathname === '/activity'
                                    ? 'text-blue-600'
                                    : 'text-gray-700 hover:text-gray-900'
                                    }`}
                            >
                                Activity
                            </Link>
                            {userMode === 'worker' && (
                                <Link
                                    to="/earnings"
                                    className={`text-base font-medium transition-colors ${location.pathname === '/earnings'
                                        ? 'text-blue-600'
                                        : 'text-gray-700 hover:text-gray-900'
                                        }`}
                                >
                                    Earnings
                                </Link>
                            )}
                            <Link
                                to="/profile"
                                className={`text-base font-medium transition-colors ${location.pathname === '/profile'
                                    ? 'text-blue-600'
                                    : 'text-gray-700 hover:text-gray-900'
                                    }`}
                            >
                                Profile
                            </Link>
                            {userMode === 'worker' && <AvailabilityToggle />}
                            <ModeToggle />
                            <button
                                onClick={handleLogout}
                                className="text-base font-medium text-red-600 hover:text-red-700 transition-colors"
                            >
                                Logout
                            </button>
                        </nav>

                        {/* Mobile Header Right Side */}
                        <div className="md:hidden flex items-center gap-2">
                            {/* Availability Toggle - Mobile Header (Worker Mode Only) */}
                            {userMode === 'worker' && <AvailabilityToggle />}
                            
                            {/* Hamburger Menu Button (Mobile Only) */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                                aria-label="Toggle menu"
                            >
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                {isMenuOpen ? (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                ) : (
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                )}
                            </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden border-t border-gray-200">
                        <nav className="px-4 py-2 space-y-1">
                            <button
                                onClick={() => handleNavClick('/dashboard')}
                                className={`w-full text-left px-4 py-3 rounded-md text-base font-medium transition-colors ${location.pathname === '/dashboard'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Dashboard
                            </button>
                            {userMode === 'worker' && (
                                <button
                                    onClick={() => handleNavClick('/tasks')}
                                    className={`w-full text-left px-4 py-3 rounded-md text-base font-medium transition-colors ${location.pathname.startsWith('/tasks') && !location.pathname.match(/\/tasks\/\d+/)
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    Tasks
                                </button>
                            )}
                            {userMode === 'poster' && (
                                <button
                                    onClick={() => handleNavClick('/post-task')}
                                    className={`w-full text-left px-4 py-3 rounded-md text-base font-medium transition-colors ${location.pathname === '/post-task'
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    Post a Task
                                </button>
                            )}
                            <button
                                onClick={() => handleNavClick('/activity')}
                                className={`w-full text-left px-4 py-3 rounded-md text-base font-medium transition-colors ${location.pathname === '/activity'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Activity
                            </button>
                            {userMode === 'worker' && (
                                <button
                                    onClick={() => handleNavClick('/earnings')}
                                    className={`w-full text-left px-4 py-3 rounded-md text-base font-medium transition-colors ${location.pathname === '/earnings'
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    Earnings
                                </button>
                            )}
                            <button
                                onClick={() => handleNavClick('/profile')}
                                className={`w-full text-left px-4 py-3 rounded-md text-base font-medium transition-colors ${location.pathname === '/profile'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                Profile
                            </button>
                            <ModeToggle isMobile={true} />
                            <button
                                onClick={handleLogout}
                                className="w-full text-left px-4 py-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                            >
                                Logout
                            </button>
                        </nav>
                    </div>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full pb-20 md:pb-6">
                <Outlet />
            </main>

            {/* Footer - Hidden on mobile when bottom nav is present */}
            <Footer className="hidden md:block" />

            {/* Bottom Navigation - Mobile Only */}
            <BottomNav />

            {/* Global Notification Toast */}
            <NotificationToast />
        </div>
    )
}

export default MainLayout

