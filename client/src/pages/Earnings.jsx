import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config/env'

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getEarningsForDate(tasks, date) {
  const dayTasks = tasks.filter((t) => {
    const d = new Date(t.completedAt)
    return isSameDay(d, date)
  })
  const total = dayTasks.reduce((s, t) => s + (t.budget || 0), 0)
  return { total, tasks: dayTasks }
}

function formatDateLabel(date) {
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(dateString) {
  if (!dateString) return ''
  return new Date(dateString).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function Earnings() {
  const { user } = useAuth()
  const [earnings, setEarnings] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    totalTasks: 0,
    tasks: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [viewMonth, setViewMonth] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        setError(null)
        const token = localStorage.getItem('kaam247_token')
        const response = await fetch(`${API_BASE_URL}/api/users/me/earnings`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (!response.ok) throw new Error('Failed to fetch earnings')
        const data = await response.json()
        setEarnings(data.earnings)
      } catch (err) {
        console.error('Error fetching earnings:', err)
        setError(err.message || 'Failed to load earnings')
      } finally {
        setLoading(false)
      }
    }
    fetchEarnings()

    // Listen for task completion to refresh earnings
    const handleTaskCompleted = () => {
      fetchEarnings()
    }

    window.addEventListener('task_completed', handleTaskCompleted)
    window.addEventListener('task_status_changed', handleTaskCompleted)

    return () => {
      window.removeEventListener('task_completed', handleTaskCompleted)
      window.removeEventListener('task_status_changed', handleTaskCompleted)
    }
  }, [user?.id])

  const { total: earningsForSelected, tasks: activityForSelected } = useMemo(
    () => getEarningsForDate(earnings.tasks, selectedDate),
    [earnings.tasks, selectedDate]
  )

  const daysWithEarnings = useMemo(() => {
    const s = new Set()
    earnings.tasks.forEach((t) => {
      const d = new Date(t.completedAt)
      s.add(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`)
    })
    return s
  }, [earnings.tasks])

  const calendarCells = useMemo(() => {
    const y = viewMonth.getFullYear()
    const m = viewMonth.getMonth()
    const first = new Date(y, m, 1)
    const last = new Date(y, m + 1, 0)
    const firstWd = first.getDay()
    const lastDate = last.getDate()
    const cells = []
    for (let i = 0; i < firstWd; i++) cells.push({ empty: true })
    for (let d = 1; d <= lastDate; d++) {
      cells.push({ empty: false, date: new Date(y, m, d), isNextMonth: false })
    }
    const remaining = 42 - cells.length
    for (let i = 0; i < remaining; i++) {
      cells.push({ empty: false, date: new Date(y, m + 1, i + 1), isNextMonth: true })
    }
    return cells
  }, [viewMonth])

  const dayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`

  const goPrevMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
  }
  const goNextMonth = () => {
    setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
  }
  const goToday = () => {
    const n = new Date()
    setSelectedDate(n)
    setViewMonth(new Date(n.getFullYear(), n.getMonth(), 1))
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto w-full px-2 sm:px-6 overflow-x-hidden">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading earnings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto w-full px-2 sm:px-6 overflow-x-hidden">
        <div className="text-center py-12 text-red-600">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Earnings</h1>
        <p className="text-gray-600">View earnings and activity by date</p>
      </div>

      {/* Compact summary */}
      <div className="flex flex-wrap gap-3 sm:gap-4 mb-6 text-sm">
        <span className="text-gray-600">
          Today <span className="font-semibold text-gray-900">₹{earnings.today ?? 0}</span>
        </span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-600">
          This week <span className="font-semibold text-gray-900">₹{earnings.thisWeek ?? 0}</span>
        </span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-600">
          This month <span className="font-semibold text-gray-900">₹{earnings.thisMonth ?? 0}</span>
        </span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-600">
          Total <span className="font-semibold text-gray-900">₹{earnings.total ?? 0}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Calendar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {viewMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={goPrevMonth}
                  className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100"
                  aria-label="Previous month"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={goNextMonth}
                  className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100"
                  aria-label="Next month"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={goToday}
              className="w-full py-2 mb-3 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
            >
              Today
            </button>
            <div className="grid grid-cols-7 gap-0.5 mb-2">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-center text-xs font-medium text-gray-500 py-1">
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {calendarCells.map((cell, i) => {
                if (cell.empty) {
                  return <div key={`e-${i}`} className="aspect-square" />
                }
                const d = cell.date
                const selected = isSameDay(d, selectedDate)
                const hasEarnings = daysWithEarnings.has(dayKey(d))
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSelectedDate(d)
                      if (cell.isNextMonth) setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1))
                    }}
                    className={`
                      aspect-square flex flex-col items-center justify-center rounded-lg text-sm
                      ${cell.isNextMonth ? 'text-gray-400' : 'text-gray-900'}
                      ${selected ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}
                      ${hasEarnings && !selected ? 'font-semibold' : ''}
                    `}
                  >
                    {d.getDate()}
                    {hasEarnings && !selected && (
                      <span className="w-1 h-1 rounded-full bg-green-500 -mt-0.5" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Earnings & Activity for selected date */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-600 mb-1">Earnings on {formatDateLabel(selectedDate)}</p>
            <p className="text-3xl font-bold text-green-600">₹{earningsForSelected}</p>
            <p className="text-xs text-gray-500 mt-1">
              {activityForSelected.length} {activityForSelected.length === 1 ? 'task' : 'tasks'} completed
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Activity on {formatDateLabel(selectedDate)}</h2>
            </div>
            {activityForSelected.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No tasks completed on this day.
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {activityForSelected.map((task) => (
                  <Link
                    key={task.id}
                    to={`/tasks/${task.id}`}
                    className="block p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-gray-900 truncate">{task.title}</h3>
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 shrink-0">
                            {task.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{formatTime(task.completedAt)} · {task.postedBy}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-green-600">₹{task.budget}</p>
                        {task.rating && (
                          <p className="text-xs text-gray-500 flex items-center justify-end gap-0.5">
                            <span className="text-yellow-500">★</span> {task.rating}/5
                          </p>
                        )}
                      </div>
                      <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Earnings
