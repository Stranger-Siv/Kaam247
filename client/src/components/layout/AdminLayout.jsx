import { useState } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

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
    { path: '/admin/tasks', label: 'Tasks', icon: '📋' },
    { path: '/admin/reports', label: 'Reports', icon: '🚨' }
  ]

  const isActive = (path) => {
    if (path === '/admin') {
      return location.pathname === '/admin'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 md:bg-white md:border-r md:border-gray-200 md:shadow-sm">
        <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6 mb-8">
            <Link to="/admin" className="flex items-center gap-2.5">
              <img
                src="/logo.svg"
                alt="Kaam247"
                className="h-8 sm:h-10 w-auto object-contain"
              />
              <span className="text-base sm:text-lg font-semibold text-gray-900">Admin</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors min-h-[44px] ${isActive(item.path)
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm font-semibold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 truncate">Admin</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors min-h-[44px] border border-red-200"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:pl-64">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center justify-between px-4 h-16">
            <Link to="/admin" className="flex items-center gap-2.5">
              <img
                src="/logo.svg"
                alt="Kaam247"
                className="h-8 w-auto object-contain"
              />
              <span className="text-base font-semibold text-gray-900">Admin</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
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

          {/* Mobile Sidebar Overlay */}
          {isSidebarOpen && (
            <>
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setIsSidebarOpen(false)}
              />
              <div className="fixed inset-y-0 left-0 w-64 bg-white z-50 overflow-y-auto">
                <div className="flex flex-col h-full">
                  <nav className="flex-1 px-3 py-4 space-y-1">
                    {menuItems.map((item) => (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive(item.path)
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        <span className="text-lg">{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </nav>
                  <div className="px-4 py-4 border-t border-gray-200">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 text-sm font-semibold">
                          {user?.name?.charAt(0)?.toUpperCase() || 'A'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user?.name || 'Admin'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">Admin</p>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </header>

        {/* Mobile Bottom Tab Bar */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[999] shadow-lg safe-area-inset-bottom">
          <div className="flex">
            {menuItems.map((item) => {
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex-1 flex flex-col items-center justify-center py-2.5 px-2 text-[10px] font-medium transition-colors min-h-[64px] touch-manipulation ${active
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:bg-gray-50 active:bg-gray-100'
                    }`}
                >
                  <span className={`text-xl mb-1 transition-transform ${active ? 'scale-110' : ''}`}>
                    {item.icon}
                  </span>
                  <span className="text-[10px] leading-tight">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-4 sm:py-6 w-full overflow-x-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout

