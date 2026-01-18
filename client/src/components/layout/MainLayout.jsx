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
    const navigate = useNavigate()
    const location = useLocation()
    const { logout } = useAuth()
    const { userMode } = useUserMode()

    const handleLogout = () => {
        logout()
        navigate('/')
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-[1000]">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
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

                        {/* Mobile Header Right Side - Only Availability Toggle */}
                        <div className="md:hidden flex items-center">
                            {/* Availability Toggle - Mobile Header (Worker Mode Only) */}
                            {userMode === 'worker' && <AvailabilityToggle />}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content - No padding on mobile, padding on larger screens */}
            <main className="flex-1 max-w-7xl mx-auto px-0 sm:px-6 lg:px-8 py-4 sm:py-6 w-full pb-20 md:pb-6 overflow-x-hidden">
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
        </div>
    )
}

export default MainLayout

