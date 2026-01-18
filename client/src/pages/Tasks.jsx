import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import { useAvailability } from '../context/AvailabilityContext'
import { useAuth } from '../context/AuthContext'
import StatusBadge from '../components/StatusBadge'
import { API_BASE_URL } from '../config/env'
import { fetchActiveTask } from '../utils/stateRecovery'

function Tasks() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedDistance, setSelectedDistance] = useState('All')
  const [selectedBudget, setSelectedBudget] = useState('All')
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { getSocket } = useSocket()
  const { isOnline, workerLocation } = useAvailability()
  const { user } = useAuth()
  const newTaskHighlightRef = useRef(new Set())

  const categories = ['All', 'Cleaning', 'Delivery', 'Helper / Labour', 'Tutor / Mentor', 'Tech Help', 'Errands']
  const distances = ['All', 'Within 1 km', 'Within 3 km', 'Within 5 km', 'Within 10 km']
  const budgets = ['All', 'Under ₹500', '₹500 - ₹1000', '₹1000 - ₹2000', 'Above ₹2000']

  // Fetch tasks from API on component mount and when location changes
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)
        setError(null)

        // REQUIRE LOCATION: Don't fetch tasks if no location
        if (!workerLocation || !workerLocation.lat || !workerLocation.lng) {
          setTasks([])
          setError('Location access is required to view tasks. Please enable location access.')
          setLoading(false)
          return
        }

        // Build query string with location (REQUIRED - 5km radius)
        const url = `${API_BASE_URL}/api/tasks?lat=${workerLocation.lat}&lng=${workerLocation.lng}&radius=5`

        const response = await fetch(url)

        if (!response.ok) {
          throw new Error(`Failed to fetch tasks: ${response.statusText}`)
        }

        const data = await response.json()

        // Transform backend task format to frontend format
        // Filter to only show tasks within 5km and sort by distance
        const transformedTasks = data.tasks
          .filter(task => task.distanceKm !== null && task.distanceKm !== undefined && task.distanceKm <= 5) // Only within 5km
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
            time: task.scheduledAt
              ? new Date(task.scheduledAt).toLocaleString('en-IN', {
                weekday: 'short',
                hour: 'numeric',
                minute: '2-digit'
              })
              : 'Flexible',
            status: task.status === 'SEARCHING' || task.status === 'OPEN' ? 'open' : task.status.toLowerCase()
          }))
          // Sort by distance (nearest first)
          .sort((a, b) => {
            if (a.distanceKm === null || a.distanceKm === undefined) return 1
            if (b.distanceKm === null || b.distanceKm === undefined) return -1
            return a.distanceKm - b.distanceKm
          })

        setTasks(transformedTasks)
      } catch (err) {
        console.error('Error fetching tasks:', err)
        setError(err.message || 'Failed to load tasks. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [workerLocation])

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

    // DATA CONSISTENCY: Listen for task status changes to refresh task list
    const handleTaskStatusChanged = async () => {
      // Refetch tasks to ensure list matches backend state
      try {
        let url = `${API_BASE_URL}/api/tasks`
        if (workerLocation && workerLocation.lat && workerLocation.lng) {
          url += `?lat=${workerLocation.lat}&lng=${workerLocation.lng}&radius=5`
        }

        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          const transformedTasks = data.tasks.map((task) => ({
            id: task._id,
            title: task.title,
            description: task.description,
            location: task.location?.area
              ? `${task.location.area}${task.location.city ? `, ${task.location.city}` : ''}`
              : 'Location not specified',
            distance: task.distanceKm !== null && task.distanceKm !== undefined 
              ? `${task.distanceKm} km away`
              : 'Distance unavailable',
            distanceKm: task.distanceKm,
            budget: `₹${task.budget}`,
            category: task.category,
            time: task.scheduledAt
              ? new Date(task.scheduledAt).toLocaleString('en-IN', {
                weekday: 'short',
                hour: 'numeric',
                minute: '2-digit'
              })
              : 'Flexible',
            status: task.status === 'SEARCHING' || task.status === 'OPEN' ? 'open' : task.status.toLowerCase()
          }))
          setTasks(transformedTasks)
        }
      } catch (err) {
        // Silent fail
      }
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
  }, [isOnline, getSocket, workerLocation])

  // STATE RECOVERY: Page load recovery - fetch active task
  useEffect(() => {
    if (!user?.id) return

    const recoverState = async () => {
      try {
        const activeTask = await fetchActiveTask()
        // If user has active task, they might need to navigate to it
        // This is handled by the active task modal in other components
      } catch (error) {
        console.error('State recovery failed:', error)
      }
    }

    recoverState()
  }, [user?.id])

  // STATE RECOVERY: Listen for socket reconnection
  useEffect(() => {
    const handleReconnect = async () => {
      // Refetch tasks on reconnection
      const fetchTasks = async () => {
        try {
          let url = `${API_BASE_URL}/api/tasks`
          if (workerLocation && workerLocation.lat && workerLocation.lng) {
            url += `?lat=${workerLocation.lat}&lng=${workerLocation.lng}&radius=5`
          }

          const response = await fetch(url)
          if (response.ok) {
            const data = await response.json()
            const transformedTasks = data.tasks.map((task) => ({
              id: task._id,
              title: task.title,
              description: task.description,
              location: task.location?.area
                ? `${task.location.area}${task.location.city ? `, ${task.location.city}` : ''}`
                : 'Location not specified',
              distance: task.distanceKm !== null && task.distanceKm !== undefined 
                ? `${task.distanceKm} km away`
                : 'Distance unavailable',
              distanceKm: task.distanceKm,
              budget: `₹${task.budget}`,
              category: task.category,
              time: task.scheduledAt
                ? new Date(task.scheduledAt).toLocaleString('en-IN', {
                  weekday: 'short',
                  hour: 'numeric',
                  minute: '2-digit'
                })
                : 'Flexible',
              status: task.status === 'SEARCHING' || task.status === 'OPEN' ? 'open' : task.status.toLowerCase()
            }))
            setTasks(transformedTasks)
          }
        } catch (err) {
          console.error('Error refetching tasks on reconnect:', err)
        }
      }
      fetchTasks()
    }

    window.addEventListener('socket_reconnected', handleReconnect)
    return () => {
      window.removeEventListener('socket_reconnected', handleReconnect)
    }
  }, [workerLocation])

  // STATE RECOVERY: Tab visibility change recovery
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isOnline) {
        // Refetch tasks when tab becomes visible
        try {
          let url = `${API_BASE_URL}/api/tasks`
          if (workerLocation && workerLocation.lat && workerLocation.lng) {
            url += `?lat=${workerLocation.lat}&lng=${workerLocation.lng}&radius=5`
          }

          const response = await fetch(url)
          if (response.ok) {
            const data = await response.json()
            const transformedTasks = data.tasks.map((task) => ({
              id: task._id,
              title: task.title,
              description: task.description,
              location: task.location?.area
                ? `${task.location.area}${task.location.city ? `, ${task.location.city}` : ''}`
                : 'Location not specified',
              distance: task.distanceKm !== null && task.distanceKm !== undefined 
                ? `${task.distanceKm} km away`
                : 'Distance unavailable',
              distanceKm: task.distanceKm,
              budget: `₹${task.budget}`,
              category: task.category,
              time: task.scheduledAt
                ? new Date(task.scheduledAt).toLocaleString('en-IN', {
                  weekday: 'short',
                  hour: 'numeric',
                  minute: '2-digit'
                })
                : 'Flexible',
              status: task.status === 'SEARCHING' || task.status === 'OPEN' ? 'open' : task.status.toLowerCase()
            }))
            setTasks(transformedTasks)
          }
        } catch (err) {
          // Silent fail
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [isOnline, workerLocation])

  // STATE RECOVERY: Listen for refetch_required events (from socket events)
  useEffect(() => {
    const handleRefetch = async (event) => {
      const { type } = event.detail
      
      if (type === 'task_updated' || type === 'task_status_changed' || type === 'task_cancelled') {
        // Silent refetch tasks
        try {
          let url = `${API_BASE_URL}/api/tasks`
          if (workerLocation && workerLocation.lat && workerLocation.lng) {
            url += `?lat=${workerLocation.lat}&lng=${workerLocation.lng}&radius=5`
          }

          const response = await fetch(url)
          if (response.ok) {
            const data = await response.json()
            const transformedTasks = data.tasks.map((task) => ({
              id: task._id,
              title: task.title,
              description: task.description,
              location: task.location?.area
                ? `${task.location.area}${task.location.city ? `, ${task.location.city}` : ''}`
                : 'Location not specified',
              distance: task.distanceKm !== null && task.distanceKm !== undefined 
                ? `${task.distanceKm} km away`
                : 'Distance unavailable',
              distanceKm: task.distanceKm,
              budget: `₹${task.budget}`,
              category: task.category,
              time: task.scheduledAt
                ? new Date(task.scheduledAt).toLocaleString('en-IN', {
                  weekday: 'short',
                  hour: 'numeric',
                  minute: '2-digit'
                })
                : 'Flexible',
              status: task.status === 'SEARCHING' || task.status === 'OPEN' ? 'open' : task.status.toLowerCase()
            }))
            setTasks(transformedTasks)
          }
        } catch (err) {
          // Silent fail
        }
      }
    }

    window.addEventListener('refetch_required', handleRefetch)
    return () => {
      window.removeEventListener('refetch_required', handleRefetch)
    }
  }, [workerLocation])

  const filteredTasks = tasks // In real app, apply filters here

  return (
    <div className="max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Available Tasks</h1>
        <p className="text-sm sm:text-base text-gray-600">Find work near you</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 mb-4 sm:mb-6 border border-gray-100">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px] touch-manipulation"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Distance Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Distance</label>
            <select
              value={selectedDistance}
              onChange={(e) => setSelectedDistance(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px] touch-manipulation"
            >
              {distances.map((dist) => (
                <option key={dist} value={dist}>{dist}</option>
              ))}
            </select>
          </div>

          {/* Budget Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
            <select
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px] touch-manipulation"
            >
              {budgets.map((budget) => (
                <option key={budget} value={budget}>{budget}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
          {filteredTasks.map((task) => (
            <Link
              key={task.id}
              to={`/tasks/${task.id}`}
              className={`group bg-white rounded-xl p-4 sm:p-6 shadow-sm hover:shadow-lg transition-all duration-200 border-2 active:bg-gray-50 ${
                task.isNew || newTaskHighlightRef.current.has(task.id)
                  ? 'border-blue-300 bg-blue-50/50'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex-1 pr-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {task.title}
                </h3>
                <span className="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded-md whitespace-nowrap flex-shrink-0">
                  {task.category}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-2 leading-relaxed">
                {task.description}
              </p>
              <div className="space-y-2 sm:space-y-2.5 mb-3 sm:mb-4">
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {task.distance && task.distance !== 'Distance unavailable' && (
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {task.distance}
                    </span>
                  )}
                  <span className="truncate">{task.location}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {task.budget}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{task.time}</span>
                  </div>
                </div>
              </div>
              <div className="pt-3 sm:pt-4 border-t border-gray-100 flex items-center justify-between">
                <StatusBadge status={task.status} />
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm p-16 text-center border border-gray-100">
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-base text-gray-600 font-medium">Loading tasks...</p>
            </>
          ) : error ? (
            <>
              <svg className="h-16 w-16 text-red-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading tasks</h3>
              <p className="text-sm text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Retry
              </button>
            </>
          ) : (
            <>
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tasks near you right now</h3>
              <p className="text-sm text-gray-600 mb-6">Check back later or try adjusting your filters to see more options.</p>
              <button
                onClick={() => {
                  setSelectedCategory('All')
                  setSelectedDistance('All')
                  setSelectedBudget('All')
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
