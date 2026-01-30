import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { apiGet } from '../../utils/api'
import KPICard from '../../components/admin/KPICard'

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
  const [chartsData, setChartsData] = useState(null)
  const [chartPeriod, setChartPeriod] = useState('weekly')
  const [loading, setLoading] = useState(true)
  const [chartsLoading, setChartsLoading] = useState(true)
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

  useEffect(() => {
    const fetchCharts = async () => {
      try {
        setChartsLoading(true)
        const { data: res, error: apiError } = await apiGet(`/api/admin/dashboard/charts?period=${chartPeriod}`)
        if (!apiError && res) setChartsData(res)
      } catch (_) { }
      finally {
        setChartsLoading(false)
      }
    }
    fetchCharts()
  }, [chartPeriod])

  if (loading && !data) {
    return (
      <div className="w-full overflow-x-hidden">
        <div className="mb-6 h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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

  const kpiCards = [
    { label: 'Total Users', value: o.totalUsers ?? 0, icon: '👥', color: 'blue' },
    { label: 'Total Posters', value: o.totalPosters ?? 0, icon: '📤', color: 'indigo' },
    { label: 'Total Workers', value: o.totalWorkers ?? 0, icon: '👷', color: 'cyan' },
    { label: 'Online Workers (live)', value: o.onlineWorkers ?? 0, icon: '🟢', color: 'green' },
    { label: 'Total Tasks Created', value: o.totalTasks ?? 0, icon: '📋', color: 'purple' },
    { label: 'Active Tasks (in progress)', value: o.activeTasks ?? o.ongoingTasks ?? 0, icon: '🔄', color: 'cyan' },
    { label: 'Completed Tasks', value: o.completedTasks ?? 0, icon: '✅', color: 'emerald' },
    { label: 'Cancelled Tasks', value: o.cancelledTasks ?? 0, icon: '❌', color: 'red' },
    { label: "Platform Commission", value: `₹${(o.platformCommissionTotal ?? 0).toLocaleString('en-IN')}`, icon: '💰', color: 'amber' },
    { label: 'Total Payout to Workers', value: `₹${(o.totalPayoutToWorkers ?? o.totalGMV ?? 0).toLocaleString('en-IN')}`, icon: '💵', color: 'green' },
    { label: 'Pending Payouts', value: o.pendingPayouts ?? 0, icon: '⏳', color: 'amber' },
    { label: 'Disputes / Reports (open)', value: o.disputesCount ?? 0, icon: '🚨', color: 'red' },
    { label: "Today's Tasks Created", value: o.tasksToday ?? 0, icon: '📅', color: 'indigo' },
    { label: "Today's Revenue (GMV)", value: `₹${(o.earningsToday ?? 0).toLocaleString('en-IN')}`, icon: '📈', color: 'emerald' }
  ]

  const chartPeriodOptions = [
    { value: 'daily', label: 'Daily (last 30 days)' },
    { value: 'weekly', label: 'Weekly (last 12 weeks)' },
    { value: 'monthly', label: 'Monthly (last 12 months)' }
  ]

  const revenueSeries = (chartsData?.revenueTimeSeries || []).map(({ date, revenue: r }) => ({ date, revenue: r }))
  const tasksMerged = {}
    ; (chartsData?.tasksCreatedTimeSeries || []).forEach(({ date, created }) => {
      if (!tasksMerged[date]) tasksMerged[date] = { date, created: 0, completed: 0, cancelled: 0 }
      tasksMerged[date].created = created
    })
    ; (chartsData?.tasksCompletedTimeSeries || []).forEach(({ date, completed }) => {
      if (!tasksMerged[date]) tasksMerged[date] = { date, created: 0, completed: 0, cancelled: 0 }
      tasksMerged[date].completed = completed
    })
    ; (chartsData?.tasksCancelledTimeSeries || []).forEach(({ date, cancelled }) => {
      if (!tasksMerged[date]) tasksMerged[date] = { date, created: 0, completed: 0, cancelled: 0 }
      tasksMerged[date].cancelled = cancelled
    })
  const tasksSeries = Object.values(tasksMerged).sort((a, b) => String(a.date).localeCompare(String(b.date)))
  const usersSeries = (chartsData?.userGrowthTimeSeries || []).map(({ date, users: u }) => ({ date, users: u }))

  return (
    <div className="w-full overflow-x-hidden space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Admin Dashboard</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">KPIs, real-time insights, and analytics</p>
        </div>
      </div>

      {/* KPI Cards */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Key metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-3 sm:gap-4">
          {kpiCards.map((card, i) => (
            <KPICard key={i} label={card.label} value={card.value} icon={card.icon} color={card.color} />
          ))}
        </div>
      </section>

      {/* Charts - Period filter */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Charts</h2>
          <select
            value={chartPeriod}
            onChange={(e) => setChartPeriod(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm font-medium"
          >
            {chartPeriodOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {chartsLoading ? (
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">Loading charts...</div>
        ) : (
          <div className="space-y-8">
            {/* Revenue over time */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Revenue (GMV) over time</h3>
              <div className="h-64">
                {revenueSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueSeries} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-gray-600 dark:text-gray-400" />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                      <Tooltip formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']} />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center h-full">No revenue data for this period</p>
                )}
              </div>
            </div>

            {/* Tasks: created vs completed vs cancelled */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Tasks: created vs completed vs cancelled</h3>
              <div className="h-64">
                {tasksSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tasksSeries} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="created" stroke="#8b5cf6" strokeWidth={2} name="Created" dot={false} />
                      <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" dot={false} />
                      <Line type="monotone" dataKey="cancelled" stroke="#ef4444" strokeWidth={2} name="Cancelled" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center h-full">No task data for this period</p>
                )}
              </div>
            </div>

            {/* User growth */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">User growth (new users)</h3>
              <div className="h-64">
                {usersSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={usersSeries} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="users" fill="#3b82f6" name="New users" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center h-full">No user growth data for this period</p>
                )}
              </div>
            </div>

            {/* Category performance */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Category performance (task count + revenue)</h3>
              <div className="h-72">
                {tasksByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tasksByCategory} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="category" width={75} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v, name) => [name === 'revenue' ? `₹${Number(v).toLocaleString('en-IN')}` : v, name === 'revenue' ? 'Revenue' : 'Tasks']} />
                      <Legend />
                      <Bar dataKey="count" fill="#8b5cf6" name="Task count" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="revenue" fill="#10b981" name="Revenue (₹)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center h-full">No category data</p>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Tasks by location (table) */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tasks by location (city)</h2>
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

      {/* Users summary */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Users summary</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          <div><p className="text-xs text-gray-500 dark:text-gray-400">Total users</p><p className="text-xl font-bold">{users.total ?? 0}</p></div>
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
            <div><p className="text-xs text-amber-700 dark:text-amber-300">Posting limit (≥5 today)</p><p className="text-xl font-bold">{abuse.usersHittingPostingLimit ?? 0}</p></div>
            <div><p className="text-xs text-amber-700 dark:text-amber-300">Cancellation limit (≥2 today)</p><p className="text-xl font-bold">{abuse.usersHittingCancellationLimit ?? 0}</p></div>
            <div><p className="text-xs text-amber-700 dark:text-amber-300">Report limit (≥3 today)</p><p className="text-xl font-bold">{abuse.usersHittingReportLimit ?? 0}</p></div>
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
