import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useUserMode } from '../../context/UserModeContext'

function BottomNav() {
  const location = useLocation()
  const { user } = useAuth()
  const { userMode } = useUserMode()
  const isGuest = !user?.id

  const isActive = (path) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard'
    }
    if (path === '/tasks') {
      return location.pathname === '/tasks'
    }
    if (path === '/earnings') {
      return location.pathname === '/earnings'
    }
    if (path === '/transactions') {
      return location.pathname === '/transactions'
    }
    return location.pathname.startsWith(path)
  }

  const navItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    ...(isGuest ? (userMode === 'worker' ? [{
      path: '/tasks',
      label: 'Tasks',
      icon: (<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>)
    }] : [{
      path: '/post-task',
      label: 'Post',
      icon: (<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>)
    }]) : userMode === 'worker' ? [{
      path: '/tasks',
      label: 'Tasks',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      )
    }] : [{
      path: '/post-task',
      label: 'Post',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      )
    }]),
    {
      path: '/activity',
      label: 'Activity',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    ...(userMode === 'worker' ? [{
      path: '/earnings',
      label: 'Earnings',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }] : [{
      path: '/transactions',
      label: 'Trans.',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      )
    }]),
    {
      path: '/profile',
      label: 'Profile',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-[999] shadow-lg safe-area-inset-bottom">
      <div className="flex">
        {navItems.map((item) => {
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 px-1 min-w-0 text-[10px] font-medium transition-colors min-h-[64px] touch-manipulation ${active
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 active:bg-gray-100 dark:active:bg-gray-700'
                }`}
            >
              <span className={`mb-1 shrink-0 transition-transform ${active ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              <span className="text-[10px] leading-tight truncate w-full text-center max-w-full px-px" title={item.path === '/transactions' ? 'Transactions' : undefined}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav

