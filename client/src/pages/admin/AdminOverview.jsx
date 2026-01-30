import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiGet } from '../../utils/api'

const statusLabels = {
  OPEN: 'Open',
  SEARCHING: 'Searching',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  CANCELLED_BY_POSTER: 'Cancelled by Poster',
  CANCELLED_BY_WORKER: 'Cancelled by Worker',
  CANCELLED_BY_ADMIN: 'Cancelled by Admin'
}

function AdminOverview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const stopPollingRef = useRef(false)

  useEffect(() => {
    const fetchDashboard = async () => {
      if (stopPollingRef.current) return
      try {
        setLoading(true)
        setError(null)
        const { data: res, error: apiError } = await apiGet('/api/admin/dashboard')
        if (apiError) {
          if (apiError.includes('(401)') || apiError.includes('(403)')) stopPollingRef.current = true
          setError(apiError || 'Failed to load dashboard')
          return
        }
        setData(res)
      } catch (err) {
        setError(err.message || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
    const intervalId = setInterval(fetchDashboard, 10000)
    const handleRefresh = () => fetchDashboard()
    window.addEventListener('admin_stats_refresh', handleRefresh)
    return () => {
      clearInterval(intervalId)
      window.removeEventListener('admin_stats_refresh', handleRefresh)
    }
  }, [])

  if (loading && !data) {
    return (
      <div className="w-full overflow-x-hidden">
        <div className="mb-6 h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 animate-pulse h-28" />
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

  const o = data?.overview || {}
  const tasksByStatus = data?.tasksByStatus || {}
  const tasksByCategory = data?.tasksByCategory || []
  const tasksByLocation = data?.tasksByLocation || []
  const revenue = data?.revenue || {}
  const users = data?.users || {}
  const recentTasks = data?.recentTasks || []
  const recentUsers = data?.recentUsers || []
  const abuse = data?.abuseMetrics || {}

  const overviewCards = [
    { label: 'Total Users', value: o.totalUsers ?? 0, icon: '👥', color: 'blue' },
    { label: 'Online Workers', value: o.onlineWorkers ?? 0, icon: '🟢', color: 'green' },
    { label: 'Total Tasks', value: o.totalTasks ?? 0, icon: '📋', color: 'purple' },
    { label: 'Tasks Today', value: o.tasksToday ?? 0, icon: '📅', color: 'indigo' },
    { label: 'Pending (Open + Searching)', value: o.pendingTasks ?? 0, icon: '⏳', color: 'yellow' },
    { label: 'Ongoing (Accepted + In Progress)', value: o.ongoingTasks ?? 0, icon: '🔄', color: 'cyan' },
    { label: 'Completed (all time)', value: o.completedTasks ?? 0, icon: '✅', color: 'emerald' },
    { label: 'Completed Today', value: o.completedToday ?? 0, icon: '✔️', color: 'teal' },
    { label: 'Cancelled (all time)', value: o.cancelledTasks ?? 0, icon: '❌', color: 'red' },
    { label: 'Cancelled Today', value: o.cancelledToday ?? 0, icon: '🚫', color: 'rose' },
    { label: 'Earnings Today (GMV)', value: `₹${(o.earningsToday ?? 0).toLocaleString('en-IN')}`, icon: '💰', color: 'amber' },
    { label: 'Total GMV (all time)', value: `₹${(o.totalGMV ?? 0).toLocaleString('en-IN')}`, icon: '💵', color: 'lime' }
  ]

  const colorClasses = {
    blue: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-400',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400',
    cyan: 'bg-cyan-50 dark:bg-cyan-900/30 border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-400',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400',
    teal: 'bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-400',
    red: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
    rose: 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400',
    amber: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400',
    lime: 'bg-lime-50 dark:bg-lime-900/30 border-lime-200 dark:border-lime-800 text-lime-700 dark:text-lime-400'
  }

  return (
    <div className="w-full overflow-x-hidden space-y-8">
      <div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Admin Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">All platform metrics, tasks, users, locations & revenue</p>
      </div>

      {/* Overview cards */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 sm:gap-4">
          {overviewCards.map((card, i) => (
            <div key={i} className={`p-4 sm:p-5 rounded-xl border-2 ${colorClasses[card.color] || colorClasses.blue}`}>
              <p className="text-2xl sm:text-3xl font-bold mb-1">{card.value}</p>
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide opacity-90">{card.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Revenue */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue / GMV (completed task value)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Total (all time)</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">₹{(revenue.totalGMV ?? 0).toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">This month</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">₹{(revenue.thisMonth ?? 0).toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">This week</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">₹{(revenue.thisWeek ?? 0).toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase">Today</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">₹{(revenue.today ?? 0).toLocaleString('en-IN')}</p>
          </div>
        </div>
      </section>

      {/* Tasks by status */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tasks by status</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-2 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="text-right py-2 font-semibold text-gray-700 dark:text-gray-300">Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(tasksByStatus).map(([status, count]) => (
                <tr key={status} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 text-gray-900 dark:text-gray-100">{statusLabels[status] || status}</td>
                  <td className="py-2 text-right font-medium">{count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tasks by category */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tasks by category</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-2 font-semibold text-gray-700 dark:text-gray-300">Category</th>
                <th className="text-right py-2 font-semibold text-gray-700 dark:text-gray-300">Count</th>
              </tr>
            </thead>
            <tbody>
              {tasksByCategory.map(({ category, count }, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 text-gray-900 dark:text-gray-100">{category}</td>
                  <td className="py-2 text-right font-medium">{count}</td>
                </tr>
              ))}
              {tasksByCategory.length === 0 && (
                <tr><td colSpan={2} className="py-4 text-center text-gray-500">No data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Tasks by location (city) */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tasks by location (city) – where we get more tasks</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-2 font-semibold text-gray-700 dark:text-gray-300">City</th>
                <th className="text-right py-2 font-semibold text-gray-700 dark:text-gray-300">Task count</th>
              </tr>
            </thead>
            <tbody>
              {tasksByLocation.map(({ city, count }, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 text-gray-900 dark:text-gray-100">{city || 'Unknown'}</td>
                  <td className="py-2 text-right font-medium">{count}</td>
                </tr>
              ))}
              {tasksByLocation.length === 0 && (
                <tr><td colSpan={2} className="py-4 text-center text-gray-500">No location data</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Users summary */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Users summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Total users</p><p className="text-xl font-bold">{users.total ?? 0}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Admins</p><p className="text-xl font-bold">{users.admins ?? 0}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Active</p><p className="text-xl font-bold text-green-600">{users.active ?? 0}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Blocked</p><p className="text-xl font-bold text-amber-600">{users.blocked ?? 0}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Banned</p><p className="text-xl font-bold text-red-600">{users.banned ?? 0}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">New today</p><p className="text-xl font-bold">{users.newToday ?? 0}</p></div>
          <div><p className="text-xs text-gray-500 dark:text-gray-400">New this week</p><p className="text-xl font-bold">{users.newThisWeek ?? 0}</p></div>
        </div>
      </section>

      {/* Abuse metrics */}
      {(abuse.usersHittingPostingLimit > 0 || abuse.usersHittingCancellationLimit > 0 || abuse.usersHittingReportLimit > 0) && (
        <section className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-4">Abuse / limits (today)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><p className="text-xs text-amber-700 dark:text-amber-300">Users hitting posting limit (≥5 today)</p><p className="text-xl font-bold">{abuse.usersHittingPostingLimit ?? 0}</p></div>
            <div><p className="text-xs text-amber-700 dark:text-amber-300">Users hitting cancellation limit (≥2 today)</p><p className="text-xl font-bold">{abuse.usersHittingCancellationLimit ?? 0}</p></div>
            <div><p className="text-xs text-amber-700 dark:text-amber-300">Users hitting report limit (≥3 today)</p><p className="text-xl font-bold">{abuse.usersHittingReportLimit ?? 0}</p></div>
          </div>
        </section>
      )}

      {/* Recent tasks */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent tasks (last 30)</h2>
          <Link to="/admin/tasks" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-2 font-semibold text-gray-700 dark:text-gray-300">Title</th>
                <th className="text-left py-2 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="text-left py-2 font-semibold text-gray-700 dark:text-gray-300">Budget</th>
                <th className="text-left py-2 font-semibold text-gray-700 dark:text-gray-300">City</th>
                <th className="text-left py-2 font-semibold text-gray-700 dark:text-gray-300">Created</th>
                <th className="text-left py-2 font-semibold text-gray-700 dark:text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentTasks.slice(0, 15).map((t) => (
                <tr key={t._id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 text-gray-900 dark:text-gray-100 max-w-[180px] truncate">{t.title}</td>
                  <td className="py-2">{t.status}</td>
                  <td className="py-2">₹{t.budget?.toLocaleString('en-IN')}</td>
                  <td className="py-2">{t.location?.city || '—'}</td>
                  <td className="py-2 text-gray-600 dark:text-gray-400">{t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="py-2">
                    <Link to={`/admin/tasks/${t._id}`} className="text-blue-600 dark:text-blue-400 hover:underline">View</Link>
                  </td>
                </tr>
              ))}
              {recentTasks.length === 0 && (
                <tr><td colSpan={6} className="py-4 text-center text-gray-500">No tasks</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Recent users */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent users (last 20)</h2>
          <Link to="/admin/users" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <th className="text-left py-2 font-semibold text-gray-700 dark:text-gray-300">Name</th>
                <th className="text-left py-2 font-semibold text-gray-700 dark:text-gray-300">Email / Phone</th>
                <th className="text-left py-2 font-semibold text-gray-700 dark:text-gray-300">Status</th>
                <th className="text-left py-2 font-semibold text-gray-700 dark:text-gray-300">Joined</th>
                <th className="text-left py-2 font-semibold text-gray-700 dark:text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.slice(0, 15).map((u) => (
                <tr key={u._id} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="py-2 text-gray-900 dark:text-gray-100">{u.name}</td>
                  <td className="py-2 text-gray-600 dark:text-gray-400">{u.email || u.phone || '—'}</td>
                  <td className="py-2">{u.status || 'active'}</td>
                  <td className="py-2 text-gray-600 dark:text-gray-400">{u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-IN') : '—'}</td>
                  <td className="py-2">
                    <Link to={`/admin/users/${u._id}`} className="text-blue-600 dark:text-blue-400 hover:underline">View</Link>
                  </td>
                </tr>
              ))}
              {recentUsers.length === 0 && (
                <tr><td colSpan={5} className="py-4 text-center text-gray-500">No users</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default AdminOverview
