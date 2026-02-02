import { useState } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import ThemeToggle from '../ThemeToggle'

function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { logout, user } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const menuItems = [
    { path: '/admin', label: 'Overview', icon: '📊' },
    { path: '/admin/users', label: 'Users', icon: '👥' },
    { path: '/admin/workers', label: 'Workers', icon: '🔧' },
    { path: '/admin/tasks', label: 'Tasks', icon: '📋' },
    { path: '/admin/chats', label: 'Chats', icon: '💬' },
    { path: '/admin/reports', label: 'Reports', icon: '🚨' },
    { path: '/admin/tickets', label: 'Tickets', icon: '🎫' },
    { path: '/admin/reviews', label: 'Reviews', icon: '⭐' },
    { path: '/admin/logs', label: 'Logs', icon: '📜' },
    { path: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { path: '/admin/settings', label: 'Settings', icon: '⚙️' }
  ]

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      {/* Desktop Sidebar - only on large screens so 11 items fit; scrollable on short viewports */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:bg-white dark:lg:bg-gray-800 lg:border-r lg:border-gray-200 dark:lg:border-gray-700 lg:shadow-sm">
        <div className="flex-1 flex flex-col min-h-0 pt-6 pb-4">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6 mb-4">
            <Link to="/admin" className="flex items-center gap-2.5">
              <img
                src="/logo.svg"
                alt="Kaam247"
                className="h-8 sm:h-10 w-auto object-contain"
              />
              <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Admin</span>
            </Link>
          </div>

          {/* Navigation - scrollable when many items */}
          <nav className="flex-1 min-h-0 overflow-y-auto px-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors min-h-[44px] ${isActive(item.path)
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Admin</p>
              </div>
              <ThemeToggle />
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors min-h-[44px] border border-red-200 dark:border-red-800"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content - pl-64 only when sidebar is visible (lg+) */}
      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Mobile & medium: Header with hamburger (sidebar is drawer) */}
        <header className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 shadow-sm dark:shadow-gray-900/50">
          <div className="flex items-center justify-between px-4 h-16">
            <Link to="/admin" className="flex items-center gap-2.5">
              <img
                src="/logo.svg"
                alt="Kaam247"
                className="h-8 w-auto object-contain"
              />
              <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Admin</span>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2.5 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isSidebarOpen ? (
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

          {/* Mobile & medium: Sidebar drawer (all 11 items scrollable) */}
          {isSidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={() => setIsSidebarOpen(false)}
                aria-hidden="true"
              />
              <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-gray-900 z-50 flex flex-col shadow-xl">
                <div className="flex items-center justify-between flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">Menu</span>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Close menu"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <nav className="flex-1 min-h-0 overflow-y-auto px-3 py-4 space-y-1">
                  {menuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors min-h-[44px] ${isActive(item.path)
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="flex-shrink-0 px-4 py-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold">
                        {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {user?.name || 'Admin'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Admin</p>
                    </div>
                    <ThemeToggle />
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-red-200 dark:border-red-800"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
        </>
          )}
      </header>

      {/* Page Content - no bottom nav so no extra pb on mobile */}
      <main className="flex-1 overflow-y-auto pb-6 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-[6px] sm:px-5 lg:px-7 py-4 sm:py-6 lg:py-8 w-full overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
    </div >
  )
}

export default AdminLayout

