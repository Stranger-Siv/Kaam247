import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { useAvailability } from '../context/AvailabilityContext'
import { useAuth } from '../context/AuthContext'
import { useUserMode } from '../context/UserModeContext'
import StatusBadge from '../components/StatusBadge'
import { API_BASE_URL } from '../config/env'
import { useCategories } from '../hooks/useCategories'
import { fetchActiveTask } from '../utils/stateRecovery'
import TaskCardSkeleton from '../components/TaskCardSkeleton'
import { useSwipeGesture } from '../hooks/useSwipeGesture'
import { usePullToRefresh } from '../hooks/usePullToRefresh'
import SwipeableTaskCard from '../components/SwipeableTaskCard'

const DISTANCE_OPTIONS = [
  { label: 'All', km: 5 },
  { label: 'Within 1 km', km: 1 },
  { label: 'Within 3 km', km: 3 },
  { label: 'Within 5 km', km: 5 }
]

function Tasks() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedDistance, setSelectedDistance] = useState('All')
  const [selectedBudget, setSelectedBudget] = useState('All')
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasActiveTask, setHasActiveTask] = useState(false)
  const [refetchTrigger, setRefetchTrigger] = useState(0)
  const [workerPreferredCategories, setWorkerPreferredCategories] = useState([])
  const [showAllTasksOverride, setShowAllTasksOverride] = useState(false)
  const [clearingPreferences, setClearingPreferences] = useState(false)
  const preferencesAppliedRef = useRef(false)
  const { getSocket } = useSocket()
  const { isOnline, workerLocation } = useAvailability()
  const { user } = useAuth()
  const { userMode } = useUserMode()
  const newTaskHighlightRef = useRef(new Set())
  const { categories: categoriesList } = useCategories()
  const categories = ['All', ...categoriesList]

  // Pull-to-refresh handler
  const handleRefresh = () => {
    setRefetchTrigger(prev => prev + 1)
  }

  // Pull-to-refresh hook
  const pullToRefreshRef = usePullToRefresh(handleRefresh, 80)

  const distances = DISTANCE_OPTIONS.map(d => d.label)
  const budgets = ['All', 'Under ₹500', '₹500 - ₹1000', '₹1000 - ₹2000', 'Above ₹2000']

  const getRadiusKm = () => {
    switch (selectedDistance) {
      case 'Within 1 km': return 1
      case 'Within 3 km': return 3
      case 'Within 5 km': return 5
      default: return 5
    }
  }
  const getBudgetRange = () => {
    switch (selectedBudget) {
      case 'Under ₹500': return { minBudget: null, maxBudget: 500 }
      case '₹500 - ₹1000': return { minBudget: 500, maxBudget: 1000 }
      case '₹1000 - ₹2000': return { minBudget: 1000, maxBudget: 2000 }
      case 'Above ₹2000': return { minBudget: 2000, maxBudget: null }
      default: return { minBudget: null, maxBudget: null }
    }
  }

  // Load worker preferences once (default radius + preferred categories for sorting)
  useEffect(() => {
    if (userMode !== 'worker' || !user?.id || preferencesAppliedRef.current) return
    const token = localStorage.getItem('kaam247_token')
    fetch(`${API_BASE_URL}/api/users/me`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        const prefs = data.user?.workerPreferences
        if (!prefs) return
        preferencesAppliedRef.current = true
        if (Array.isArray(prefs.preferredCategories) && prefs.preferredCategories.length > 0) {
          setWorkerPreferredCategories(prefs.preferredCategories)
        }
        const defaultKm = prefs.defaultRadiusKm
        if (typeof defaultKm === 'number' && defaultKm >= 1 && defaultKm <= 10) {
          const option = DISTANCE_OPTIONS.find(o => o.km === defaultKm) || DISTANCE_OPTIONS.find(o => o.km === 5)
          if (option) setSelectedDistance(option.label)
        }
      })
      .catch(() => { })
  }, [userMode, user?.id])

  // Fetch tasks when location or filters change
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // Worker OFF DUTY: do not fetch/render tasks
        if (userMode === 'worker' && !isOnline) {
          setTasks([])
          setError(null)
          setLoading(false)
          return
        }

        setLoading(true)
        setError(null)

        // REQUIRE LOCATION: Don't fetch tasks if no location
        if (!workerLocation || !workerLocation.lat || !workerLocation.lng) {
          setTasks([])
          setError('Location access is required to view tasks. Please enable location access.')
          setLoading(false)
          return
        }

        const radiusKm = getRadiusKm()
        const { minBudget, maxBudget } = getBudgetRange()
        let url = `${API_BASE_URL}/api/tasks?lat=${workerLocation.lat}&lng=${workerLocation.lng}&radius=${radiusKm}`
        if (selectedCategory && selectedCategory !== 'All') url += `&category=${encodeURIComponent(selectedCategory)}`
        if (minBudget != null) url += `&minBudget=${minBudget}`
        if (maxBudget != null) url += `&maxBudget=${maxBudget}`

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`Failed to fetch tasks: ${response.statusText}`)
        }

        const data = await response.json()

        // Transform backend task format to frontend format
        // Filter to only show tasks within 5km and sort by distance
        const transformedTasks = (data.tasks || [])
          // Hide tasks posted by the current user (don't show your own tasks in worker list)
          .filter(task => {
            if (!user?.id) return true
            // Handle both object format (task.postedBy._id) and string format (task.postedBy)
            const postedById = task.postedBy?._id || task.postedBy
            return String(postedById) !== String(user.id)
          })
          .filter(task => task.distanceKm == null || task.distanceKm <= radiusKm)
          .map((task) => ({
            id: task._id,
            title: task.title,
            description: task.description,
            location: task.location?.area
              ? `${task.location.area}${task.location.city ? `, ${task.location.city}` : ''}`
              : 'Location not specified',
            distance: task.distanceKm !== null && task.distanceKm !== undefined
              ? `${task.distanceKm.toFixed(1)} km away`
              : 'Distance unavailable',
            distanceKm: task.distanceKm,
            budget: `₹${task.budget}`,
            category: task.category,
            time: (task.scheduledAt || task.createdAt)
              ? new Date(task.scheduledAt || task.createdAt).toLocaleString('en-IN', {
                weekday: 'short',
                hour: 'numeric',
                minute: '2-digit'
              })
              : 'Flexible',
            status: task.status === 'SEARCHING' || task.status === 'OPEN' ? 'open' : task.status.toLowerCase()
          }))
          // When worker has preferred categories set, show only those unless "Show all" was clicked
          .filter(task => workerPreferredCategories.length === 0 || showAllTasksOverride || workerPreferredCategories.includes(task.category))
          // Sort by distance (nearest first)
          .sort((a, b) => {
            if (a.distanceKm === null || a.distanceKm === undefined) return 1
            if (b.distanceKm === null || b.distanceKm === undefined) return -1
            return a.distanceKm - b.distanceKm
          })

        setTasks(transformedTasks)
      } catch (err) {
        setError(err.message || 'Failed to load tasks. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [workerLocation, isOnline, userMode, user?.id, selectedCategory, selectedDistance, selectedBudget, refetchTrigger, workerPreferredCategories, showAllTasksOverride])

  // Listen for new tasks via Socket.IO (only when online)
  useEffect(() => {
    if (!isOnline) {
      return
    }

    const socket = getSocket()
    if (!socket || !socket.connected) {
      return
    }

    const handleNewTask = (taskData) => {
      // If worker already has an active task, do not surface new tasks
      if (hasActiveTask) {
        return
      }
      // CRITICAL: Don't show tasks posted by the current user (even if socket sends them)
      if (user?.id && taskData.postedBy) {
        const postedById = taskData.postedBy._id || taskData.postedBy
        if (String(postedById) === String(user.id)) {
          return // Skip own tasks
        }
      }
      // Convert backend task format to frontend format
      const newTask = {
        id: taskData.taskId,
        title: taskData.title,
        description: 'New task available',
        location: taskData.location?.area
          ? `${taskData.location.area}${taskData.location.city ? `, ${taskData.location.city}` : ''}`
          : 'Location not specified',
        distance: taskData.distanceKm !== null && taskData.distanceKm !== undefined
          ? `${taskData.distanceKm} km away`
          : 'Distance unavailable',
        distanceKm: taskData.distanceKm,
        budget: `₹${taskData.budget}`,
        category: taskData.category,
        time: 'Just now',
        status: 'open',
        isNew: true
      }

      // Add to top of list (maintain sort by distance if available)
      setTasks(prev => {
        const updated = [newTask, ...prev]
        // Sort by distance if available
        return updated.sort((a, b) => {
          if (a.distanceKm === null || a.distanceKm === undefined) return 1
          if (b.distanceKm === null || b.distanceKm === undefined) return -1
          return a.distanceKm - b.distanceKm
        })
      })

      // Mark for highlight
      newTaskHighlightRef.current.add(taskData.taskId)

      // Remove highlight after 3 seconds
      setTimeout(() => {
        newTaskHighlightRef.current.delete(taskData.taskId)
        setTasks(prev =>
          prev.map(task =>
            task.id === taskData.taskId
              ? { ...task, isNew: false }
              : task
          )
        )
      }, 3000)
    }

    const handleRemoveTask = (data) => {
      // DATA CONSISTENCY: Remove task from list when accepted by another worker
      setTasks(prev => prev.filter(task => task.id !== data.taskId))
    }

    const handleTaskStatusChanged = () => {
      setRefetchTrigger(prev => prev + 1)
    }

    socket.on('new_task', handleNewTask)
    socket.on('remove_task', handleRemoveTask)

    // DATA CONSISTENCY: Listen for task status changes
    window.addEventListener('task_status_changed', handleTaskStatusChanged)
    window.addEventListener('task_cancelled', handleTaskStatusChanged)

    return () => {
      socket.off('new_task', handleNewTask)
      socket.off('remove_task', handleRemoveTask)
      window.removeEventListener('task_status_changed', handleTaskStatusChanged)
      window.removeEventListener('task_cancelled', handleTaskStatusChanged)
    }
  }, [isOnline, getSocket, workerLocation, hasActiveTask])

  // STATE RECOVERY: Page load recovery - fetch active task
  useEffect(() => {
    if (!user?.id) return

    const recoverState = async () => {
      try {
        const activeTask = await fetchActiveTask()
        setHasActiveTask(Boolean(activeTask && activeTask.hasActiveTask))
      } catch (error) { }
    }

    recoverState()
  }, [user?.id])

  useEffect(() => {
    const handleReconnect = () => setRefetchTrigger(prev => prev + 1)
    window.addEventListener('socket_reconnected', handleReconnect)
    return () => window.removeEventListener('socket_reconnected', handleReconnect)
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isOnline) setRefetchTrigger(prev => prev + 1)
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [isOnline])

  useEffect(() => {
    const handleRefetch = (event) => {
      const { type } = event.detail || {}
      if (type === 'task_updated' || type === 'task_status_changed' || type === 'task_cancelled') {
        setRefetchTrigger(prev => prev + 1)
      }
    }
    window.addEventListener('refetch_required', handleRefetch)
    return () => window.removeEventListener('refetch_required', handleRefetch)
  }, [])

  const filteredTasks = tasks

  // Worker OFF DUTY: hide task feed completely
  if (userMode === 'worker' && !isOnline) {
    return (
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 overflow-x-hidden">
        <div className="mb-6 sm:mb-8 lg:mb-10 w-full">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 leading-tight break-words">Available Tasks</h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 leading-relaxed break-words">Go online (ON DUTY) to see tasks near you</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-12 sm:p-16 lg:p-20 text-center border border-gray-200 dark:border-gray-700">
          <svg className="w-14 h-14 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4 sm:mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2" />
          </svg>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 leading-tight">You are OFF DUTY</h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">Turn ON DUTY to start receiving and viewing tasks.</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={pullToRefreshRef}
      className="max-w-7xl mx-auto w-full px-4 sm:px-6 overflow-x-hidden"
      style={{ touchAction: 'pan-y' }}
    >

      {/* Header */}
      <div className="mb-6 sm:mb-8 lg:mb-10 w-full">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 leading-tight break-words">Available Tasks</h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 leading-relaxed break-words">Find work near you</p>
        {userMode === 'worker' && workerPreferredCategories.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {showAllTasksOverride ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400">Showing all tasks.</p>
                <button
                  type="button"
                  onClick={() => { setShowAllTasksOverride(false); setRefetchTrigger(prev => prev + 1) }}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Use my preferences again
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Showing only: {workerPreferredCategories.join(', ')}.
                </p>
                <button
                  type="button"
                  onClick={() => { setShowAllTasksOverride(true); setRefetchTrigger(prev => prev + 1) }}
                  className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Show all tasks
                </button>
                <span className="text-gray-400 dark:text-gray-500">|</span>
                <button
                  type="button"
                  onClick={async () => {
                    if (clearingPreferences) return
                    setClearingPreferences(true)
                    try {
                      const token = localStorage.getItem('kaam247_token')
                      const res = await fetch(`${API_BASE_URL}/api/users/me`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                        body: JSON.stringify({ workerPreferences: { preferredCategories: [], defaultRadiusKm: 5 } })
                      })
                      if (res.ok) {
                        setWorkerPreferredCategories([])
                        setShowAllTasksOverride(true)
                        setRefetchTrigger(prev => prev + 1)
                      }
                    } finally {
                      setClearingPreferences(false)
                    }
                  }}
                  disabled={clearingPreferences}
                  className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:underline disabled:opacity-50"
                >
                  {clearingPreferences ? 'Clearing...' : 'Clear saved preferences'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-gray-900/50 sm:shadow-md p-4 sm:p-5 lg:p-6 mb-5 sm:mb-6 lg:mb-8 border border-gray-200 dark:border-gray-700 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
          {/* Category Filter */}
          <div className="flex flex-col gap-2">
            <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Category</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-11 sm:h-12 w-full px-3 sm:px-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base touch-manipulation transition-colors"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Distance Filter */}
          <div className="flex flex-col gap-2">
            <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Distance</span>
            <select
              value={selectedDistance}
              onChange={(e) => setSelectedDistance(e.target.value)}
              className="h-11 sm:h-12 w-full px-3 sm:px-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base touch-manipulation transition-colors"
            >
              {distances.map((dist) => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          {/* Budget Filter */}
          <div className="flex flex-col gap-2">
            <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Budget</span>
            <select
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(e.target.value)}
              className="h-11 sm:h-12 w-full px-3 sm:px-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base touch-manipulation transition-colors"
            >
              {budgets.map((budget) => (
                <option key={budget} value={budget}>{budget}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 w-full">
          {[...Array(6)].map((_, i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 w-full">
          {filteredTasks.map((task) => (
            <SwipeableTaskCard
              key={task.id}
              task={task}
              onTaskAccepted={(taskId) => {
                // Remove task from list when accepted
                setTasks(prev => prev.filter(t => t.id !== taskId))
              }}
              onTaskRemoved={(taskId) => {
                setTasks(prev => prev.filter(t => t.id !== taskId))
              }}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-12 sm:p-16 lg:p-20 text-center border border-gray-200 dark:border-gray-700">
          {error ? (
            <>
              <svg className="h-14 w-14 sm:h-16 sm:w-16 text-red-300 dark:text-red-600 mx-auto mb-4 sm:mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 leading-tight">Error loading tasks</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-7 leading-relaxed">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 dark:bg-blue-500 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 active:scale-[0.98] min-h-[44px] touch-manipulation"
              >
                Retry
              </button>
            </>
          ) : (
            <>
              <svg className="w-14 h-14 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4 sm:mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 leading-tight">No tasks near you right now</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-7 leading-relaxed">Check back later or try adjusting your filters to see more options.</p>
              <button
                onClick={() => {
                  setSelectedCategory('All')
                  setSelectedDistance('All')
                  setSelectedBudget('All')
                }}
                className="inline-flex items-center px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 dark:bg-blue-500 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 active:scale-[0.98] min-h-[44px] touch-manipulation"
              >
                Clear Filters
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default Tasks

