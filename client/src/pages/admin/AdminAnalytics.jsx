import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../../config/env'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const FunnelColors = ['#3b82f6', '#10b981', '#22c55e', '#ef4444']

function AdminAnalytics() {
  const [data, setData] = useState({
    topPosters: [],
    topWorkers: [],
    bestAreas: [],
    funnel: { posted: 0, accepted: 0, completed: 0, cancelled: 0 }
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch analytics')
      const res = await response.json()
      setData({
        topPosters: res.topPosters || [],
        topWorkers: res.topWorkers || [],
        bestAreas: res.bestAreas || [],
        funnel: res.funnel || { posted: 0, accepted: 0, completed: 0, cancelled: 0 }
      })
    } catch (err) {
      setError(err.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }

  const funnelChartData = [
    { name: 'Posted', value: data.funnel.posted },
    { name: 'Accepted', value: data.funnel.accepted },
    { name: 'Completed', value: data.funnel.completed },
    { name: 'Cancelled', value: data.funnel.cancelled }
  ]

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 leading-tight break-words">
          Advanced analytics
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed break-words">
          Top posters, top workers, best areas, and conversion funnel.
        </p>
      </div>

      {/* Funnel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4">Conversion funnel</h2>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelChartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
              <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--tw-bg-opacity)', borderRadius: 8 }}
                formatter={(value) => [value, 'Count']}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {funnelChartData.map((_, i) => (
                  <Cell key={i} fill={FunnelColors[i % FunnelColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <span className="text-gray-500 dark:text-gray-400">Posted</span>
            <p className="font-bold text-gray-900 dark:text-gray-100">{data.funnel.posted}</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <span className="text-gray-500 dark:text-gray-400">Accepted</span>
            <p className="font-bold text-gray-900 dark:text-gray-100">{data.funnel.accepted}</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <span className="text-gray-500 dark:text-gray-400">Completed</span>
            <p className="font-bold text-gray-900 dark:text-gray-100">{data.funnel.completed}</p>
          </div>
          <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <span className="text-gray-500 dark:text-gray-400">Cancelled</span>
            <p className="font-bold text-gray-900 dark:text-gray-100">{data.funnel.cancelled}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top posters */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Top posters (by spend)</h2>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Name</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Spent</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Tasks</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.topPosters.map((p, i) => (
                  <tr key={p.userId || i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Link to={`/admin/users/${p.userId}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        {p.name ?? '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                      ₹{Number(p.totalSpent || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-gray-600 dark:text-gray-400">{p.count ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.topPosters.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No data</div>
          )}
        </div>

        {/* Top workers */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Top workers (by earnings)</h2>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Name</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Earnings</th>
                  <th className="px-4 py-2 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Tasks</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {data.topWorkers.map((w, i) => (
                  <tr key={w.userId || i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Link to={`/admin/users/${w.userId}`} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                        {w.name ?? '—'}
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-gray-900 dark:text-gray-100">
                      ₹{Number(w.totalEarnings || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right text-sm text-gray-600 dark:text-gray-400">{w.count ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.topWorkers.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No data</div>
          )}
        </div>
      </div>

      {/* Best areas */}
      <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Best performing areas (by task count)</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">City</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Tasks</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Revenue</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {data.bestAreas.map((a, i) => (
                <tr key={a.city || i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-gray-100">{a.city ?? '—'}</td>
                  <td className="px-4 py-3 text-right text-sm text-gray-600 dark:text-gray-400">{a.taskCount ?? 0}</td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900 dark:text-gray-100">₹{Number(a.revenue || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data.bestAreas.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No data</div>
        )}
      </div>
    </div>
  )
}

export default AdminAnalytics
