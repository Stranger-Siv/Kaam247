import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUserMode } from '../context/UserModeContext'
import StatusBadge from '../components/StatusBadge'
import { API_BASE_URL } from '../config/env'

function Activity() {
  const { user } = useAuth()
  const { userMode } = useUserMode()
  // Set initial tab based on mode: workers start with 'accepted', posters with 'posted'
  const [activeTab, setActiveTab] = useState(userMode === 'worker' ? 'accepted' : 'posted')
  const [activity, setActivity] = useState({
    posted: [],
    accepted: [],
    completed: [],
    cancelled: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // DATA CONSISTENCY: Fetch activity - always fresh from backend, no duplicates
  const fetchActivity = async () => {
    if (!user?.id) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/users/me/activity`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch activity')
      }

      const data = await response.json()

      // DATA CONSISTENCY: Ensure no duplicates by using unique task IDs
      const deduplicatedActivity = {
        posted: data.activity.posted.filter((task, index, self) =>
          index === self.findIndex(t => t.id === task.id || t._id === task._id || t._id === task.id)
        ),
        accepted: data.activity.accepted.filter((task, index, self) =>
          index === self.findIndex(t => t.id === task.id || t._id === task._id || t._id === task.id)
        ),
        completed: data.activity.completed.filter((task, index, self) =>
          index === self.findIndex(t => t.id === task.id || t._id === task._id || t._id === task.id)
        ),
        cancelled: data.activity.cancelled.filter((task, index, self) =>
          index === self.findIndex(t => t.id === task.id || t._id === task._id || t._id === task.id)
        )
      }

      // MODE FILTERING:
      // - In poster mode: show only poster-side activity
      // - In worker mode: show only worker-side activity
      const modeRole = userMode === 'worker' ? 'Worker' : 'Poster'
      const filteredActivity = {
        posted: deduplicatedActivity.posted.filter(task => !task.role || task.role === modeRole),
        accepted: deduplicatedActivity.accepted.filter(task => !task.role || task.role === modeRole),
        completed: deduplicatedActivity.completed.filter(task => !task.role || task.role === modeRole),
        cancelled: deduplicatedActivity.cancelled.filter(task => !task.role || task.role === modeRole)
      }

      setActivity(filteredActivity)
    } catch (err) {
      console.error('Error fetching activity:', err)
      setError(err.message || 'Failed to load activity')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActivity()

    // DATA CONSISTENCY: Listen for task status changes to refresh activity
    const handleTaskStatusChange = () => {
      fetchActivity()
    }

    const handleTaskCompleted = () => {
      fetchActivity()
    }

    const handleTaskCancelled = () => {
      fetchActivity()
    }

    const handleTaskRated = () => {
      fetchActivity()
    }

    window.addEventListener('task_status_changed', handleTaskStatusChange)
    window.addEventListener('task_completed', handleTaskCompleted)
    window.addEventListener('task_cancelled', handleTaskCancelled)
    window.addEventListener('task_rated', handleTaskRated)

    return () => {
      window.removeEventListener('task_status_changed', handleTaskStatusChange)
      window.removeEventListener('task_completed', handleTaskCompleted)
      window.removeEventListener('task_cancelled', handleTaskCancelled)
      window.removeEventListener('task_rated', handleTaskRated)
    }
  }, [user?.id])


  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  // Tabs depend on current mode:
  // - Poster: focus on posted-side lifecycle (Posted, Completed, Cancelled)
  // - Worker: focus on worker-side lifecycle (Accepted, Completed, Cancelled)
  const baseTabs = [
    { id: 'posted', label: 'Posted Tasks', count: activity.posted.length },
    { id: 'accepted', label: 'Accepted Tasks', count: activity.accepted.length },
    { id: 'completed', label: 'Completed', count: activity.completed.length },
    { id: 'cancelled', label: 'Cancelled', count: activity.cancelled.length }
  ]

  const tabs = userMode === 'worker'
    ? baseTabs.filter(tab => tab.id !== 'posted')   // Workers don't see posted tasks tab
    : baseTabs.filter(tab => tab.id !== 'accepted') // Posters don't see accepted tasks tab

  // Ensure activeTab is valid for current mode - switch to first available tab if needed
  useEffect(() => {
    const availableTabIds = tabs.map(t => t.id)
    if (!availableTabIds.includes(activeTab)) {
      setActiveTab(availableTabIds[0] || 'completed')
    }
  }, [userMode, tabs.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const getCurrentTasks = () => {
    switch (activeTab) {
      case 'posted':
        return activity.posted
      case 'accepted':
        return activity.accepted
      case 'completed':
        return activity.completed
      case 'cancelled':
        return activity.cancelled
      default:
        return []
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading activity...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6">
        <div className="text-center py-12 text-red-600">
          <p>{error}</p>
        </div>
      </div>
    )
  }

  const currentTasks = getCurrentTasks()

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 overflow-x-hidden">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 mb-1 sm:mb-2 break-words">Activity History</h1>
        <p className="text-sm sm:text-base text-gray-600 break-words">View all your tasks and activities</p>
      </div>

      {/* Tabs - Mobile Scrollable (contained) */}
      <div className="bg-white rounded-none sm:rounded-lg shadow-sm border-0 sm:border border-gray-100 mb-4 sm:mb-6 overflow-hidden w-full">
        <div className="flex overflow-x-auto scrollbar-hide w-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex-shrink-0 touch-manipulation ${activeTab === tab.id
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <span className="block sm:inline">{tab.label}</span>
              <span className="ml-1 sm:ml-2 text-xs">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      {currentTasks.length === 0 ? (
        <div className="bg-white rounded-none sm:rounded-xl shadow-sm border-0 sm:border border-gray-100 p-16 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-600 mb-2 font-medium">No {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} yet</p>
          <p className="text-sm text-gray-500">Your {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} will appear here</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4 w-full">
          {currentTasks.map((task) => (
            <Link
              key={task.id}
              to={`/tasks/${task.id}`}
              className="group block bg-white rounded-none sm:rounded-xl shadow-sm border-2 border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 p-4 sm:p-6 active:bg-gray-50 w-full overflow-hidden"
            >
              {/* Title and Badges Row */}
              <div className="flex items-start justify-between gap-2 sm:gap-3 mb-3 w-full min-w-0">
                {/* Title on left - wraps if needed */}
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors flex-1 min-w-0 break-words pr-2">
                  {task.title}
                </h3>

                {/* Badges/Buttons on right - no wrap */}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  <StatusBadge status={task.status} />
                  <span className="inline-flex items-center px-2 sm:px-2.5 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap">
                    {task.role}
                  </span>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              {/* Category and Price - wraps on mobile */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 w-full">
                <span className="inline-flex items-center px-2 sm:px-2.5 py-1 bg-gray-50 text-gray-700 rounded-md text-xs font-medium whitespace-nowrap">
                  {task.category}
                </span>
                <span className="font-semibold text-gray-900 text-sm sm:text-base whitespace-nowrap">₹{task.budget}</span>
              </div>

              {/* Date and Rating - wraps on mobile */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-gray-500 w-full">
                <span className="whitespace-nowrap">{formatDate(task.date)}</span>
                {task.role === 'Worker' && task.rating && (
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <svg className="w-3.5 h-3.5 text-yellow-400 fill-current flex-shrink-0" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {task.rating}/5
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default Activity

