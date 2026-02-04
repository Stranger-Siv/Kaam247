import { useEffect, useRef, useState } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { apiGet } from '../../utils/api'

const REFRESH_MS = 30 * 60 * 1000 // 30 minutes
const BLUE = '#2563eb'
const GREEN = '#16a34a'
const RED = '#dc2626'
const SLATE = '#64748b'

function MetricCard({ label, value, target, targetLabel, unit, goodWhenAbove, goodWhenBelow, compareValue }) {
  const raw = compareValue !== undefined ? compareValue : value
  const met = target != null && typeof target !== 'object'
    ? (goodWhenAbove ? raw >= target : goodWhenBelow ? raw <= target : raw >= target)
    : null
  const rangeMet = typeof target === 'object' && target != null && target.min != null && target.max != null
    ? raw >= target.min && raw <= target.max
    : null
  const displayTarget = targetLabel ?? (target != null && typeof target !== 'object' ? `Target: ${target}${unit || ''}` : '')
  const showMet = rangeMet !== null ? rangeMet : met
  return (
    <div className="rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 truncate">{label}</p>
      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}{unit || ''}</p>
      {displayTarget && (
        <p className={`text-sm mt-1 font-medium ${showMet ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {displayTarget} {showMet ? '✓' : '✗'}
        </p>
      )}
    </div>
  )
}

function PilotDashboard() {
  const [data, setData] = useState(null)
  const [week, setWeek] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const stopRef = useRef(false)

  const fetchData = async () => {
    if (stopRef.current) return
    try {
      setLoading(true)
      setError(null)
      const { data: res, error: apiError } = await apiGet(`/api/admin/pilot-dashboard?week=${week}`)
      if (apiError) {
        if (apiError.includes('(401)') || apiError.includes('(403)')) stopRef.current = true
        setError(apiError)
        return
      }
      setData(res)
    } catch (err) {
      setError(err.message || 'Failed to load pilot dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, REFRESH_MS)
    return () => clearInterval(interval)
  }, [week])

  const exportJSON = () => {
    if (!data) return
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pilot-dashboard-week-${week}-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportCSV = () => {
    if (!data) return
    const rows = [
      ['Metric', 'Value', 'Target'],
      ['WAU', data.metrics?.wau ?? '', data.metrics?.wauTarget ?? '100+'],
      ['Tasks Posted (week)', data.metrics?.tasksPostedThisWeek ?? '', '3-5/day'],
      ['Completion Rate %', data.metrics?.taskCompletionRate ?? '', '>70%'],
      ['Avg Time to Accept (h)', data.metrics?.avgTimeToAcceptHours ?? '', '<2'],
      ['Repeat User Rate %', data.metrics?.repeatUserRate ?? '', '>40%'],
      ['Health Score', data.healthScore ?? '', '0-100']
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pilot-dashboard-week-${week}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading && !data) {
    return (
      <div className="p-4 sm:p-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  const m = data?.metrics || {}
  const lastUpdated = data?.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : '—'

  const pieDataCorrect = [
    { name: 'Posters', value: data?.userType?.posters ?? 0, color: BLUE },
    { name: 'Doers', value: data?.userType?.doers ?? 0, color: GREEN }
  ].filter((d) => d.value > 0)

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header: title, week selector, last updated, export */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Pilot Success Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Last updated: {lastUpdated}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            Week
            <select
              value={week}
              onChange={(e) => setWeek(Number(e.target.value))}
              className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm"
            >
              {[1, 2, 3, 4].map((w) => (
                <option key={w} value={w}>Week {w}</option>
              ))}
            </select>
          </label>
          <button
            onClick={fetchData}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Refresh
          </button>
          <div className="flex gap-2">
            <button
              onClick={exportJSON}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Export JSON
            </button>
            <button
              onClick={exportCSV}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* Top row: 5 KPI cards */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Key metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <MetricCard
            label="Weekly Active Users (WAU)"
            value={m.wau ?? 0}
            target={m.wauTarget ?? 100}
            goodWhenAbove
          />
          <MetricCard
            label="Tasks Posted This Week"
            value={m.tasksPostedThisWeek ?? 0}
            target={m.tasksPerDayTarget ? { min: 3, max: 5 } : null}
            targetLabel={m.tasksPerDayTarget ? 'Target: 3–5/day' : null}
            compareValue={m.tasksPerDayTarget ? (m.tasksPostedThisWeek ?? 0) / 7 : undefined}
          />
          <MetricCard
            label="Task Completion Rate %"
            value={m.taskCompletionRate ?? 0}
            target={m.completionTarget ?? 70}
            unit="%"
            goodWhenAbove
          />
          <MetricCard
            label="Avg Time to Accept"
            value={m.avgTimeToAcceptHours ?? 0}
            target={m.avgTimeToAcceptTarget ?? 2}
            unit="h"
            goodWhenBelow
          />
          <MetricCard
            label="Repeat User Rate %"
            value={m.repeatUserRate ?? 0}
            target={m.repeatUserTarget ?? 40}
            unit="%"
            goodWhenAbove
          />
        </div>
      </section>

      {/* Middle row: 3 charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Weekly Growth (last 4 weeks)</h3>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.weeklyGrowth || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                <XAxis dataKey="weekLabel" tick={{ fontSize: 12 }} stroke={SLATE} />
                <YAxis tick={{ fontSize: 12 }} stroke={SLATE} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--tw-bg-opacity)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--tw-text-opacity)' }}
                />
                <Legend />
                <Line type="monotone" dataKey="users" name="Users" stroke={BLUE} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="tasksPosted" name="Tasks Posted" stroke={GREEN} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="tasksCompleted" name="Tasks Completed" stroke="#ca8a04" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Task Categories (top 5)</h3>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.categories || []} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-600" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke={SLATE} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} stroke={SLATE} />
                <Tooltip />
                <Bar dataKey="count" name="Tasks" fill={BLUE} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">User Type (Posters vs Doers) — target 1:3</h3>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieDataCorrect}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieDataCorrect.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Bottom row: Alerts + Health Score */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Alerts</h3>
          <ul className="space-y-2">
            {(data?.alerts || []).length === 0 ? (
              <li className="text-sm text-green-600 dark:text-green-400">No issues detected.</li>
            ) : (
              data.alerts.map((a, i) => (
                <li
                  key={i}
                  className={`text-sm p-2 rounded-lg ${a.severity === 'high' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300'}`}
                >
                  {a.message}
                </li>
              ))
            )}
          </ul>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex flex-col items-center justify-center">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Health Score</h3>
          <p className="text-4xl sm:text-5xl font-bold" style={{ color: data?.healthScore >= 60 ? GREEN : data?.healthScore >= 40 ? '#ca8a04' : RED }}>
            {data?.healthScore ?? 0}/100
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Completion 40% · Growth 30% · Satisfaction 30%</p>
        </div>
      </section>
    </div>
  )
}

export default PilotDashboard
