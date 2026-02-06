import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config/env'
import LoginCTA from '../components/LoginCTA'

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getSpentForDate(tasks, date) {
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

function Transactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState({
    total: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    totalTasks: 0,
    tasks: [],
    byCategory: {},
    last7Days: [],
    last30Days: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [transactionsPage, setTransactionsPage] = useState(1)
  const [hasMoreTransactions, setHasMoreTransactions] = useState(false)
  const [loadingMoreTransactions, setLoadingMoreTransactions] = useState(false)

  const [viewMonth, setViewMonth] = useState(() => {
    const n = new Date()
    return new Date(n.getFullYear(), n.getMonth(), 1)
  })
  const [selectedDate, setSelectedDate] = useState(() => new Date())

  const fetchTransactions = useCallback(async (page = 1, append = false) => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    try {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMoreTransactions(true)
      }
      setError(null)
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/users/me/transactions?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch transactions')
      const data = await response.json()
      const pagination = data.pagination || {}
      setHasMoreTransactions(Boolean(pagination.hasMore))
      if (!append) {
        setTransactions(data.transactions || {})
      } else {
        setTransactions(prev => ({
          ...prev,
          tasks: [...(prev.tasks || []), ...(data.transactions?.tasks || [])]
        }))
      }
    } catch (err) {
      setError(err.message || 'Failed to load transactions')
    } finally {
      if (page === 1) {
        setLoading(false)
      } else {
        setLoadingMoreTransactions(false)
      }
    }
  }, [user?.id])

  useEffect(() => {
    fetchTransactions(1, false)

    const handleTaskCompleted = () => {
      setTransactionsPage(1)
      fetchTransactions(1, false)
    }
    window.addEventListener('task_completed', handleTaskCompleted)
    window.addEventListener('task_status_changed', handleTaskCompleted)
    return () => {
      window.removeEventListener('task_completed', handleTaskCompleted)
      window.removeEventListener('task_status_changed', handleTaskCompleted)
    }
  }, [user?.id, fetchTransactions])

  const { total: spentForSelected, tasks: activityForSelected } = useMemo(
    () => getSpentForDate(transactions.tasks, selectedDate),
    [transactions.tasks, selectedDate]
  )

  const daysWithTransactions = useMemo(() => {
    const s = new Set()
    transactions.tasks.forEach((t) => {
      const d = new Date(t.completedAt)
      s.add(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`)
    })
    return s
  }, [transactions.tasks])

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
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 overflow-x-hidden">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading transactions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 overflow-x-hidden">
        <div className="text-center py-12 text-red-600 dark:text-red-400">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (!user?.id) {
    return (
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Transactions</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">View payments made on completed tasks.</p>
        <LoginCTA message="Login to see your transactions" returnUrl="/transactions" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Transactions</h1>
        <p className="text-gray-600 dark:text-gray-400">View all payments made on the app (completed tasks)</p>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-3 sm:gap-4 mb-6 text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          Today <span className="font-semibold text-gray-900 dark:text-gray-100">₹{transactions.today ?? 0}</span>
        </span>
        <span className="text-gray-400 dark:text-gray-600">·</span>
        <span className="text-gray-600 dark:text-gray-400">
          This week <span className="font-semibold text-gray-900 dark:text-gray-100">₹{transactions.thisWeek ?? 0}</span>
        </span>
        <span className="text-gray-400 dark:text-gray-600">·</span>
        <span className="text-gray-600 dark:text-gray-400">
          This month <span className="font-semibold text-gray-900 dark:text-gray-100">₹{transactions.thisMonth ?? 0}</span>
        </span>
        <span className="text-gray-400 dark:text-gray-600">·</span>
        <span className="text-gray-600 dark:text-gray-400">
          Total <span className="font-semibold text-gray-900 dark:text-gray-100">₹{transactions.total ?? 0}</span>
        </span>
      </div>

      {/* By category */}
      {transactions.byCategory && Object.keys(transactions.byCategory).length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">By category</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(transactions.byCategory).map(([cat, amount]) => (
              <div
                key={cat}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <span className="text-sm text-gray-600 dark:text-gray-400">{cat}</span>
                <span className="ml-2 font-semibold text-gray-900 dark:text-gray-100">₹{amount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Calendar */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {viewMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={goPrevMonth}
                  className="p-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Previous month"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={goNextMonth}
                  className="p-1.5 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
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
              className="w-full py-2 mb-3 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50"
            >
              Today
            </button>
            <div className="grid grid-cols-7 gap-0.5 mb-2">
              {WEEKDAYS.map((w) => (
                <div key={w} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
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
                const hasTransactions = daysWithTransactions.has(dayKey(d))
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
                      ${cell.isNextMonth ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-gray-100'}
                      ${selected ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                      ${hasTransactions && !selected ? 'font-semibold' : ''}
                    `}
                  >
                    {d.getDate()}
                    {hasTransactions && !selected && (
                      <span className="w-1 h-1 rounded-full bg-amber-500 dark:bg-amber-400 -mt-0.5" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Spent & Activity for selected date */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Spent on {formatDateLabel(selectedDate)}</p>
            <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">₹{spentForSelected}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {activityForSelected.length} {activityForSelected.length === 1 ? 'task' : 'tasks'} completed
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Activity on {formatDateLabel(selectedDate)}</h2>
            </div>
            {activityForSelected.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No completed tasks on this day.
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {activityForSelected.map((task) => (
                  <Link
                    key={task.id}
                    to={`/tasks/${task.id}`}
                    className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">{task.title}</h3>
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 shrink-0">
                            {task.category}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formatTime(task.completedAt)} · Worker: {task.worker}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">₹{task.budget}</p>
                        {task.rating && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-end gap-0.5">
                            <span className="text-yellow-500 dark:text-yellow-400">★</span> {task.rating}/5
                          </p>
                        )}
                      </div>
                      <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      {hasMoreTransactions && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => {
              const next = transactionsPage + 1
              fetchTransactions(next, true)
              setTransactionsPage(next)
            }}
            disabled={loadingMoreTransactions}
            className="px-6 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 min-h-[44px]"
          >
            {loadingMoreTransactions ? 'Loading...' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}

export default Transactions
