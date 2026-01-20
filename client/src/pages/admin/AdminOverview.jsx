import { useEffect, useRef, useState } from 'react'
import { apiGet } from '../../utils/api'

function AdminOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    onlineWorkers: 0,
    tasksToday: 0,
    completedToday: 0,
    cancelledToday: 0,
    earningsToday: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const stopPollingRef = useRef(false)

  useEffect(() => {
    const fetchStats = async () => {
      if (stopPollingRef.current) return
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('kaam247_token')
        if (!token) {
          stopPollingRef.current = true
          setError('Please login as admin to view stats.')
          return
        }

        const { data, error: apiError } = await apiGet('/api/admin/stats')
        if (apiError) {
          // If auth fails, stop the 10s polling loop to prevent console/network spam.
          if (apiError.includes('(401)') || apiError.includes('(403)')) {
            stopPollingRef.current = true
          }
          setError(apiError || 'Failed to load stats')
          return
        }

        setStats(data)
      } catch (err) {
        // Keep console clean in production; show error in UI instead.
        setError(err.message || 'Failed to load stats')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    
    // Refresh stats every 10 seconds for real-time updates
    const intervalId = setInterval(fetchStats, 10000)
    
    // Listen for custom events that might trigger a refresh
    const handleRefresh = () => {
      fetchStats()
    }
    
    window.addEventListener('admin_stats_refresh', handleRefresh)
    
    return () => {
      clearInterval(intervalId)
      window.removeEventListener('admin_stats_refresh', handleRefresh)
    }
  }, [])

  if (loading) {
    return (
      <div className="w-full overflow-x-hidden">
        <div className="mb-6 sm:mb-8 lg:mb-10">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 sm:p-5 lg:p-6 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: '👥',
      bgColor: 'bg-blue-50 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50'
    },
    {
      label: 'Online Workers',
      value: stats.onlineWorkers,
      icon: '🟢',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800',
      iconBg: 'bg-green-100 dark:bg-green-900/50'
    },
    {
      label: 'Tasks Today',
      value: stats.tasksToday,
      icon: '📋',
      bgColor: 'bg-purple-50 dark:bg-purple-900/30',
      textColor: 'text-purple-700 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-800',
      iconBg: 'bg-purple-100 dark:bg-purple-900/50'
    },
    {
      label: 'Completed Today',
      value: stats.completedToday,
      icon: '✅',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50'
    },
    {
      label: 'Cancelled Today',
      value: stats.cancelledToday,
      icon: '❌',
      bgColor: 'bg-red-50 dark:bg-red-900/30',
      textColor: 'text-red-700 dark:text-red-400',
      borderColor: 'border-red-200 dark:border-red-800',
      iconBg: 'bg-red-100 dark:bg-red-900/50'
    },
    {
      label: 'Earnings Today',
      value: `₹${stats.earningsToday?.toLocaleString('en-IN') || 0}`,
      icon: '💰',
      bgColor: 'bg-amber-50 dark:bg-amber-900/30',
      textColor: 'text-amber-700 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-800',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50'
    }
  ]

  return (
    <div className="w-full overflow-x-hidden">
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 leading-tight break-words">Admin Overview</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed break-words">Marketplace statistics and health metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-5">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`p-4 sm:p-5 lg:p-6 rounded-xl border-2 ${card.bgColor} ${card.borderColor} transition-all duration-200 hover:shadow-lg dark:hover:shadow-gray-900/50 active:scale-[0.98]`}
          >
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                <span className="text-xl sm:text-2xl lg:text-3xl">{card.icon}</span>
              </div>
            </div>
            <p className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 leading-none break-words ${card.textColor}`}>{card.value}</p>
            <p className={`text-xs sm:text-sm font-semibold uppercase tracking-wide leading-tight ${card.textColor} opacity-90 dark:opacity-80`}>{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminOverview

