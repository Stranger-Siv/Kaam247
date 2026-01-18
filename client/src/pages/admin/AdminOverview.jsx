import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config/env'

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        setError(null)

        const token = localStorage.getItem('kaam247_token')
        const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch stats')
        }

        const data = await response.json()
        setStats(data)
      } catch (err) {
        console.error('Error fetching admin stats:', err)
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
      <div>
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-5 bg-gray-200 rounded w-64 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-6 rounded-xl border-2 border-gray-200 bg-gray-50 animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-10 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: '👥',
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      label: 'Online Workers',
      value: stats.onlineWorkers,
      icon: '🟢',
      color: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      label: 'Tasks Today',
      value: stats.tasksToday,
      icon: '📋',
      color: 'bg-purple-50 text-purple-700 border-purple-200'
    },
    {
      label: 'Completed Today',
      value: stats.completedToday,
      icon: '✅',
      color: 'bg-green-50 text-green-700 border-green-200'
    },
    {
      label: 'Cancelled Today',
      value: stats.cancelledToday,
      icon: '❌',
      color: 'bg-red-50 text-red-700 border-red-200'
    },
    {
      label: 'Earnings Today',
      value: `₹${stats.earningsToday?.toLocaleString('en-IN') || 0}`,
      icon: '💰',
      color: 'bg-green-50 text-green-700 border-green-200'
    }
  ]

  return (
    <div className="w-full overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2 break-words">Admin Overview</h1>
        <p className="text-gray-600 break-words">Marketplace statistics and health metrics</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {statCards.map((card, index) => (
          <div
            key={index}
            className={`p-4 sm:p-6 rounded-xl border-2 ${card.color} transition-shadow hover:shadow-md active:scale-95`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl sm:text-2xl">{card.icon}</span>
            </div>
            <p className="text-2xl sm:text-3xl font-bold mb-1 break-words">{card.value}</p>
            <p className="text-xs sm:text-sm font-medium opacity-80 leading-tight">{card.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminOverview

