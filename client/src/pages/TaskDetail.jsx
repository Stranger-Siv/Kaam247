import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { useUserMode } from '../context/UserModeContext'
import { useSocket } from '../context/SocketContext'
import { useAuth } from '../context/AuthContext'
import { useAvailability } from '../context/AvailabilityContext'
import { useCancellation } from '../context/CancellationContext'
import StatusBadge from '../components/StatusBadge'
import { API_BASE_URL } from '../config/env'
import TaskLocationMap from '../components/TaskLocationMap'
import ReportModal from '../components/ReportModal'
import EditTaskModal from '../components/EditTaskModal'
import ConfirmationModal from '../components/ConfirmationModal'
import IncreaseBudgetModal from '../components/IncreaseBudgetModal'

function TaskDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id: taskId } = useParams()
  const { userMode } = useUserMode()
  const { getSocket } = useSocket()
  const { user } = useAuth()
  const { workerLocation, isOnline, checkActiveTask } = useAvailability()
  const { cancellationStatus, refreshStatus } = useCancellation()
  const [task, setTask] = useState(null)
  const [hasActiveTask, setHasActiveTask] = useState(false)
  const [checkingActiveTask, setCheckingActiveTask] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAccepting, setIsAccepting] = useState(false)
  const [acceptError, setAcceptError] = useState(null)
  const [acceptSuccess, setAcceptSuccess] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState(null)
  const [isStarting, setIsStarting] = useState(false)
  const [startError, setStartError] = useState(null)
  const [isMarkingComplete, setIsMarkingComplete] = useState(false)
  const [markCompleteError, setMarkCompleteError] = useState(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState(null)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [isRating, setIsRating] = useState(false)
  const [ratingError, setRatingError] = useState(null)
  const [ratingSuccess, setRatingSuccess] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showIncreaseBudgetModal, setShowIncreaseBudgetModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const fetchInFlightRef = useRef(false)
  const lastFetchAtRef = useRef(0)
  const fetchTaskRef = useRef(null)
  const taskStatusRef = useRef(null)
  const lastHiddenAtRef = useRef(null)
  const userModeRef = useRef(userMode)
  const userIdRef = useRef(user?.id)
  const checkActiveTaskRef = useRef(checkActiveTask)
  userModeRef.current = userMode
  userIdRef.current = user?.id
  checkActiveTaskRef.current = checkActiveTask

  // Fetch task: silent = true for background refetches (socket/visibility) - no loading spinner
  const fetchTask = useCallback(async (silent = false) => {
    if (!taskId) {
      if (!silent) {
        setError('Task ID is missing')
        setLoading(false)
      }
      return
    }

    const now = Date.now()
    if (fetchInFlightRef.current) return
    if (!silent && now - lastFetchAtRef.current < 500) return
    if (silent && now - lastFetchAtRef.current < 1500) return // throttle background refetches
    fetchInFlightRef.current = true
    lastFetchAtRef.current = now

    try {
      if (!silent) {
        setLoading(true)
        setError(null)
      }

      // Build URL with location and userId if available
      let url = `${API_BASE_URL}/api/tasks/${taskId}`
      const params = new URLSearchParams()

      if (userMode === 'worker' && workerLocation && workerLocation.lat && workerLocation.lng) {
        params.append('lat', workerLocation.lat)
        params.append('lng', workerLocation.lng)
      }

      // Add userId for authorization (to show phone numbers)
      if (user && user.id) {
        params.append('userId', user.id)
      }

      if (params.toString()) {
        url += `?${params.toString()}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Task not found')
        }
        throw new Error(`Failed to fetch task: ${response.statusText}`)
      }

      const data = await response.json()
      const backendTask = data.task

      // Transform backend task format to frontend format
      const transformedTask = {
        id: backendTask._id,
        title: backendTask.title,
        description: backendTask.description,
        location: backendTask.location?.area || 'Location not specified',
        city: backendTask.location?.city || '',
        coordinates: backendTask.location?.coordinates || null, // Store coordinates for Google Maps
        distance: backendTask.distanceKm !== null && backendTask.distanceKm !== undefined
          ? `${backendTask.distanceKm} km away`
          : 'Distance unavailable',
        distanceKm: backendTask.distanceKm,
        budget: `₹${backendTask.budget}`,
        category: backendTask.category,
        time: backendTask.scheduledAt
          ? new Date(backendTask.scheduledAt).toLocaleString('en-IN', {
            weekday: 'short',
            hour: 'numeric',
            minute: '2-digit',
            day: 'numeric',
            month: 'short'
          })
          : 'Flexible',
        duration: backendTask.expectedDuration
          ? `${backendTask.expectedDuration} ${backendTask.expectedDuration === 1 ? 'hour' : 'hours'}`
          : 'Not specified',
        status: (backendTask.status === 'SEARCHING' || backendTask.status === 'OPEN') ? 'open' : backendTask.status.toLowerCase(),
        // Keep full postedBy object for ID checks + a separate display name
        postedBy: backendTask.postedBy || null,
        postedByName: backendTask.postedBy?.name || 'User',
        posterPhone: backendTask.posterPhone || null, // Only included if authorized
        workerPhone: backendTask.workerPhone || null, // Only included if authorized
        postedTime: backendTask.createdAt
          ? new Date(backendTask.createdAt).toLocaleString('en-IN', {
            hour: 'numeric',
            minute: '2-digit',
            day: 'numeric',
            month: 'short'
          })
          : '',
        worker: backendTask.acceptedBy ? 'Worker' : null, // Will be populated from acceptedBy user data later
        rawStatus: backendTask.status, // Keep original status for logic
        workerCompleted: backendTask.workerCompleted || false,
        startedAt: backendTask.startedAt || null,
        completedAt: backendTask.completedAt || null,
        rating: backendTask.rating || null,
        review: backendTask.review || null,
        ratedAt: backendTask.ratedAt || null
      }

      taskStatusRef.current = backendTask.status
      setTask(transformedTask)
    } catch (err) {
      if (!silent) {
        setError(err.message || 'Failed to load task details. Please try again later.')
      }
    } finally {
      if (!silent) setLoading(false)
      fetchInFlightRef.current = false
    }
  }, [taskId, userMode, workerLocation, user])

  // Keep ref pointing to latest fetchTask (do not use as effect dependency)
  fetchTaskRef.current = fetchTask

  // Fetch task ONLY when taskId changes (single load per page; real-time via WebSocket below)
  useEffect(() => {
    if (!taskId) return
    fetchTaskRef.current()
  }, [taskId])

  // Listen for Socket.IO events (real-time updates – no polling)
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !socket.connected) {
      return
    }

    // Listen for remove_task event (when task is accepted by another worker)
    const handleRemoveTask = (data) => {
      if (String(data.taskId) === String(taskId)) {
        // Task was accepted by another worker
        if (userMode === 'worker') {
          // Redirect worker back to tasks list
          navigate('/tasks', {
            state: {
              message: 'Task already accepted by another worker'
            }
          })
        }
      }
    }

    // Listen for task_accepted event (when task is accepted - for poster and worker)
    const handleTaskAccepted = (data) => {
      if (String(data.taskId) === String(taskId)) {
        // Refresh task data to show updated status and phone number
        const fetchUpdatedTask = async () => {
          try {
            const params = new URLSearchParams()
            if (userMode === 'worker' && workerLocation && workerLocation.lat && workerLocation.lng) {
              params.append('lat', workerLocation.lat)
              params.append('lng', workerLocation.lng)
            }
            if (user && user.id) {
              params.append('userId', user.id)
            }

            const url = `${API_BASE_URL}/api/tasks/${taskId}${params.toString() ? `?${params.toString()}` : ''}`
            const response = await fetch(url)
            if (response.ok) {
              const data = await response.json()
              const backendTask = data.task

              setTask(prev => ({
                ...prev,
                status: (backendTask.status === 'SEARCHING' || backendTask.status === 'OPEN') ? 'open' : backendTask.status.toLowerCase(),
                rawStatus: backendTask.status,
                posterPhone: backendTask.posterPhone || null,
                workerPhone: backendTask.workerPhone || null,
                worker: backendTask.acceptedBy ? 'Worker' : null
              }))
            }
          } catch (err) {
          }
        }
        fetchUpdatedTask()
      }
    }

    // Real-time: one silent refetch per socket event (no loading spinner)
    const handleTaskUpdated = (data) => {
      if (String(data.taskId) === String(taskId)) {
        fetchTaskRef.current(true)
        if (userMode === 'worker' && checkActiveTask) {
          checkActiveTask().then(activeTaskData => {
            setHasActiveTask(activeTaskData?.hasActiveTask || false)
          })
        }
      }
    }

    const handleTaskCompleted = (data) => {
      if (String(data.taskId) === String(taskId)) {
        fetchTaskRef.current(true)
        if (userMode === 'worker' && checkActiveTask) {
          checkActiveTask().then(activeTaskData => {
            setHasActiveTask(activeTaskData?.hasActiveTask || false)
          })
        }
      }
    }

    const handleTaskCancelled = (data) => {
      if (String(data.taskId) === String(taskId)) {
        fetchTaskRef.current(true)
        if (userMode === 'worker' && checkActiveTask) {
          checkActiveTask().then(activeTaskData => {
            setHasActiveTask(activeTaskData?.hasActiveTask || false)
          })
        }
      }
    }

    socket.on('remove_task', handleRemoveTask)
    socket.on('task_accepted', handleTaskAccepted)
    socket.on('task_updated', handleTaskUpdated)
    socket.on('task_completed', handleTaskCompleted)
    socket.on('task_cancelled', handleTaskCancelled)

    return () => {
      socket.off('remove_task', handleRemoveTask)
      socket.off('task_accepted', handleTaskAccepted)
      socket.off('task_updated', handleTaskUpdated)
      socket.off('task_completed', handleTaskCompleted)
      socket.off('task_cancelled', handleTaskCancelled)
    }
  }, [taskId, userMode, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Check active task for worker when taskId or user available (run once per task/user)
  useEffect(() => {
    if (!user?.id || !taskId) return
    if (userMode !== 'worker' || !checkActiveTask) return
    setCheckingActiveTask(true)
    const runCheck = async () => {
      try {
        const activeTaskData = await checkActiveTask()
        setHasActiveTask(activeTaskData?.hasActiveTask || false)
      } catch (error) { }
      finally {
        setCheckingActiveTask(false)
      }
    }
    runCheck()
  }, [taskId, user?.id, userMode, checkActiveTask])

  // Window events + visibility: one listener setup per taskId (refs used in handlers to avoid effect re-runs)
  useEffect(() => {
    const handleTaskCompleted = (event) => {
      const { detail } = event
      if (detail.taskId === taskId) {
        fetchTaskRef.current(true)
        const check = checkActiveTaskRef.current
        if (userModeRef.current === 'worker' && check) {
          check().then(data => setHasActiveTask(data?.hasActiveTask || false))
        }
      }
    }

    const handleTaskStatusChanged = (event) => {
      const { detail } = event
      if (detail.taskId === taskId) {
        fetchTaskRef.current(true)
        const check = checkActiveTaskRef.current
        if (userModeRef.current === 'worker' && check) {
          check().then(data => setHasActiveTask(data?.hasActiveTask || false))
        }
      }
    }

    const handleRefetch = (event) => {
      const { type, taskId: refetchTaskId } = event.detail
      if (refetchTaskId === taskId && (type === 'task_updated' || type === 'task_status_changed' || type === 'task_completed' || type === 'task_cancelled')) {
        fetchTaskRef.current(true)
        const check = checkActiveTaskRef.current
        if (userModeRef.current === 'worker' && check) {
          check().then(data => setHasActiveTask(data?.hasActiveTask || false))
        }
      }
    }

    const handleReconnect = (event) => {
      const { userId, userMode: reconnectedMode } = event.detail
      if (userId === userIdRef.current && reconnectedMode === userModeRef.current) {
        fetchTaskRef.current(true)
        const check = checkActiveTaskRef.current
        if (userModeRef.current === 'worker' && check) {
          check().then(activeTaskData => setHasActiveTask(activeTaskData?.hasActiveTask || false))
        }
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        lastHiddenAtRef.current = Date.now()
        return
      }
      if (document.visibilityState === 'visible' && taskId) {
        const hiddenMs = lastHiddenAtRef.current ? Date.now() - lastHiddenAtRef.current : 0
        if (hiddenMs < 15000) return
        fetchTaskRef.current(true)
        const check = checkActiveTaskRef.current
        if (userModeRef.current === 'worker' && check) {
          check().then(activeTaskData => setHasActiveTask(activeTaskData?.hasActiveTask || false))
        }
      }
    }

    window.addEventListener('task_completed', handleTaskCompleted)
    window.addEventListener('task_status_changed', handleTaskStatusChanged)
    window.addEventListener('refetch_required', handleRefetch)
    window.addEventListener('socket_reconnected', handleReconnect)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('task_completed', handleTaskCompleted)
      window.removeEventListener('task_status_changed', handleTaskStatusChanged)
      window.removeEventListener('refetch_required', handleRefetch)
      window.removeEventListener('socket_reconnected', handleReconnect)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [taskId])


  // Handle accept task
  const handleAcceptTask = async () => {
    if (isAccepting || !taskId) {
      return
    }

    // FRONTEND GUARD 1: Check task status
    const currentStatus = task?.rawStatus || task?.status
    if (currentStatus !== 'SEARCHING' && currentStatus !== 'OPEN' && currentStatus !== 'open') {
      setAcceptError('This task is no longer available')
      return
    }

    // FRONTEND GUARD 2: Check if user is online (for worker mode)
    if (userMode === 'worker' && !isOnline) {
      setAcceptError('You must be online (ON DUTY) to accept tasks')
      return
    }

    // FRONTEND GUARD 3: Check if user has active task
    if (userMode === 'worker' && hasActiveTask) {
      setAcceptError('You already have an active task. Please complete or cancel it first.')
      return
    }

    // FRONTEND GUARD 4: Check if it's own task
    if (task?.postedBy?._id === user?.id || task?.postedBy === user?.id) {
      setAcceptError('You cannot accept your own task')
      return
    }

    try {
      setIsAccepting(true)
      setAcceptError(null)
      setAcceptSuccess(false)

      // Use authenticated user's ID
      if (!user || !user.id) {
        setAcceptError('You must be logged in to accept tasks')
        setIsAccepting(false)
        return
      }

      const workerId = user.id

      // Call accept API
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ workerId })
      })

      if (!response.ok) {
        const errorData = await response.json()

        if (response.status === 409) {
          fetchTaskRef.current(true)

          // Task already accepted
          setAcceptError('Task already accepted by another worker')
          // Redirect to tasks list after a short delay
          setTimeout(() => {
            navigate('/tasks', {
              state: {
                message: 'Task already accepted by another worker'
              }
            })
          }, 2000)
          return
        }

        // STATE RECOVERY: For other errors, refetch task to ensure UI matches backend
        if (response.status === 400 || response.status === 403) {
          setTimeout(() => fetchTaskRef.current(true), 500)
        }

        throw new Error(errorData.message || 'Failed to accept task')
      }

      const data = await response.json()

      // Update task status in UI
      setTask(prev => ({
        ...prev,
        status: 'accepted',
        rawStatus: 'ACCEPTED',
        worker: 'You'
      }))

      setAcceptSuccess(true)

      // Refresh cancellation status after accepting
      if (refreshStatus) {
        refreshStatus()
      }

      // DATA CONSISTENCY: Refresh task data to get latest from server (including phone number)
      const refreshParams = new URLSearchParams()
      if (userMode === 'worker' && workerLocation && workerLocation.lat && workerLocation.lng) {
        refreshParams.append('lat', workerLocation.lat)
        refreshParams.append('lng', workerLocation.lng)
      }
      if (user && user.id) {
        refreshParams.append('userId', user.id)
      }

      const refreshUrl = `${API_BASE_URL}/api/tasks/${taskId}${refreshParams.toString() ? `?${refreshParams.toString()}` : ''}`
      const refreshResponse = await fetch(refreshUrl)
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        const backendTask = refreshData.task

        setTask(prev => ({
          ...prev,
          status: (backendTask.status === 'SEARCHING' || backendTask.status === 'OPEN') ? 'open' : backendTask.status.toLowerCase(),
          rawStatus: backendTask.status,
          worker: backendTask.acceptedBy ? 'You' : null,
          posterPhone: backendTask.posterPhone || null,
          workerPhone: backendTask.workerPhone || null
        }))
      }

      // DATA CONSISTENCY: Emit event to update task list
      window.dispatchEvent(new CustomEvent('task_status_changed', {
        detail: { taskId, status: 'ACCEPTED' }
      }))
    } catch (err) {
      setAcceptError(err.message || 'Failed to accept task. Please try again.')
    } finally {
      setIsAccepting(false)
    }
  }

  // Handle start task (worker)
  const handleStartTask = async () => {
    // FRONTEND GUARD: Prevent double actions
    if (isStarting || !user?.id || !taskId) {
      return
    }

    // FRONTEND GUARD: Check task status
    const currentStatus = task?.rawStatus || task?.status
    if (currentStatus !== 'ACCEPTED') {
      setStartError('Task must be accepted before starting')
      return
    }

    try {
      setIsStarting(true)
      setStartError(null)

      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ workerId: user.id })
      })

      if (!response.ok) {
        const errorData = await response.json()

        // STATE RECOVERY: For errors, refetch task to ensure UI matches backend
        if (response.status === 400 || response.status === 403 || response.status === 409) {
          setTimeout(() => fetchTaskRef.current(true), 500)
        }

        throw new Error(errorData.message || 'Failed to start task')
      }

      // DATA CONSISTENCY: Refresh task data
      const refreshParams = new URLSearchParams()
      if (userMode === 'worker' && workerLocation && workerLocation.lat && workerLocation.lng) {
        refreshParams.append('lat', workerLocation.lat)
        refreshParams.append('lng', workerLocation.lng)
      }
      if (user && user.id) {
        refreshParams.append('userId', user.id)
      }

      const refreshUrl = `${API_BASE_URL}/api/tasks/${taskId}${refreshParams.toString() ? `?${refreshParams.toString()}` : ''}`
      const refreshResponse = await fetch(refreshUrl)
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        const backendTask = refreshData.task

        setTask(prev => ({
          ...prev,
          status: (backendTask.status === 'SEARCHING' || backendTask.status === 'OPEN') ? 'open' : backendTask.status.toLowerCase(),
          rawStatus: backendTask.status,
          startedAt: backendTask.startedAt || null,
          workerCompleted: backendTask.workerCompleted || false
        }))
      }

      // DATA CONSISTENCY: Emit event to update task list
      window.dispatchEvent(new CustomEvent('task_status_changed', {
        detail: { taskId, status: 'IN_PROGRESS' }
      }))

      // Recheck active task status
      if (checkActiveTask) {
        const activeTaskData = await checkActiveTask()
        setHasActiveTask(activeTaskData?.hasActiveTask || false)
      }
    } catch (err) {
      setStartError(err.message || 'Failed to start task. Please try again.')
    } finally {
      setIsStarting(false)
    }
  }

  // Handle mark complete (worker)
  const handleMarkComplete = async () => {
    // FRONTEND GUARD: Prevent double actions
    if (isMarkingComplete || !user?.id || !taskId) {
      return
    }

    // FRONTEND GUARD: Check task status
    const currentStatus = task?.rawStatus || task?.status
    if (currentStatus !== 'IN_PROGRESS') {
      setMarkCompleteError('Task must be in progress to mark as complete')
      return
    }

    // FRONTEND GUARD: Check if already marked
    if (task?.workerCompleted) {
      setMarkCompleteError('Task has already been marked as complete')
      return
    }

    try {
      setIsMarkingComplete(true)
      setMarkCompleteError(null)

      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/mark-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ workerId: user.id })
      })

      if (!response.ok) {
        const errorData = await response.json()

        // STATE RECOVERY: For errors, refetch task to ensure UI matches backend
        if (response.status === 400 || response.status === 403 || response.status === 409) {
          setTimeout(() => fetchTaskRef.current(true), 500)
        }

        throw new Error(errorData.message || 'Failed to mark task as complete')
      }

      // DATA CONSISTENCY: Refresh task data
      const refreshParams = new URLSearchParams()
      if (userMode === 'worker' && workerLocation && workerLocation.lat && workerLocation.lng) {
        refreshParams.append('lat', workerLocation.lat)
        refreshParams.append('lng', workerLocation.lng)
      }
      if (user && user.id) {
        refreshParams.append('userId', user.id)
      }

      const refreshUrl = `${API_BASE_URL}/api/tasks/${taskId}${refreshParams.toString() ? `?${refreshParams.toString()}` : ''}`
      const refreshResponse = await fetch(refreshUrl)
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        const backendTask = refreshData.task

        setTask(prev => ({
          ...prev,
          workerCompleted: backendTask.workerCompleted || false,
          rawStatus: backendTask.status
        }))
      }

      // DATA CONSISTENCY: Emit event to update task list
      window.dispatchEvent(new CustomEvent('task_status_changed', {
        detail: { taskId, status: 'IN_PROGRESS' }
      }))
    } catch (err) {
      setMarkCompleteError(err.message || 'Failed to mark task as complete. Please try again.')
    } finally {
      setIsMarkingComplete(false)
    }
  }

  // Handle rate task (poster)
  const handleRateTask = async () => {
    if (!user?.id || !taskId || !rating) {
      setRatingError('Please select a rating')
      return
    }

    try {
      setIsRating(true)
      setRatingError(null)

      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          posterId: user.id,
          rating: rating,
          review: review.trim() || null
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to submit rating')
      }

      // Refresh task data
      const refreshParams = new URLSearchParams()
      if (user && user.id) {
        refreshParams.append('userId', user.id)
      }

      const refreshUrl = `${API_BASE_URL}/api/tasks/${taskId}${refreshParams.toString() ? `?${refreshParams.toString()}` : ''}`
      const refreshResponse = await fetch(refreshUrl)
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        const backendTask = refreshData.task

        setTask(prev => ({
          ...prev,
          rating: backendTask.rating || null,
          review: backendTask.review || null,
          ratedAt: backendTask.ratedAt || null
        }))
      }

      setRatingSuccess(true)
      setRating(0)
      setReview('')

      // DATA CONSISTENCY: Emit event to update profile and dashboard ratings
      window.dispatchEvent(new CustomEvent('task_rated', {
        detail: { taskId, rating }
      }))
    } catch (err) {
      setRatingError(err.message || 'Failed to submit rating. Please try again.')
    } finally {
      setIsRating(false)
    }
  }

  // Handle confirm complete (poster)
  const handleConfirmComplete = async () => {
    // FRONTEND GUARD: Prevent double actions
    if (isConfirming || !user?.id || !taskId) {
      return
    }

    // FRONTEND GUARD: Check task status and worker completion
    const currentStatus = task?.rawStatus || task?.status
    if (currentStatus !== 'IN_PROGRESS') {
      setConfirmError('Task must be in progress to confirm completion')
      return
    }

    if (!task?.workerCompleted) {
      setConfirmError('Worker has not marked this task as complete yet')
      return
    }

    try {
      setIsConfirming(true)
      setConfirmError(null)

      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/confirm-complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ posterId: user.id })
      })

      if (!response.ok) {
        const errorData = await response.json()

        // STATE RECOVERY: For errors, refetch task to ensure UI matches backend
        if (response.status === 400 || response.status === 403 || response.status === 409) {
          setTimeout(() => fetchTaskRef.current(true), 500)
        }

        throw new Error(errorData.message || 'Failed to confirm task completion')
      }

      // Refresh task data
      const refreshParams = new URLSearchParams()
      if (user && user.id) {
        refreshParams.append('userId', user.id)
      }

      const refreshUrl = `${API_BASE_URL}/api/tasks/${taskId}${refreshParams.toString() ? `?${refreshParams.toString()}` : ''}`
      const refreshResponse = await fetch(refreshUrl)
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        const backendTask = refreshData.task

        setTask(prev => ({
          ...prev,
          status: (backendTask.status === 'SEARCHING' || backendTask.status === 'OPEN') ? 'open' : backendTask.status.toLowerCase(),
          rawStatus: backendTask.status,
          completedAt: backendTask.completedAt || null,
          workerCompleted: backendTask.workerCompleted || false
        }))
      }
    } catch (err) {
      setConfirmError(err.message || 'Failed to confirm task completion. Please try again.')
    } finally {
      setIsConfirming(false)
    }
  }

  const handleBack = () => {
    // Check if user came from task list (worker mode)
    if (userMode === 'worker' && (location.state?.from === '/tasks' || window.history.length > 1)) {
      navigate('/tasks')
    } else {
      // Default to dashboard
      navigate('/dashboard')
    }
  }

  // Handle edit task success
  const handleEditSuccess = (updatedTask, reAlerted) => {
    fetchTaskRef.current(true)
    setShowEditModal(false)

    // Show success message
    if (reAlerted) {
      alert('Task updated successfully! Workers have been re-alerted about this task.')
    } else {
      alert('Task updated successfully!')
    }
  }

  // Handle delete task
  const handleDeleteTask = () => {
    setShowDeleteConfirm(true)
  }

  const confirmDeleteTask = async () => {
    setShowDeleteConfirm(false)

    if (!user?.id || !taskId) {
      setDeleteError('You must be logged in to delete tasks')
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ posterId: user.id })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to delete task')
      }

      // Navigate back to dashboard
      navigate('/dashboard', {
        state: { message: 'Task deleted successfully' }
      })
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete task. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelTask = () => {
    // FRONTEND GUARD: Prevent double actions
    if (isCancelling || !user?.id || !taskId) {
      return
    }

    // FRONTEND GUARD: Check task status
    const currentStatus = task?.rawStatus || task?.status
    if (currentStatus === 'COMPLETED') {
      setCancelError('Completed tasks cannot be cancelled')
      return
    }

    if (['CANCELLED', 'CANCELLED_BY_POSTER', 'CANCELLED_BY_WORKER', 'CANCELLED_BY_ADMIN'].includes(currentStatus)) {
      setCancelError('This task has already been cancelled')
      return
    }

    setShowCancelConfirm(true)
  }

  const confirmCancelTask = async () => {
    setShowCancelConfirm(false)

    try {
      setIsCancelling(true)
      setCancelError(null)

      const response = await fetch(`${API_BASE_URL}/api/tasks/${taskId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          userRole: userMode === 'worker' ? 'worker' : 'poster'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        // STATE RECOVERY: For errors, refetch task to ensure UI matches backend
        if (response.status === 400 || response.status === 403 || response.status === 409) {
          setTimeout(() => fetchTaskRef.current(true), 500)
        }

        throw new Error(errorData.message || 'Failed to cancel task')
      }

      // Refresh task data
      const refreshParams = new URLSearchParams()
      if (userMode === 'worker' && workerLocation && workerLocation.lat && workerLocation.lng) {
        refreshParams.append('lat', workerLocation.lat)
        refreshParams.append('lng', workerLocation.lng)
      }
      if (user && user.id) {
        refreshParams.append('userId', user.id)
      }

      const refreshUrl = `${API_BASE_URL}/api/tasks/${taskId}${refreshParams.toString() ? `?${refreshParams.toString()}` : ''}`
      const refreshResponse = await fetch(refreshUrl)
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        const backendTask = refreshData.task

        setTask(prev => ({
          ...prev,
          status: (backendTask.status === 'SEARCHING' || backendTask.status === 'OPEN') ? 'open' : backendTask.status.toLowerCase(),
          rawStatus: backendTask.status,
          posterPhone: backendTask.posterPhone || null,
          workerPhone: backendTask.workerPhone || null
        }))
      }

      // DATA CONSISTENCY: Emit event to update task list, dashboard, and activity
      const cancelledStatus = userMode === 'worker' ? 'CANCELLED_BY_WORKER' : 'CANCELLED_BY_POSTER'
      window.dispatchEvent(new CustomEvent('task_cancelled', {
        detail: { taskId, status: cancelledStatus }
      }))
      window.dispatchEvent(new CustomEvent('task_status_changed', {
        detail: { taskId, status: cancelledStatus }
      }))

      // Refresh cancellation status after successful cancellation (for workers)
      if (userMode === 'worker' && refreshStatus) {
        refreshStatus()
      }

      // Recheck active task status
      if (checkActiveTask) {
        const activeTaskData = await checkActiveTask()
        setHasActiveTask(activeTaskData?.hasActiveTask || false)
      }

      // Redirect based on mode
      if (userMode === 'worker') {
        navigate('/tasks')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setCancelError(err.message || 'Failed to cancel task. Please try again.')
    } finally {
      setIsCancelling(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      open: { text: 'Open', className: 'bg-green-50 text-green-700' },
      searching: { text: 'Searching', className: 'bg-green-50 text-green-700' },
      accepted: { text: 'Accepted', className: 'bg-blue-50 text-blue-700' },
      in_progress: { text: 'In Progress', className: 'bg-yellow-50 text-yellow-700' },
      completed: { text: 'Completed', className: 'bg-gray-50 text-gray-700' },
      cancelled: { text: 'Cancelled', className: 'bg-red-50 text-red-700' }
    }
    // Handle both frontend format (open) and backend format (SEARCHING)
    const normalizedStatus = (status === 'open' || status === 'SEARCHING' || status === 'OPEN') ? 'open' : status.toLowerCase()
    return badges[normalizedStatus] || badges.open
  }

  // Show loading state
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto w-full px-[3px] sm:px-4 overflow-x-hidden">
        <button
          onClick={handleBack}
          className="mb-6 sm:mb-8 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors py-2"
        >
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="font-medium text-base">Back</span>
        </button>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-base text-gray-600 dark:text-gray-400">Loading task details...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || !task) {
    return (
      <>
        <div className="max-w-5xl mx-auto w-full px-[3px] sm:px-4 overflow-x-hidden">
          <button
            onClick={handleBack}
            className="mb-6 sm:mb-8 flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors py-2"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-medium text-base">Back</span>
          </button>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 p-12 text-center">
            <svg className="h-16 w-16 text-red-300 dark:text-red-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {error === 'Task not found' ? 'Task not found' : 'Error loading task'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{error || 'The task you are looking for does not exist.'}</p>
            <button
              onClick={handleBack}
              className="px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 dark:bg-blue-500 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 active:scale-[0.98] min-h-[44px] touch-manipulation"
            >
              Go Back
            </button>
          </div>
        </div>
      </>
    )
  }

  // Determine current status for render logic
  const renderStatus = task?.rawStatus || task?.status
  const normalizedRenderStatus = renderStatus ? renderStatus.toString().toLowerCase() : ''
  const isTaskCompleted = normalizedRenderStatus === 'completed'

  const statusBadge = getStatusBadge(task.status || task.rawStatus)

  const renderPrimaryAction = () => {
    // Use rawStatus for backend status values, fallback to status for frontend format
    const currentStatus = task.rawStatus || task.status

    // IMPORTANT: Actions should be based on the user's relationship to THIS task,
    // not only on the global mode toggle.
    const myId = user?.id
    const postedById = task?.postedBy?._id || task?.postedBy
    const acceptedById = task?.acceptedBy?._id || task?.acceptedBy
    const isPosterForTask = myId && postedById && String(postedById) === String(myId)
    const isWorkerForTask = myId && acceptedById && String(acceptedById) === String(myId)

    // Prefer task-specific role:
    // - If you're the POSTER for this task, always show poster actions (including Confirm Completion),
    //   even if your global mode toggle is currently "worker".
    // - Else if you're the assigned WORKER, show worker actions.
    // - Else fall back to current mode (e.g., browsing tasks).

    // 1) Poster actions FIRST, so posters see confirm button even while in worker mode
    if (isPosterForTask || (!isWorkerForTask && userMode === 'poster')) {
      // Poster actions
      if (currentStatus === 'COMPLETED' || task.status === 'completed') {
        // Show rating UI if not rated yet
        if (!task.rating) {
          return (
            <div className="space-y-4">
              <div className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-base font-medium rounded-lg text-center">
                Task completed
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Rate the Worker</h3>
                {ratingError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400">{ratingError}</p>
                  </div>
                )}
                {ratingSuccess ? (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-400">Rating submitted successfully!</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`text-3xl transition-colors ${rating >= star ? 'text-yellow-400 dark:text-yellow-500' : 'text-gray-300 dark:text-gray-600'
                              } hover:text-yellow-400 dark:hover:text-yellow-500`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      {rating > 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{rating} out of 5 stars</p>
                      )}
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Review (optional)</label>
                      <textarea
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        rows={3}
                        className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
                        placeholder="Share your experience working with this worker..."
                      />
                    </div>
                    <button
                      onClick={handleRateTask}
                      disabled={isRating || rating === 0}
                      className="w-full px-5 sm:px-6 py-3 sm:py-3.5 bg-blue-600 dark:bg-blue-500 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[52px] touch-manipulation"
                    >
                      {isRating ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        'Submit Rating'
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        }

        // Already rated: simple completed state
        return (
          <div className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-base font-medium rounded-lg text-center">
            Task completed
          </div>
        )
      } else if (currentStatus === 'IN_PROGRESS' || task.status === 'in_progress') {
        // Poster view while task is IN_PROGRESS
        return (
          <div className="space-y-3">
            <div className="w-full px-6 py-4 bg-yellow-50 text-yellow-700 text-base font-medium rounded-lg text-center">
              Task in progress
            </div>
            {task.workerCompleted ? (
              <>
                <div className="w-full px-6 py-4 bg-green-50 text-green-700 text-base font-medium rounded-lg text-center border-2 border-green-200">
                  Worker has marked this task as completed
                </div>
                {confirmError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{confirmError}</p>
                  </div>
                )}
                <button
                  onClick={handleConfirmComplete}
                  disabled={isConfirming}
                  className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-green-600 dark:bg-green-500 text-white text-base sm:text-lg font-semibold rounded-xl hover:bg-green-700 dark:hover:bg-green-600 transition-all duration-200 active:scale-[0.98] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[52px] touch-manipulation"
                >
                  {isConfirming ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Confirming...
                    </>
                  ) : (
                    'Confirm Completion'
                  )}
                </button>
              </>
            ) : (
              <div className="w-full px-6 py-3 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-lg text-center">
                Waiting for worker to mark task as completed
              </div>
            )}
          </div>
        )
      } else if (currentStatus === 'ACCEPTED' || task.status === 'accepted') {
        return (
          <div className="space-y-3">
            <div className="w-full px-6 py-4 bg-blue-50 text-blue-700 text-base font-medium rounded-lg text-center">
              Worker assigned: {task.worker || 'Worker'}
            </div>
            {cancelError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{cancelError}</p>
              </div>
            )}
            <button
              onClick={handleCancelTask}
              disabled={isCancelling}
              className="w-full px-5 sm:px-6 py-3 sm:py-3.5 bg-red-600 dark:bg-red-500 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-red-700 dark:hover:bg-red-600 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 min-h-[48px] sm:min-h-[52px] touch-manipulation"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Task'}
            </button>
          </div>
        )
      } else if (currentStatus === 'SEARCHING' || currentStatus === 'OPEN' || task.status === 'open') {
        // Poster can edit, delete, or cancel while searching/open
        return (
          <div className="space-y-3">
            {cancelError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{cancelError}</p>
              </div>
            )}
            {deleteError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{deleteError}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setShowIncreaseBudgetModal(true)}
                className="px-4 py-3 bg-emerald-600 dark:bg-emerald-500 text-white text-base font-medium rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Increase Budget
              </button>
              <button
                onClick={() => setShowEditModal(true)}
                className="px-5 sm:px-6 py-3 sm:py-3.5 bg-blue-600 dark:bg-blue-500 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[52px] touch-manipulation"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </button>
              <button
                onClick={handleDeleteTask}
                disabled={isDeleting}
                className="px-5 sm:px-6 py-3 sm:py-3.5 bg-red-600 dark:bg-red-500 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-red-700 dark:hover:bg-red-600 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[52px] touch-manipulation"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </>
                )}
              </button>
            </div>
            <button
              onClick={handleCancelTask}
              disabled={isCancelling}
              className="w-full px-5 sm:px-6 py-3 sm:py-3.5 bg-red-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-red-700 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 min-h-[48px] sm:min-h-[52px] touch-manipulation"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Task'}
            </button>
          </div>
        )
      }
    }

    // 2) Worker actions next
    if (isWorkerForTask || (!isPosterForTask && userMode === 'worker')) {
      if (currentStatus === 'SEARCHING' || currentStatus === 'OPEN' || task.status === 'open') {
        // FRONTEND GUARDS: Calculate if Accept button should be disabled
        const isOwnTask = task?.postedBy?._id === user?.id || task?.postedBy === user?.id
        const isTaskOpen = currentStatus === 'SEARCHING' || currentStatus === 'OPEN' || task.status === 'open'
        const shouldDisable = isAccepting ||
          cancellationStatus.limitReached ||
          !isOnline ||
          hasActiveTask ||
          !isTaskOpen ||
          isOwnTask ||
          checkingActiveTask

        return (
          <>
            {acceptSuccess ? (
              <div className="w-full px-6 py-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-base font-medium rounded-lg text-center">
                You have accepted this task
              </div>
            ) : (
              <>
                {!isOnline && (
                  <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-1">You are offline</p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-400">You must be online (ON DUTY) to accept tasks.</p>
                      </div>
                    </div>
                  </div>
                )}
                {hasActiveTask && (
                  <div className="mb-4 p-4 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-orange-900 dark:text-orange-300 mb-1">Active task exists</p>
                        <p className="text-sm text-orange-700 dark:text-orange-400">You already have an active task. Please complete or cancel it first.</p>
                      </div>
                    </div>
                  </div>
                )}
                {cancellationStatus.limitReached && (
                  <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-red-900 dark:text-red-300 mb-1">Daily Cancellation Limit Reached</p>
                        <p className="text-sm text-red-700 dark:text-red-400">You have reached today's cancellation limit. You cannot accept new tasks until tomorrow.</p>
                      </div>
                    </div>
                  </div>
                )}
                {isOwnTask && (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <p className="text-sm text-gray-700 dark:text-gray-300">You cannot accept your own task.</p>
                  </div>
                )}
                {acceptError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400">{acceptError}</p>
                  </div>
                )}
                <button
                  onClick={handleAcceptTask}
                  disabled={shouldDisable}
                  className="w-full px-6 py-4 bg-blue-600 dark:bg-blue-500 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAccepting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Accepting...
                    </>
                  ) : cancellationStatus.limitReached ? (
                    'Cannot Accept (Limit Reached)'
                  ) : !isOnline ? (
                    'Go Online to Accept'
                  ) : hasActiveTask ? (
                    'Complete Active Task First'
                  ) : isOwnTask ? (
                    'Cannot Accept Own Task'
                  ) : (
                    'Accept Task'
                  )}
                </button>
              </>
            )}
          </>
        )
      } else if (currentStatus === 'ACCEPTED' || task.status === 'accepted') {
        return (
          <div className="space-y-3">
            <div className="w-full px-6 py-4 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-base font-medium rounded-lg text-center">
              You have accepted this task
            </div>
            {startError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{startError}</p>
              </div>
            )}
            <button
              onClick={handleStartTask}
              disabled={isStarting}
              className="w-full px-6 py-4 bg-green-600 dark:bg-green-500 text-white text-lg font-semibold rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isStarting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Starting...
                </>
              ) : (
                'Start Task'
              )}
            </button>
            {cancelError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{cancelError}</p>
              </div>
            )}
            <button
              onClick={handleCancelTask}
              disabled={isCancelling}
              className="w-full px-5 sm:px-6 py-3 sm:py-3.5 bg-red-600 dark:bg-red-500 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-red-700 dark:hover:bg-red-600 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 min-h-[48px] sm:min-h-[52px] touch-manipulation"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Task'}
            </button>
          </div>
        )
      } else if (currentStatus === 'IN_PROGRESS' || task.status === 'in_progress') {
        return (
          <div className="space-y-3">
            <div className="w-full px-6 py-4 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-base font-medium rounded-lg text-center">
              Task in progress
            </div>
            {task.workerCompleted ? (
              <>
                {/* Worker mode: Never show Confirm Completion button - only poster can confirm */}
                <div className="w-full px-6 py-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-base font-medium rounded-lg text-center border-2 border-green-200 dark:border-green-800">
                  Worker has marked this task as completed
                </div>
              </>
            ) : (
              <div className="w-full px-6 py-3 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-lg text-center">
                Waiting for worker to mark task as completed
              </div>
            )}
            {markCompleteError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{markCompleteError}</p>
              </div>
            )}
            {task.workerCompleted ? (
              <div className="w-full px-6 py-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-base font-medium rounded-lg text-center">
                You have marked this task as complete. Waiting for poster confirmation.
              </div>
            ) : (
              <button
                onClick={handleMarkComplete}
                disabled={isMarkingComplete}
                className="w-full px-6 py-4 bg-green-600 dark:bg-green-500 text-white text-lg font-semibold rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isMarkingComplete ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Marking...
                  </>
                ) : (
                  'Mark as Completed'
                )}
              </button>
            )}
            {cancelError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{cancelError}</p>
              </div>
            )}
            <button
              onClick={handleCancelTask}
              disabled={isCancelling}
              className="w-full px-5 sm:px-6 py-3 sm:py-3.5 bg-red-600 dark:bg-red-500 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-red-700 dark:hover:bg-red-600 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 min-h-[48px] sm:min-h-[52px] touch-manipulation"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Task'}
            </button>
          </div>
        )
      } else if (currentStatus === 'COMPLETED' || task.status === 'completed') {
        return (
          <div className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-base font-medium rounded-lg text-center">
            Task completed
          </div>
        )
      } else if (currentStatus === 'CANCELLED' || task.status === 'cancelled') {
        return (
          <div className="w-full px-6 py-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-base font-medium rounded-lg text-center">
            Task cancelled
          </div>
        )
      }
    } else if (isPosterForTask || userMode === 'poster') {
      // Poster actions
      if (currentStatus === 'COMPLETED' || task.status === 'completed') {
        // Show rating UI if not rated yet
        if (!task.rating) {
          return (
            <div className="space-y-4">
              <div className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-base font-medium rounded-lg text-center">
                Task completed
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Rate the Worker</h3>
                {ratingError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-400">{ratingError}</p>
                  </div>
                )}
                {ratingSuccess ? (
                  <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-400">Rating submitted successfully!</p>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className={`text-3xl transition-colors ${rating >= star ? 'text-yellow-400 dark:text-yellow-500' : 'text-gray-300 dark:text-gray-600'
                              } hover:text-yellow-400 dark:hover:text-yellow-500`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                      {rating > 0 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{rating} out of 5 stars</p>
                      )}
                    </div>
                    <div className="mb-4">
                      <label htmlFor="review" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Review (Optional)
                      </label>
                      <textarea
                        id="review"
                        value={review}
                        onChange={(e) => setReview(e.target.value)}
                        placeholder="Share your experience with this worker..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                        rows="4"
                      />
                    </div>
                    <button
                      onClick={handleRateTask}
                      disabled={isRating || rating === 0}
                      className="w-full px-6 py-3 bg-blue-600 dark:bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isRating ? 'Submitting...' : 'Submit Rating'}
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        }

        // Show submitted rating if rated
        if (task.rating) {
          return (
            <div className="space-y-3">
              <div className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-base font-medium rounded-lg text-center">
                Task completed
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Your Rating</h3>
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-2xl ${task.rating >= star ? 'text-yellow-400 dark:text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">({task.rating}/5)</span>
                </div>
                {task.review && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-2 italic">"{task.review}"</p>
                )}
              </div>
            </div>
          )
        }

        return (
          <div className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-base font-medium rounded-lg text-center">
            Task completed
          </div>
        )
      } else if (currentStatus === 'SEARCHING' || task.status === 'open') {
        return (
          <div className="space-y-3">
            <div className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-base rounded-lg text-center">
              Waiting for workers to accept
            </div>
            {cancelError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{cancelError}</p>
              </div>
            )}
            <button
              onClick={handleCancelTask}
              disabled={isCancelling}
              className="w-full px-5 sm:px-6 py-3 sm:py-3.5 bg-red-600 dark:bg-red-500 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-red-700 dark:hover:bg-red-600 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 min-h-[48px] sm:min-h-[52px] touch-manipulation"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Task'}
            </button>
          </div>
        )
      } else if (currentStatus === 'ACCEPTED' || task.status === 'accepted') {
        return (
          <div className="space-y-3">
            <div className="w-full px-6 py-4 bg-blue-50 text-blue-700 text-base font-medium rounded-lg text-center">
              Worker assigned: {task.worker || 'Worker'}
            </div>
            {cancelError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-400">{cancelError}</p>
              </div>
            )}
            <button
              onClick={handleCancelTask}
              disabled={isCancelling}
              className="w-full px-5 sm:px-6 py-3 sm:py-3.5 bg-red-600 dark:bg-red-500 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-red-700 dark:hover:bg-red-600 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 min-h-[48px] sm:min-h-[52px] touch-manipulation"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Task'}
            </button>
          </div>
        )
      } else if (currentStatus === 'IN_PROGRESS' || task.status === 'in_progress') {
        return (
          <div className="space-y-3">
            <div className="w-full px-6 py-4 bg-yellow-50 text-yellow-700 text-base font-medium rounded-lg text-center">
              Task in progress
            </div>
            {task.workerCompleted ? (
              <>
                <div className="w-full px-6 py-4 bg-green-50 text-green-700 text-base font-medium rounded-lg text-center border-2 border-green-200">
                  Worker has marked this task as completed
                </div>
                {confirmError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{confirmError}</p>
                  </div>
                )}
                <button
                  onClick={handleConfirmComplete}
                  disabled={isConfirming}
                  className="w-full px-5 sm:px-6 py-3.5 sm:py-4 bg-green-600 dark:bg-green-500 text-white text-base sm:text-lg font-semibold rounded-xl hover:bg-green-700 dark:hover:bg-green-600 transition-all duration-200 active:scale-[0.98] shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 min-h-[48px] sm:min-h-[52px] touch-manipulation"
                >
                  {isConfirming ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Confirming...
                    </>
                  ) : (
                    'Confirm Completion'
                  )}
                </button>
              </>
            ) : (
              <div className="w-full px-6 py-3 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-lg text-center">
                Waiting for worker to mark task as completed
              </div>
            )}
          </div>
        )
      } else if (currentStatus === 'COMPLETED' || task.status === 'completed') {
        return (
          <div className="w-full px-6 py-4 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-base font-medium rounded-lg text-center">
            Task completed
          </div>
        )
      } else if (currentStatus === 'CANCELLED' || task.status === 'cancelled') {
        return (
          <div className="w-full px-6 py-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-base font-medium rounded-lg text-center">
            Task cancelled
          </div>
        )
      }
    }
    return null
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 overflow-x-hidden">
      {/* Back Button */}
      {/* Back Button - show only on medium+ screens */}
      <button
        onClick={handleBack}
        className="hidden sm:flex mb-6 sm:mb-8 lg:mb-10 items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors py-2 touch-manipulation"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        <span className="font-semibold text-base">Back</span>
      </button>

      {/* Task Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-5 sm:p-6 lg:p-8">
          {/* Header with Status */}
          <div className="mb-6 sm:mb-8 lg:mb-10">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 flex-wrap">
              <span className="inline-flex items-center px-2.5 sm:px-3 py-1 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg">
                {task.category}
              </span>
              <StatusBadge status={task.status || task.rawStatus} />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 leading-tight">
              {task.title}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
              {userMode === 'worker' ? `Posted by ${task.postedByName || 'User'}` : 'Your task'} • {task.postedTime}
            </p>
          </div>

          {/* Description */}
          <div className="mb-6 sm:mb-8 lg:mb-10 pb-6 sm:pb-8 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-3 sm:mb-4">Description</h2>
            <p className="text-sm sm:text-base lg:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {task.description}
            </p>
          </div>

          {/* Task Details Grid */}
          <div className="space-y-5 sm:space-y-6 lg:space-y-7 mb-6 sm:mb-8 lg:mb-10">
            {/* Budget Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/30 dark:to-green-900/50 rounded-xl p-5 sm:p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 sm:gap-3 mb-3">
                <div className="p-2 bg-green-200 dark:bg-green-800 rounded-xl flex-shrink-0">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-green-700 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-bold text-green-700 dark:text-green-400 uppercase tracking-wide">Budget</span>
              </div>
              <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 leading-none">{task.budget}</p>
            </div>

            {/* Location Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-gray-900/50">
              <div className="flex items-center gap-2 sm:gap-3 mb-4">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex-shrink-0">
                  <svg className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Location</span>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 leading-tight">{task.location}</p>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{task.city}</p>
                  {userMode === 'worker' && (
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      {task.distance}
                    </p>
                  )}
                </div>
                {task.coordinates && task.coordinates.length === 2 && (
                  <>
                    <a
                      href={`https://www.google.com/maps?q=${task.coordinates[1]},${task.coordinates[0]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-blue-600 dark:bg-blue-500 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 active:scale-[0.98] min-h-[44px] touch-manipulation"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      Open in Google Maps
                    </a>
                    <div className="w-full max-w-[500px] mt-4 sm:mt-5">
                      <TaskLocationMap
                        coordinates={task.coordinates}
                        locationName={`${task.location}, ${task.city}`}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Schedule & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-gray-900/50">
                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                  <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl flex-shrink-0">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Scheduled Time</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mt-1 leading-tight">{task.time}</p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl p-5 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-gray-900/50">
                <div className="flex items-center gap-2 sm:gap-3 mb-3">
                  <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-xl flex-shrink-0">
                    <svg className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Expected Duration</span>
                </div>
                <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mt-1 leading-tight">{task.duration}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Task Timeline */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-5 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-5 sm:mb-6 lg:mb-8 leading-tight">Task Timeline</h3>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700"></div>

            <div className="space-y-6">
              {/* Step 1: Task Posted */}
              <div className="relative flex items-start gap-4">
                <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${task.rawStatus === 'SEARCHING' || task.rawStatus === 'ACCEPTED' || task.rawStatus === 'IN_PROGRESS' || task.rawStatus === 'COMPLETED'
                  ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                  }`}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">Task Posted</h4>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{task.postedTime}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Task was created and is now searching for workers</p>
                </div>
              </div>

              {/* Step 2: Task Accepted */}
              {(task.rawStatus === 'ACCEPTED' || task.rawStatus === 'IN_PROGRESS' || task.rawStatus === 'COMPLETED') && (
                <div className="relative flex items-start gap-4">
                  <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${task.rawStatus === 'ACCEPTED' || task.rawStatus === 'IN_PROGRESS' || task.rawStatus === 'COMPLETED'
                    ? 'bg-blue-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                    }`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">Task Accepted</h4>
                      {task.rawStatus === 'ACCEPTED' && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Current Step</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {userMode === 'worker' ? 'You accepted this task' : 'Worker has accepted this task'}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 3: Task Started (In Progress) */}
              {(task.rawStatus === 'IN_PROGRESS' || task.rawStatus === 'COMPLETED') && (
                <div className="relative flex items-start gap-4">
                  <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${task.rawStatus === 'IN_PROGRESS' || task.rawStatus === 'COMPLETED'
                    ? 'bg-yellow-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                    }`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">Task Started</h4>
                      {task.rawStatus === 'IN_PROGRESS' && !task.workerCompleted && (
                        <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Current Step</span>
                      )}
                      {task.startedAt && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(task.startedAt).toLocaleString('en-IN', {
                            hour: 'numeric',
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {userMode === 'worker' ? 'You started working on this task' : 'Worker has started working on this task'}
                    </p>
                  </div>
                </div>
              )}

              {/* Step 4: Worker Marked Complete */}
              {task.workerCompleted && (
                <div className="relative flex items-start gap-4">
                  <div className={`relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${task.rawStatus === 'IN_PROGRESS' && task.workerCompleted
                    ? 'bg-orange-500 text-white' : task.rawStatus === 'COMPLETED' ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                    }`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">Worker Marked Complete</h4>
                      {task.rawStatus === 'IN_PROGRESS' && task.workerCompleted && (
                        <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Waiting for Confirmation</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {userMode === 'worker'
                        ? 'You marked this task as complete. Waiting for poster confirmation.'
                        : 'Worker has marked this task as complete. Please confirm completion.'}
                    </p>
                    {userMode === 'poster' && task.rawStatus === 'IN_PROGRESS' && task.workerCompleted && (
                      <p className="text-sm text-orange-600 dark:text-orange-400 font-medium mt-2">Action Required: Confirm completion above</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Task Completed */}
              {task.rawStatus === 'COMPLETED' && (
                <div className="relative flex items-start gap-4">
                  <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-green-500 text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-base font-semibold text-gray-900 dark:text-gray-100">Task Completed</h4>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Completed</span>
                      {task.completedAt && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(task.completedAt).toLocaleString('en-IN', {
                            hour: 'numeric',
                            minute: '2-digit',
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {userMode === 'worker'
                        ? 'Task has been completed and confirmed by the poster'
                        : 'You confirmed the task completion. Task is now closed.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contact Information - Only show when task is active (not completed) and phone is available */}
        {!isTaskCompleted && (task.posterPhone || task.workerPhone) && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/30 p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4">Contact Information</h3>
            <div className="space-y-4">
              {userMode === 'worker' && task.posterPhone && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">Task Creator</p>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-gray-900 dark:text-gray-100">{task.posterPhone}</span>
                    <a
                      href={`tel:${task.posterPhone}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Call
                    </a>
                  </div>
                </div>
              )}
              {userMode === 'poster' && task.workerPhone && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">Assigned Worker</p>
                  <div className="flex items-center justify-between">
                    <span className="text-base font-medium text-gray-900 dark:text-gray-100">{task.workerPhone}</span>
                    <a
                      href={`tel:${task.workerPhone}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Call
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Primary Action Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-6 sm:p-8">
          <div className="max-w-md mx-auto space-y-4">
            {renderPrimaryAction()}

            {/* Report Button */}
            {user && task && (
              <button
                onClick={() => setShowReportModal(true)}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Report Issue
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      {task && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          taskId={taskId}
          reportedUserId={userMode === 'worker' ? task?.postedBy?._id : task?.acceptedBy?._id}
          taskTitle={task?.title}
        />
      )}

      {/* Edit Task Modal */}
      {showEditModal && task && (
        <EditTaskModal
          task={task}
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Increase Budget Modal */}
      {showIncreaseBudgetModal && task && (
        <IncreaseBudgetModal
          task={task}
          isOpen={showIncreaseBudgetModal}
          onClose={() => setShowIncreaseBudgetModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Cancel Task Confirmation Modal */}
      <ConfirmationModal
        isOpen={showCancelConfirm}
        onConfirm={confirmCancelTask}
        onCancel={() => setShowCancelConfirm(false)}
        title="Cancel Task"
        message="Are you sure you want to cancel this task? This action cannot be undone."
        confirmText="Yes, Cancel Task"
        cancelText="Keep Task"
        confirmColor="red"
      />

      {/* Delete Task Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onConfirm={confirmDeleteTask}
        onCancel={() => setShowDeleteConfirm(false)}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone and the task will be permanently removed."
        confirmText="Yes, Delete"
        cancelText="Keep Task"
        confirmColor="red"
      />
    </div>
  )
}

export default TaskDetail
