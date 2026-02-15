import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
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
import LoginCTA from '../components/LoginCTA'

// College pilot: default 2 km campus radius
const DISTANCE_OPTIONS = [
  { label: 'Within 2 km', km: 2 },
  { label: 'Within 1 km', km: 1 },
  { label: 'Within 3 km', km: 3 },
  { label: 'Within 5 km', km: 5 }
]

function Tasks() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [bannerMessage, setBannerMessage] = useState(null) // e.g. "Task already accepted by another worker"
  const [selectedDistance, setSelectedDistance] = useState('Within 2 km')
  const [selectedBudget, setSelectedBudget] = useState('All')
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hasActiveTask, setHasActiveTask] = useState(false)
  const [refetchTrigger, setRefetchTrigger] = useState(0)
  const [workerPreferredCategories, setWorkerPreferredCategories] = useState([])
  const [showAllTasksOverride] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortOption, setSortOption] = useState('distance')
  const [showOnlySaved, setShowOnlySaved] = useState(false)
  const [savedTaskIds, setSavedTaskIds] = useState(new Set())
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [taskPage, setTaskPage] = useState(1)
  const [hasMoreTasks, setHasMoreTasks] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  // Location for browsing nearby tasks (used when not on duty or guest - workerLocation from context is only set when ON DUTY)
  const [browseLocation, setBrowseLocation] = useState(null)
  const [locationRequesting, setLocationRequesting] = useState(false)
  const [browseLocationError, setBrowseLocationError] = useState(null)
  const preferencesAppliedRef = useRef(false)
  const sortOptionRef = useRef(sortOption)
  sortOptionRef.current = sortOption
  const savedTaskIdsRef = useRef(savedTaskIds)
  savedTaskIdsRef.current = savedTaskIds
  const { getSocket } = useSocket()
  const { isOnline, workerLocation } = useAvailability()
  const { user } = useAuth()
  const { userMode } = useUserMode()
  const newTaskHighlightRef = useRef(new Set())
  const { categories: categoriesList } = useCategories()
  const categories = ['All', ...categoriesList]

  // Show message when redirected from Task Detail (e.g. task already accepted by another worker)
  useEffect(() => {
    const msg = location.state?.message
    if (msg && typeof msg === 'string') {
      setBannerMessage(msg)
      navigate(location.pathname, { replace: true, state: {} }) // Clear state so message doesn't reappear
      const t = setTimeout(() => setBannerMessage(null), 5000)
      return () => clearTimeout(t)
    }
  }, [location.state?.message, location.pathname, navigate])

  // Pull-to-refresh handler
  const handleRefresh = () => {
    setTaskPage(1)
    setRefetchTrigger(prev => prev + 1)
  }

  // Pull-to-refresh hook
  const pullToRefreshRef = usePullToRefresh(handleRefresh, 80)

  const distances = DISTANCE_OPTIONS.map(d => d.label)
  const budgets = ['All', 'Under ₹500', '₹500 - ₹1000', '₹1000 - ₹2000', 'Above ₹2000']

  const getRadiusKm = () => {
    switch (selectedDistance) {
      case 'Within 1 km': return 1
      case 'Within 2 km': return 2
      case 'Within 3 km': return 3
      case 'Within 5 km': return 5
      default: return 2
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

  // Load worker preferences and saved task IDs once
  useEffect(() => {
    if (userMode !== 'worker' || !user?.id) return
    const token = localStorage.getItem('kaam247_token')
    fetch(`${API_BASE_URL}/api/users/me`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        const prefs = data.user?.workerPreferences
        if (prefs && !preferencesAppliedRef.current) {
          preferencesAppliedRef.current = true
          if (Array.isArray(prefs.preferredCategories) && prefs.preferredCategories.length > 0) {
            setWorkerPreferredCategories(prefs.preferredCategories)
          }
          const defaultKm = prefs.defaultRadiusKm
          if (typeof defaultKm === 'number' && defaultKm >= 1 && defaultKm <= 10) {
            const option = DISTANCE_OPTIONS.find(o => o.km === defaultKm) || DISTANCE_OPTIONS.find(o => o.km === 5)
            if (option) setSelectedDistance(option.label)
          }
        }
        const saved = data.user?.savedTasks || []
        setSavedTaskIds(new Set(saved.map(id => (id && id._id ? id._id.toString() : String(id)))))
      })
      .catch(() => { })
  }, [userMode, user?.id])

  // In worker mode, use context location (when ON DUTY) or browse location (guest / off-duty)
  const effectiveLocation = userMode === 'worker' ? (workerLocation || browseLocation) : null

  // Request browser location for worker mode when we don't have context location (guest or off-duty)
  const requestBrowseLocation = useCallback(() => {
    if (userMode !== 'worker' || typeof navigator === 'undefined' || !navigator.geolocation) return
    setBrowseLocationError(null)
    setLocationRequesting(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setBrowseLocation({ lat: position.coords.latitude, lng: position.coords.longitude })
        setBrowseLocationError(null)
        setLocationRequesting(false)
      },
      (err) => {
        setBrowseLocation(null)
        setBrowseLocationError(err.code === 1 ? 'Location access denied. Enable location to see nearby tasks.' : 'Could not get location. Please try again.')
        setLocationRequesting(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }, [userMode])

  useEffect(() => {
    if (userMode !== 'worker' || workerLocation) return
    if (browseLocation || browseLocationError) return
    requestBrowseLocation()
  }, [userMode, workerLocation, browseLocation, browseLocationError, requestBrowseLocation])

  // Fetch tasks when location or filters change (worker mode only; use effectiveLocation so guests/off-duty can see nearby tasks)
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        if (userMode !== 'worker') {
          setTasks([])
          setError(null)
          setLoading(false)
          return
        }

        if (!effectiveLocation || !effectiveLocation.lat || !effectiveLocation.lng) {
          if (locationRequesting) {
            if (taskPage === 1) setLoading(true)
            setError(null)
          } else if (browseLocationError) {
            setTasks([])
            setError(browseLocationError)
            setLoading(false)
          } else {
            setTasks([])
            setError('Location access is required to view tasks. Please enable location access.')
            setLoading(false)
          }
          return
        }

        if (taskPage === 1) {
          setLoading(true)
        } else {
          setLoadingMore(true)
        }
        setError(null)

        const radiusKm = getRadiusKm()
        const { minBudget, maxBudget } = getBudgetRange()
        const limit = 20
        let url = `${API_BASE_URL}/api/tasks?lat=${effectiveLocation.lat}&lng=${effectiveLocation.lng}&radius=${radiusKm}&page=${taskPage}&limit=${limit}`
        if (selectedCategory && selectedCategory !== 'All') url += `&category=${encodeURIComponent(selectedCategory)}`
        if (minBudget != null) url += `&minBudget=${minBudget}`
        if (maxBudget != null) url += `&maxBudget=${maxBudget}`
        if (sortOption) url += `&sort=${encodeURIComponent(sortOption)}`

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
            budgetNum: typeof task.budget === 'number' ? task.budget : Number(task.budget) || 0,
            category: task.category,
            createdAt: task.createdAt ? new Date(task.createdAt).getTime() : 0,
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
          // Apply sort (match server + client filters so order is correct)
          .sort((a, b) => {
            if (sortOption === 'budget_desc') return (b.budgetNum ?? 0) - (a.budgetNum ?? 0)
            if (sortOption === 'budget_asc') return (a.budgetNum ?? 0) - (b.budgetNum ?? 0)
            if (sortOption === 'newest') return (b.createdAt ?? 0) - (a.createdAt ?? 0)
            // distance (default): nearest first
            if (a.distanceKm == null) return 1
            if (b.distanceKm == null) return -1
            return a.distanceKm - b.distanceKm
          })

        const pagination = data.pagination || {}
        setHasMoreTasks(Boolean(pagination.hasMore))
        if (taskPage === 1) {
          setTasks(transformedTasks)
        } else {
          setTasks(prev => [...prev, ...transformedTasks])
        }
      } catch (err) {
        setError(err.message || 'Failed to load tasks. Please try again later.')
      } finally {
        if (taskPage === 1) {
          setLoading(false)
        } else {
          setLoadingMore(false)
        }
      }
    }

    fetchTasks()
  }, [effectiveLocation, userMode, user?.id, selectedCategory, selectedDistance, selectedBudget, searchQuery, sortOption, refetchTrigger, workerPreferredCategories, showAllTasksOverride, taskPage, locationRequesting, browseLocationError])

  // Reset to page 1 when location changes so we show first page of new area
  useEffect(() => {
    setTaskPage(1)
  }, [effectiveLocation?.lat, effectiveLocation?.lng])

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
      const budgetNum = typeof taskData.budget === 'number' ? taskData.budget : Number(taskData.budget) || 0
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
        budgetNum,
        category: taskData.category,
        isOnCampus: taskData.isOnCampus === true,
        createdAt: taskData.createdAt ? new Date(taskData.createdAt).getTime() : Date.now(),
        time: 'Just now',
        status: 'open',
        isNew: true
      }

      // Add to list and re-apply current sort
      setTasks(prev => {
        const withNew = [newTask, ...prev]
        const sortBy = sortOptionRef.current
        return withNew.sort((a, b) => {
          if (sortBy === 'budget_desc') return ((b.budgetNum ?? 0) - (a.budgetNum ?? 0))
          if (sortBy === 'budget_asc') return ((a.budgetNum ?? 0) - (b.budgetNum ?? 0))
          if (sortBy === 'newest') return ((b.createdAt ?? 0) - (a.createdAt ?? 0))
          if (a.distanceKm == null) return 1
          if (b.distanceKm == null) return -1
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

    const handleRemoveTask = async (data) => {
      // DATA CONSISTENCY: Remove task from list when accepted by another worker
      setTasks(prev => prev.filter(task => task.id !== data.taskId))
      // If this task was bookmarked, remove it from saved list (no longer available)
      if (savedTaskIdsRef.current.has(data.taskId)) {
        const token = localStorage.getItem('kaam247_token')
        if (token) {
          try {
            const res = await fetch(`${API_BASE_URL}/api/users/me/saved-tasks/${data.taskId}`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
              const json = await res.json()
              setSavedTaskIds(new Set(json.savedTasks || []))
            }
          } catch (_) { }
        }
      }
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

  const filteredTasks = showOnlySaved
    ? tasks.filter(t => savedTaskIds.has(t.id))
    : tasks

  const toggleBookmark = async (taskId, e) => {
    e.preventDefault()
    e.stopPropagation()
    const token = localStorage.getItem('kaam247_token')
    if (!token) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/me/saved-tasks/${taskId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setSavedTaskIds(new Set(data.savedTasks || []))
      }
    } catch (err) { }
  }

  // Worker OFF DUTY: hide task feed (only when logged in as worker)
  if (user?.id && userMode === 'worker' && !isOnline) {
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

      {/* Guest: show login CTA so they can accept tasks */}
      {!user?.id && (
        <div className="mb-6">
          <LoginCTA message="Login to view tasks near you and accept work" returnUrl="/tasks" />
        </div>
      )}

      {/* Banner when redirected after task already accepted by another worker */}
      {bannerMessage && (
        <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
          <span className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
          <p className="text-sm text-amber-800 dark:text-amber-200 flex-1">{bannerMessage}</p>
          <button
            type="button"
            onClick={() => setBannerMessage(null)}
            className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 shrink-0 p-1"
            aria-label="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 sm:mb-8 lg:mb-10 w-full">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 leading-tight break-words">Available Tasks</h1>
        <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 leading-relaxed break-words">Find work near you</p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by title or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 px-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        />
      </div>

      {/* Filters - hidden on small screens (use FAB + sheet instead) */}
      <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm dark:shadow-gray-900/50 sm:shadow-md p-4 sm:p-5 lg:p-6 mb-5 sm:mb-6 lg:mb-8 border border-gray-200 dark:border-gray-700 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
          {/* Category Filter */}
          <div className="flex flex-col gap-2">
            <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Category</span>
            <select
              value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setTaskPage(1) }}
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
              onChange={(e) => { setSelectedDistance(e.target.value); setTaskPage(1) }}
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
              onChange={(e) => { setSelectedBudget(e.target.value); setTaskPage(1) }}
              className="h-11 sm:h-12 w-full px-3 sm:px-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base touch-manipulation transition-colors"
            >
              {budgets.map((budget) => (
                <option key={budget} value={budget}>{budget}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="flex flex-col gap-2">
            <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Sort by</span>
            <select
              value={sortOption}
              onChange={(e) => { setSortOption(e.target.value); setTaskPage(1) }}
              className="h-11 sm:h-12 w-full px-3 sm:px-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base touch-manipulation transition-colors"
            >
              <option value="distance">Nearest first</option>
              <option value="budget_desc">Budget (high to low)</option>
              <option value="budget_asc">Budget (low to high)</option>
              <option value="newest">Newest first</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlySaved}
              onChange={(e) => setShowOnlySaved(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show bookmarked only</span>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 ml-6">View tasks you saved for later. If someone else takes a task, it is removed from your bookmarks.</p>
        </div>
      </div>

      {/* Small screen: floating filter button */}
      <button
        type="button"
        onClick={() => setFilterPanelOpen(true)}
        className="sm:hidden fixed right-4 z-[998] bottom-[90px] flex items-center justify-center w-12 h-12 rounded-full bg-blue-600 dark:bg-blue-500 text-white shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-95 transition-all touch-manipulation"
        aria-label="Open filters"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      </button>

      {/* Small screen: filter sheet (slides up from bottom) */}
      {filterPanelOpen && (
        <>
          <div
            className="sm:hidden fixed inset-0 z-[999] bg-black/50 animate-modal-backdrop-in"
            aria-hidden="true"
            onClick={() => setFilterPanelOpen(false)}
          />
          <div
            className="sm:hidden fixed left-0 right-0 bottom-0 z-[1000] bg-white dark:bg-gray-800 rounded-t-2xl shadow-xl border-t border-gray-200 dark:border-gray-700 max-h-[85vh] overflow-y-auto animate-modal-sheet-in"
            role="dialog"
            aria-modal="true"
            aria-label="Filters"
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 rounded-t-2xl">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Filters</h2>
              <button
                type="button"
                onClick={() => setFilterPanelOpen(false)}
                className="text-blue-600 dark:text-blue-400 font-medium text-sm"
              >
                Done
              </button>
            </div>
            <div className="p-4 space-y-4 pb-8">
              <div>
                <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Category</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => { setSelectedCategory(e.target.value); setTaskPage(1) }}
                  className="h-11 w-full px-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Distance</span>
                <select
                  value={selectedDistance}
                  onChange={(e) => { setSelectedDistance(e.target.value); setTaskPage(1) }}
                  className="h-11 w-full px-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {distances.map((dist) => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Budget</span>
                <select
                  value={selectedBudget}
                  onChange={(e) => { setSelectedBudget(e.target.value); setTaskPage(1) }}
                  className="h-11 w-full px-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  {budgets.map((budget) => (
                    <option key={budget} value={budget}>{budget}</option>
                  ))}
                </select>
              </div>
              <div>
                <span className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">Sort by</span>
                <select
                  value={sortOption}
                  onChange={(e) => { setSortOption(e.target.value); setTaskPage(1) }}
                  className="h-11 w-full px-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="distance">Nearest first</option>
                  <option value="budget_desc">Budget (high to low)</option>
                  <option value="budget_asc">Budget (low to high)</option>
                  <option value="newest">Newest first</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={showOnlySaved}
                  onChange={(e) => setShowOnlySaved(e.target.checked)}
                  className="rounded border-gray-300 dark:border-gray-600 text-amber-500 focus:ring-amber-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Show bookmarked only</span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 pl-6">Your saved tasks. Taken tasks are removed from bookmarks.</p>
            </div>
          </div>
        </>
      )}

      {/* Tasks List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 w-full">
          {[...Array(6)].map((_, i) => (
            <TaskCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredTasks.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 w-full">
            {filteredTasks.map((task) => (
              <SwipeableTaskCard
                key={task.id}
                task={task}
                onTaskAccepted={(taskId) => {
                  setTasks(prev => prev.filter(t => t.id !== taskId))
                }}
                onTaskRemoved={(taskId) => {
                  setTasks(prev => prev.filter(t => t.id !== taskId))
                }}
                isSaved={savedTaskIds.has(task.id)}
                onToggleBookmark={toggleBookmark}
              />
            ))}
          </div>
          {hasMoreTasks && !showOnlySaved && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => setTaskPage(prev => prev + 1)}
                disabled={loadingMore}
                className="px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] touch-manipulation transition-all"
              >
                {loadingMore ? 'Loading...' : 'Load more tasks'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-12 sm:p-16 lg:p-20 text-center border border-gray-200 dark:border-gray-700">
          {error ? (
            <>
              <svg className="h-14 w-14 sm:h-16 sm:w-16 text-red-300 dark:text-red-600 mx-auto mb-4 sm:mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 leading-tight">
                {browseLocationError || (error && error.includes('Location')) ? 'Location needed' : 'Error loading tasks'}
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-7 leading-relaxed">{error}</p>
              <button
                onClick={() => (browseLocationError || (error && error.includes('Location')) ? requestBrowseLocation() : window.location.reload())}
                disabled={locationRequesting}
                className="inline-flex items-center px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 dark:bg-blue-500 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 active:scale-[0.98] min-h-[44px] touch-manipulation disabled:opacity-50"
              >
                {locationRequesting ? 'Getting location…' : (browseLocationError || (error && error.includes('Location')) ? 'Use my location' : 'Retry')}
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

