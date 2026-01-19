import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useUserMode } from '../context/UserModeContext'
import { useSocket } from '../context/SocketContext'
import { useAvailability } from '../context/AvailabilityContext'
import { useAuth } from '../context/AuthContext'
import { useCancellation } from '../context/CancellationContext'
import StatusBadge from '../components/StatusBadge'
import { API_BASE_URL } from '../config/env'
import { performStateRecovery } from '../utils/stateRecovery'
import { reverseGeocode } from '../utils/geocoding'

function Dashboard() {
    const { userMode } = useUserMode()
    const { getSocket } = useSocket()
    const { isOnline, workerLocation, setOnline } = useAvailability()
    const { user } = useAuth()
    const { cancellationStatus } = useCancellation()
    const [availableTasks, setAvailableTasks] = useState([])
    const [locationError, setLocationError] = useState(null)
    const [requestingLocation, setRequestingLocation] = useState(false)
    const [hasLocationPermission, setHasLocationPermission] = useState(false)
    const newTaskHighlightRef = useRef(new Set())
    const fetchingRef = useRef({ workerStats: false, posterStats: false, acceptedTasks: false, postedTasks: false, availableTasks: false })

    const [acceptedTasks, setAcceptedTasks] = useState([])
    const [workerStats, setWorkerStats] = useState({
        totalEarnings: 0,
        earningsThisMonth: 0,
        averageRating: 0
    })
    const [posterStats, setPosterStats] = useState({
        tasksPosted: 0,
        inProgress: 0,
        completed: 0,
        cancelled: 0
    })
    const [pendingConfirmations, setPendingConfirmations] = useState([])

    // DATA CONSISTENCY: Fetch worker stats (earnings, rating) - always fresh from backend
    const fetchWorkerStats = useCallback(async () => {
        if (userMode !== 'worker' || !user?.id || fetchingRef.current.workerStats) {
            return
        }

        fetchingRef.current.workerStats = true
        try {
            const token = localStorage.getItem('kaam247_token')
            const [earningsResponse, profileResponse] = await Promise.all([
                fetch(`${API_BASE_URL}/api/users/me/earnings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_BASE_URL}/api/users/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ])

            if (earningsResponse.ok) {
                const earningsData = await earningsResponse.json()
                setWorkerStats(prev => ({
                    ...prev,
                    totalEarnings: earningsData.earnings.total || 0,
                    earningsThisMonth: earningsData.earnings.thisMonth || 0
                }))
            }

            if (profileResponse.ok) {
                const profileData = await profileResponse.json()
                setWorkerStats(prev => ({
                    ...prev,
                    averageRating: profileData.user.averageRating || 0
                }))
            }
        } catch (err) {
            console.error('Error fetching worker stats:', err)
        } finally {
            fetchingRef.current.workerStats = false
        }
    }, [userMode, user?.id])

    useEffect(() => {
        if (userMode === 'worker' && user?.id) {
            fetchWorkerStats()
        }
    }, [userMode, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch poster stats
    const fetchPosterStats = useCallback(async () => {
        if (userMode !== 'poster' || !user?.id || fetchingRef.current.posterStats) {
            return
        }

        fetchingRef.current.posterStats = true
        try {
            const token = localStorage.getItem('kaam247_token')
            const activityResponse = await fetch(`${API_BASE_URL}/api/users/me/activity`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (activityResponse.ok) {
                const activityData = await activityResponse.json()
                setPosterStats({
                    tasksPosted: activityData.activity.posted.length,
                    inProgress: activityData.activity.posted.filter(t => t.status === 'IN_PROGRESS').length,
                    completed: activityData.activity.completed.filter(t => t.role === 'Poster').length,
                    cancelled: activityData.activity.cancelled.filter(t => t.role === 'Poster').length
                })
            }
        } catch (err) {
            console.error('Error fetching poster stats:', err)
        } finally {
            fetchingRef.current.posterStats = false
        }
    }, [userMode, user?.id])

    // Always fetch a tiny subset: tasks posted by me that are waiting for my confirmation.
    // This is intentionally shown even in worker mode so posters can confirm completion
    // without switching Activity tabs/mode.
    const fetchPendingConfirmations = useCallback(async () => {
        if (!user?.id) return
        try {
            const token = localStorage.getItem('kaam247_token')
            if (!token) return

            const res = await fetch(`${API_BASE_URL}/api/users/me/activity`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (!res.ok) return
            const data = await res.json()

            // Heuristic: backend activity items include role + status fields.
            // We treat "worker completed" as items in-progress requiring poster confirmation.
            const posted = data?.activity?.posted || []
            const needsConfirm = posted.filter(t =>
                (t.status === 'IN_PROGRESS' || t.status === 'in_progress') &&
                (t.workerCompleted === true || t.isWorkerCompleted === true || t.completedByWorker === true)
            )

            setPendingConfirmations(needsConfirm.slice(0, 3))
        } catch (e) {
            // silent
        }
    }, [user?.id])

    useEffect(() => {
        if (userMode === 'poster' && user?.id) {
            fetchPosterStats()
        }
    }, [userMode, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchPendingConfirmations()
    }, [user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

    // STATE RECOVERY: Page load recovery sequence (only on initial mount, skip if stats already fetched)
    useEffect(() => {
        if (!user?.id) return

        const recoverState = async () => {
            try {
                // Only recover if stats haven't been fetched yet
                if (fetchingRef.current.workerStats || fetchingRef.current.posterStats) {
                    return
                }

                const recoveredState = await performStateRecovery(userMode, user.id)

                // Update stats if recovered
                if (recoveredState?.stats) {
                    if (userMode === 'worker') {
                        setWorkerStats(prev => ({
                            ...prev,
                            ...recoveredState.stats
                        }))
                    } else {
                        setPosterStats(prev => ({
                            ...prev,
                            ...recoveredState.stats
                        }))
                    }
                }
            } catch (error) {
                console.error('State recovery failed:', error)
            }
        }

        // Only run recovery if we haven't fetched stats yet
        if (!fetchingRef.current.workerStats && !fetchingRef.current.posterStats) {
            recoverState()
        }
    }, [user?.id, userMode]) // Run on mount and mode change

    // STATE RECOVERY: Listen for socket reconnection
    useEffect(() => {
        const handleReconnect = async (event) => {
            const { userId, userMode: reconnectedMode } = event.detail

            if (userId === user?.id && reconnectedMode === userMode) {
                // Trigger state recovery
                try {
                    const recoveredState = await performStateRecovery(userMode, userId)

                    // Update stats
                    if (recoveredState?.stats) {
                        if (userMode === 'worker') {
                            setWorkerStats(prev => ({
                                ...prev,
                                ...recoveredState.stats
                            }))
                        } else {
                            setPosterStats(prev => ({
                                ...prev,
                                ...recoveredState.stats
                            }))
                        }
                    }
                } catch (error) {
                    console.error('Reconnection recovery failed:', error)
                }
            }
        }

        window.addEventListener('socket_reconnected', handleReconnect)
        return () => {
            window.removeEventListener('socket_reconnected', handleReconnect)
        }
    }, [user?.id, userMode])

    // STATE RECOVERY: Tab visibility change recovery
    useEffect(() => {
        if (!user?.id) return

        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                // Tab became visible - lightweight resync (only if online)
                if (userMode === 'worker' && isOnline) {
                    // Trigger task list refresh via event (debounced by refetch handler)
                    window.dispatchEvent(new CustomEvent('refetch_required', {
                        detail: { type: 'visibility_change' }
                    }))
                }
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [user?.id, userMode]) // Removed isOnline from deps - checked inside handler

    // STATE RECOVERY: Listen for refetch_required events (from socket events)
    useEffect(() => {
        const handleRefetch = async (event) => {
            const { type } = event.detail

            if (type === 'task_completed' || type === 'task_status_changed' || type === 'task_cancelled' || type === 'task_updated') {
                // Refresh stats silently
                if (userMode === 'worker' && user?.id) {
                    const token = localStorage.getItem('kaam247_token')
                    try {
                        const [earningsRes, profileRes] = await Promise.all([
                            fetch(`${API_BASE_URL}/api/users/me/earnings`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            }),
                            fetch(`${API_BASE_URL}/api/users/me`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            })
                        ])

                        if (earningsRes.ok) {
                            const earningsData = await earningsRes.json()
                            setWorkerStats(prev => ({
                                ...prev,
                                totalEarnings: earningsData.earnings.total || 0,
                                earningsThisMonth: earningsData.earnings.thisMonth || 0
                            }))
                        }

                        if (profileRes.ok) {
                            const profileData = await profileRes.json()
                            setWorkerStats(prev => ({
                                ...prev,
                                averageRating: profileData.user.averageRating || 0
                            }))
                        }
                    } catch (err) {
                        // Silent fail
                    }
                } else if (userMode === 'poster' && user?.id) {
                    fetchPosterStats()
                }
            }

            // Also refresh pending confirmations on relevant events
            if (type === 'task_status_changed' || type === 'task_updated' || type === 'task_completed') {
                fetchPendingConfirmations()
            }
        }

        window.addEventListener('refetch_required', handleRefetch)
        return () => {
            window.removeEventListener('refetch_required', handleRefetch)
        }
    }, [userMode, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

    // DATA CONSISTENCY: Listen for task completion and status changes to refresh stats
    useEffect(() => {
        if (!user?.id) return

        const handleTaskCompleted = () => {
            // DATA CONSISTENCY: Always refetch fresh stats from backend after task completion
            if (userMode === 'worker') {
                fetchWorkerStats()
            } else if (userMode === 'poster') {
                fetchPosterStats()
            }
        }

        const handleTaskStatusChanged = () => {
            // DATA CONSISTENCY: Always refetch fresh stats from backend after status change
            if (userMode === 'worker') {
                fetchWorkerStats()
            } else if (userMode === 'poster') {
                fetchPosterStats()
            }
        }

        const handleTaskCancelled = () => {
            // DATA CONSISTENCY: Refetch stats after cancellation
            if (userMode === 'worker') {
                fetchWorkerStats()
            } else if (userMode === 'poster') {
                fetchPosterStats()
            }
        }

        window.addEventListener('task_completed', handleTaskCompleted)
        window.addEventListener('task_status_changed', handleTaskStatusChanged)
        window.addEventListener('task_cancelled', handleTaskCancelled)

        return () => {
            window.removeEventListener('task_completed', handleTaskCompleted)
            window.removeEventListener('task_status_changed', handleTaskStatusChanged)
            window.removeEventListener('task_cancelled', handleTaskCancelled)
        }
    }, [userMode, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

    // DATA CONSISTENCY: Fetch accepted tasks for worker mode - always fresh from backend
    const fetchAcceptedTasks = useCallback(async () => {
        if (userMode !== 'worker' || !user?.id || fetchingRef.current.acceptedTasks) {
            return
        }

        fetchingRef.current.acceptedTasks = true
        try {
            // Fetch all tasks and filter by acceptedBy
            const response = await fetch(`${API_BASE_URL}/api/tasks`)
            if (response.ok) {
                const data = await response.json()
                const workerTasks = data.tasks
                    .filter(task => {
                        // Handle both ObjectId and populated object
                        const acceptedById = task.acceptedBy?._id ? task.acceptedBy._id.toString() : task.acceptedBy?.toString()
                        return acceptedById === user.id
                    })
                    .filter(task => task.status !== 'SEARCHING' && task.status !== 'OPEN' && task.status !== 'CANCELLED_BY_POSTER' && task.status !== 'CANCELLED_BY_WORKER' && task.status !== 'CANCELLED_BY_ADMIN')
                    .map((task) => ({
                        id: task._id,
                        title: task.title,
                        description: task.description,
                        location: task.location?.area
                            ? `${task.location.area}${task.location.city ? `, ${task.location.city}` : ''}`
                            : 'Location not specified',
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
                setAcceptedTasks(workerTasks)
            }
        } catch (err) {
            console.error('Error fetching accepted tasks:', err)
        } finally {
            fetchingRef.current.acceptedTasks = false
        }
    }, [userMode, user?.id])

    useEffect(() => {
        if (userMode === 'worker' && user?.id) {
            fetchAcceptedTasks()
        }
    }, [userMode, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

    // DATA CONSISTENCY: Refresh accepted tasks on task completion/status change
    useEffect(() => {
        if (userMode !== 'worker' || !user?.id) {
            return
        }

        const handleTaskCompleted = () => {
            // DATA CONSISTENCY: Always refetch fresh from backend
            fetchAcceptedTasks()
        }

        const handleTaskStatusChanged = () => {
            // DATA CONSISTENCY: Always refetch fresh from backend
            fetchAcceptedTasks()
        }

        const handleTaskCancelled = () => {
            // DATA CONSISTENCY: Always refetch fresh from backend
            fetchAcceptedTasks()
        }

        window.addEventListener('task_completed', handleTaskCompleted)
        window.addEventListener('task_status_changed', handleTaskStatusChanged)
        window.addEventListener('task_cancelled', handleTaskCancelled)

        return () => {
            window.removeEventListener('task_completed', handleTaskCompleted)
            window.removeEventListener('task_status_changed', handleTaskStatusChanged)
            window.removeEventListener('task_cancelled', handleTaskCancelled)
        }
    }, [userMode, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

    const [postedTasks, setPostedTasks] = useState([])

    // DATA CONSISTENCY: Fetch posted tasks for poster mode - always fresh from backend
    const fetchPostedTasks = useCallback(async () => {
        if (userMode !== 'poster' || !user?.id || fetchingRef.current.postedTasks) {
            return
        }

        fetchingRef.current.postedTasks = true
        try {
            const response = await fetch(`${API_BASE_URL}/api/tasks/user/${user.id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('kaam247_token')}`
                }
            })
            if (response.ok) {
                const data = await response.json()
                const transformedTasks = data.tasks.map((task) => ({
                    id: task._id,
                    title: task.title,
                    description: task.description,
                    location: task.location?.area
                        ? `${task.location.area}${task.location.city ? `, ${task.location.city}` : ''}`
                        : 'Location not specified',
                    budget: `₹${task.budget}`,
                    category: task.category,
                    status: task.status === 'SEARCHING' || task.status === 'OPEN' ? 'open' : task.status.toLowerCase(),
                    applicants: (task.status === 'SEARCHING' || task.status === 'OPEN') ? 0 : 1,
                    worker: task.acceptedBy ? 'Worker Assigned' : null,
                    scheduledAt: task.scheduledAt
                }))
                setPostedTasks(transformedTasks)
            }
        } catch (err) {
            console.error('Error fetching posted tasks:', err)
        } finally {
            fetchingRef.current.postedTasks = false
        }
    }, [userMode, user?.id])

    useEffect(() => {
        if (userMode === 'poster' && user?.id) {
            fetchPostedTasks()
        }
    }, [userMode, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

    // DATA CONSISTENCY: Listen for task_accepted events (for posters) - always refetch fresh
    useEffect(() => {
        if (userMode !== 'poster') {
            return
        }

        // Socket is optional - use polling fallback if socket unavailable
        const socket = getSocket()
        if (!socket || !socket.connected) {
            // Socket not available - use polling instead
            // Poll for task updates every 10 seconds
            const pollInterval = setInterval(() => {
                if (userMode === 'poster' && user?.id) {
                    fetchPostedTasks()
                }
            }, 10000)
            return () => clearInterval(pollInterval)
        }

        const handleTaskAccepted = () => {
            // DATA CONSISTENCY: Always refetch fresh from backend
            if (userMode === 'poster' && user?.id) {
                fetchPostedTasks()
            }
        }

        try {
            socket.on('task_accepted', handleTaskAccepted)
        } catch (error) {
            // Socket error - fallback to polling
            const pollInterval = setInterval(() => {
                if (userMode === 'poster' && user?.id) {
                    fetchPostedTasks()
                }
            }, 10000)
            return () => clearInterval(pollInterval)
        }

        return () => {
            if (socket) {
                try {
                    socket.off('task_accepted', handleTaskAccepted)
                } catch (error) {
                    // Ignore cleanup errors
                }
            }
        }
    }, [userMode, user?.id, getSocket]) // eslint-disable-line react-hooks/exhaustive-deps

    // DATA CONSISTENCY: Listen for task status changes to refresh posted tasks
    useEffect(() => {
        if (userMode !== 'poster' || !user?.id) {
            return
        }

        const handleTaskStatusChanged = () => {
            // DATA CONSISTENCY: Always refetch fresh from backend
            fetchPostedTasks()
        }

        const handleTaskCompleted = () => {
            // DATA CONSISTENCY: Always refetch fresh from backend
            fetchPostedTasks()
        }

        const handleTaskCancelled = () => {
            // DATA CONSISTENCY: Always refetch fresh from backend
            fetchPostedTasks()
        }

        window.addEventListener('task_status_changed', handleTaskStatusChanged)
        window.addEventListener('task_completed', handleTaskCompleted)
        window.addEventListener('task_cancelled', handleTaskCancelled)

        return () => {
            window.removeEventListener('task_status_changed', handleTaskStatusChanged)
            window.removeEventListener('task_completed', handleTaskCompleted)
            window.removeEventListener('task_cancelled', handleTaskCancelled)
        }
    }, [userMode, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

    // Request location permission if not available
    const requestLocation = useCallback(async () => {
        if (userMode !== 'worker') {
            return true
        }

        if (workerLocation && workerLocation.lat && workerLocation.lng) {
            setLocationError(null)
            setHasLocationPermission(true)
            return true
        }

        setRequestingLocation(true)
        setLocationError(null)

        try {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                })
            })

            const lat = position.coords.latitude
            const lng = position.coords.longitude
            
            const location = {
                lat,
                lng
            }

            // Store location in localStorage
            localStorage.setItem('kaam247_workerLocation', JSON.stringify(location))

            // Update availability context by triggering a location update event
            window.dispatchEvent(new CustomEvent('location_updated', { detail: location }))
            
            // Reverse geocode via backend (avoids browser CORS + Nominatim 403) and persist location
            try {
                const { area, city } = await reverseGeocode(lat, lng)
                const { persistUserLocation } = await import('../utils/locationPersistence')
                await persistUserLocation(lat, lng, area, city)
            } catch (geocodeError) {
                // Persist coordinates even if reverse geocoding fails
                const { persistUserLocation } = await import('../utils/locationPersistence')
                await persistUserLocation(lat, lng, null, null)
            }

            // Update state to trigger re-render
            setHasLocationPermission(true)
            setRequestingLocation(false)
            setLocationError(null)

            // Small delay to ensure context updates, then fetch tasks
            setTimeout(() => {
                fetchAvailableTasks()
            }, 100)

            return true
        } catch (error) {
            setRequestingLocation(false)
            setHasLocationPermission(false)
            let errorMessage = 'Location access is required to use this app.'
            if (error.code === 1) {
                errorMessage = 'Location permission denied. Please enable location access in your browser settings to use this app.'
            } else if (error.code === 2) {
                errorMessage = 'Location unavailable. Please check your device location settings.'
            } else if (error.code === 3) {
                errorMessage = 'Location request timed out. Please try again.'
            }
            setLocationError(errorMessage)
            return false
        }
    }, [userMode, workerLocation])

    // DATA CONSISTENCY: Fetch initial tasks for worker mode - always fresh from backend with location filtering
    const fetchAvailableTasks = useCallback(async () => {
        // Only fetch when in worker mode AND online
        if (userMode !== 'worker' || !isOnline || fetchingRef.current.availableTasks) {
            return
        }

        // REQUIRE LOCATION: Don't fetch tasks if no location
        if (!workerLocation || !workerLocation.lat || !workerLocation.lng) {
            setAvailableTasks([])
            // Try to get location
            await requestLocation()
            return
        }

        fetchingRef.current.availableTasks = true
        try {
            // Fetch tasks with location filter (5km radius)
            const url = `${API_BASE_URL}/api/tasks?lat=${workerLocation.lat}&lng=${workerLocation.lng}&radius=5`
            const response = await fetch(url)

            if (response.ok) {
                const data = await response.json()
                const transformedTasks = data.tasks
                    // Hide tasks posted by the current user (don't show your own tasks in worker list)
                    .filter(task => {
                        if (!user?.id) return true
                        // Handle both object format (task.postedBy._id) and string format (task.postedBy)
                        const postedById = task.postedBy?._id || task.postedBy
                        return String(postedById) !== String(user.id)
                    })
                    .filter(task => task.status === 'OPEN' || task.status === 'SEARCHING') // Only show available tasks
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

                setAvailableTasks(transformedTasks)
                setLocationError(null)
            }
        } catch (err) {
            console.error('Error fetching available tasks:', err)
        } finally {
            fetchingRef.current.availableTasks = false
        }
    }, [userMode, workerLocation, isOnline]) // Removed requestLocation from deps

    // Request location on mount for workers (only once)
    useEffect(() => {
        if (userMode === 'worker' && !hasLocationPermission && !requestingLocation) {
            requestLocation().then(hasLocation => {
                if (hasLocation) {
                    setHasLocationPermission(true)
                }
            })
        }
    }, [userMode]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (userMode === 'worker' && isOnline && user?.id && workerLocation?.lat && workerLocation?.lng) {
            fetchAvailableTasks()
        } else if (userMode === 'worker' && !isOnline) {
            // Clear tasks when going OFF DUTY
            setAvailableTasks([])
        }
    }, [userMode, isOnline, user?.id, workerLocation?.lat, workerLocation?.lng]) // eslint-disable-line react-hooks/exhaustive-deps

    // DATA CONSISTENCY: Refresh available tasks on task status changes
    useEffect(() => {
        if (userMode !== 'worker' || !isOnline) {
            return
        }

        const handleTaskStatusChanged = () => {
            // DATA CONSISTENCY: Always refetch fresh from backend
            fetchAvailableTasks()
        }

        const handleTaskCancelled = () => {
            // DATA CONSISTENCY: Always refetch fresh from backend
            fetchAvailableTasks()
        }

        window.addEventListener('task_status_changed', handleTaskStatusChanged)
        window.addEventListener('task_cancelled', handleTaskCancelled)

        return () => {
            window.removeEventListener('task_status_changed', handleTaskStatusChanged)
            window.removeEventListener('task_cancelled', handleTaskCancelled)
        }
    }, [userMode]) // eslint-disable-line react-hooks/exhaustive-deps

    // Listen for new tasks via Socket.IO (only when online and in worker mode)
    // Socket is optional - if unavailable, tasks are fetched via REST API polling
    useEffect(() => {
        if (!isOnline || userMode !== 'worker') {
            return
        }

        const socket = getSocket()
        if (!socket || !socket.connected) {
            // Socket not available - tasks are already fetched via REST API in fetchAvailableTasks()
            // No need for polling fallback here as fetchAvailableTasks() handles it
            return
        }

        const handleNewTask = (taskData) => {
            // CRITICAL: Don't show tasks posted by the current user (even if socket sends them)
            if (user?.id && taskData.postedBy) {
                const postedById = taskData.postedBy._id || taskData.postedBy
                if (String(postedById) === String(user.id)) {
                    return // Skip own tasks
                }
            }
            // Only add if task is within 5km (backend already filters, but double-check)
            if (taskData.distanceKm !== null && taskData.distanceKm !== undefined && taskData.distanceKm > 5) {
                return // Task is outside 5km radius
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
                    ? `${taskData.distanceKm.toFixed(1)} km away`
                    : 'Just added',
                distanceKm: taskData.distanceKm,
                budget: `₹${taskData.budget}`,
                category: taskData.category,
                time: 'Just now',
                status: 'open',
                isNew: true
            }

            // Add to list and sort by distance
            setAvailableTasks(prev => {
                const updated = [newTask, ...prev]
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
                setAvailableTasks(prev =>
                    prev.map(task =>
                        task.id === taskData.taskId
                            ? { ...task, isNew: false }
                            : task
                    )
                )
            }, 3000)
        }

        const handleRemoveTask = (data) => {
            setAvailableTasks(prev => prev.filter(task => task.id !== data.taskId))
        }

        socket.on('new_task', handleNewTask)
        socket.on('remove_task', handleRemoveTask)

        return () => {
            socket.off('new_task', handleNewTask)
            socket.off('remove_task', handleRemoveTask)
        }
    }, [isOnline, userMode, getSocket])

    return (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 overflow-x-hidden">
            {userMode === 'worker' ? (
                <>
                    {/* Location Requirement Block */}
                    {(!workerLocation || !workerLocation.lat || !workerLocation.lng) && (
                        <div className="mb-8 sm:mb-10 p-5 sm:p-6 lg:p-7 bg-red-50 border-2 border-red-200 rounded-xl">
                            <div className="flex items-start gap-4 sm:gap-5">
                                <div className="flex-shrink-0">
                                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg sm:text-xl font-bold text-red-900 mb-2 leading-tight">Location Access Required</h2>
                                    <p className="text-sm sm:text-base text-red-800 mb-4 sm:mb-5 leading-relaxed">
                                        {locationError || 'Location access is required to use this app. We need your location to show tasks near you (within 5km radius).'}
                                    </p>
                                    {requestingLocation ? (
                                        <div className="flex items-center gap-2.5 text-red-700">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600"></div>
                                            <span className="text-sm sm:text-base">Requesting location access...</span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={requestLocation}
                                            className="px-5 sm:px-6 py-2.5 sm:py-3 bg-red-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-red-700 transition-all duration-200 active:scale-[0.98] min-h-[44px] touch-manipulation"
                                        >
                                            Enable Location Access
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Mode Header - Worker Mode */}
                    <div className="mb-8 sm:mb-10 lg:mb-12">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">Perform Tasks</h1>
                        <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">
                            {workerLocation ? `Tasks within 5km of your location` : 'Find and complete tasks to earn money'}
                        </p>
                    </div>

                    {/* Cancellation Limit Warning */}
                    {cancellationStatus.limitReached && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div className="flex-1">
                                    <p className="text-sm font-semibold text-red-900 mb-1">Daily Cancellation Limit Reached</p>
                                    <p className="text-sm text-red-700">You have reached today's cancellation limit (2 tasks). You cannot accept new tasks until tomorrow.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    {!cancellationStatus.limitReached && cancellationStatus.dailyCancelCount > 0 && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-sm text-yellow-800">
                                <span className="font-semibold">Remaining cancellations today: {cancellationStatus.remainingCancellations}</span>
                            </p>
                        </div>
                    )}

                    {/* Primary Action - Worker Mode */}
                    <div className="mb-8 sm:mb-10 lg:mb-12">
                        <Link
                            to="/tasks"
                            className="inline-flex items-center justify-center w-full sm:w-auto px-8 sm:px-10 lg:px-12 py-3.5 sm:py-4 lg:py-4.5 bg-blue-600 text-white text-base sm:text-lg lg:text-xl font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] min-h-[48px] sm:min-h-[52px] touch-manipulation"
                        >
                            Find Tasks Near You
                        </Link>
                    </div>

                    {/* Task Stats - Worker Mode */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-5 lg:gap-6 mb-10 sm:mb-12 lg:mb-14">
                        <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6 lg:p-7 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-blue-50 rounded-xl flex-shrink-0">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                </div>
                                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Available Tasks</p>
                            </div>
                            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-none">
                                {isOnline ? availableTasks.length : 0}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6 lg:p-7 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-orange-50 rounded-xl flex-shrink-0">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Active Tasks</p>
                            </div>
                            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-none">{acceptedTasks.filter(t => t.status === 'accepted' || t.status === 'in_progress').length}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6 lg:p-7 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-green-50 rounded-xl flex-shrink-0">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Completed</p>
                            </div>
                            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-none">{acceptedTasks.filter(t => t.status === 'completed').length}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6 lg:p-7 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-purple-50 rounded-xl flex-shrink-0">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Earnings This Month</p>
                            </div>
                            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-none">₹{workerStats.earningsThisMonth}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6 lg:p-7 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-yellow-50 rounded-xl flex-shrink-0">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </div>
                                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Average Rating</p>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-none">
                                    {workerStats.averageRating > 0 ? workerStats.averageRating.toFixed(1) : '—'}
                                </p>
                                {workerStats.averageRating > 0 && (
                                    <span className="text-sm sm:text-base text-gray-500">/ 5</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Pending Confirmations (poster actions) - shown even in worker mode */}
                    {pendingConfirmations.length > 0 && (
                        <div className="mb-10 sm:mb-12 lg:mb-14">
                            <div className="flex items-center justify-between mb-5 sm:mb-6">
                                <div>
                                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2 leading-tight">Pending Confirmations</h2>
                                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Tasks you posted that need your confirmation</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pendingConfirmations.map((task) => (
                                    <Link
                                        key={task.id || task._id}
                                        to={`/tasks/${task.id || task._id}`}
                                        className="group bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 border border-green-200"
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-2">
                                            <h3 className="text-base font-semibold text-gray-900 group-hover:text-green-700 transition-colors flex-1 min-w-0 break-words">
                                                {task.title}
                                            </h3>
                                            <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-green-50 text-green-700 border border-green-200 whitespace-nowrap">
                                                Confirm
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2">
                                            Worker marked complete — open to confirm.
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Available Tasks Nearby */}
                    <div className="mb-10 sm:mb-12 lg:mb-14">
                        <div className="flex items-center justify-between mb-5 sm:mb-6">
                            <div>
                                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2 leading-tight">Available Tasks Nearby</h2>
                                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Tasks you can accept right now</p>
                            </div>
                            <Link
                                to="/tasks"
                                className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors whitespace-nowrap ml-4"
                            >
                                View all →
                            </Link>
                        </div>

                        {availableTasks.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                                {availableTasks.map((task) => (
                                    <Link
                                        key={task.id}
                                        to={`/tasks/${task.id}`}
                                        className={`group bg-white rounded-xl p-5 sm:p-6 lg:p-7 shadow-sm hover:shadow-lg transition-all duration-200 border-2 ${task.isNew || newTaskHighlightRef.current.has(task.id)
                                            ? 'border-blue-300 bg-blue-50/50'
                                            : 'border-gray-100 hover:border-gray-200'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-3 group-hover:text-blue-600 transition-colors">
                                                {task.title}
                                            </h3>
                                            <span className="inline-flex items-center px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded-md whitespace-nowrap">
                                                {task.category}
                                            </span>
                                        </div>
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="truncate">{task.location}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                                                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {task.budget}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                            <StatusBadge status="open" />
                                            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm p-12 sm:p-16 lg:p-20 text-center border border-gray-100">
                                <svg className="w-14 h-14 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4 sm:mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                {!workerLocation || !workerLocation.lat || !workerLocation.lng ? (
                                    <>
                                        <p className="text-base sm:text-lg text-gray-700 mb-2 font-semibold">Location access required</p>
                                        <p className="text-sm sm:text-base text-gray-500 mb-6 leading-relaxed">Please enable location access to see tasks near you</p>
                                        <button
                                            onClick={requestLocation}
                                            className="inline-flex items-center px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 active:scale-[0.98] min-h-[44px] touch-manipulation"
                                        >
                                            Enable Location
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-base sm:text-lg text-gray-700 mb-2 font-semibold">No tasks within 5km</p>
                                        <p className="text-sm sm:text-base text-gray-500 mb-6 leading-relaxed">No tasks found near your location. Check back later!</p>
                                        <Link
                                            to="/tasks"
                                            className="inline-flex items-center px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 active:scale-[0.98] min-h-[44px] touch-manipulation"
                                        >
                                            Browse All Tasks
                                        </Link>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Accepted Tasks */}
                    <div>
                        <div className="mb-5 sm:mb-6">
                            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2 leading-tight">Your Accepted Tasks</h2>
                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Tasks you're currently working on</p>
                        </div>

                        {acceptedTasks.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                                {acceptedTasks.map((task) => (
                                    <Link
                                        key={task.id}
                                        to={`/tasks/${task.id}`}
                                        className="group bg-white rounded-xl p-5 sm:p-6 lg:p-7 shadow-sm hover:shadow-lg transition-all duration-200 border-2 border-gray-100 hover:border-gray-200"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-3 group-hover:text-blue-600 transition-colors">
                                                {task.title}
                                            </h3>
                                            <span className="inline-flex items-center px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded-md whitespace-nowrap">
                                                {task.category}
                                            </span>
                                        </div>
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="truncate">{task.location}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                                                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {task.budget}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                            <StatusBadge status={task.status} />
                                            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm p-12 sm:p-16 lg:p-20 text-center border border-gray-100">
                                <svg className="w-14 h-14 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4 sm:mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-base sm:text-lg text-gray-700 mb-2 font-semibold">No active tasks</p>
                                <p className="text-sm sm:text-base text-gray-500 mb-6 leading-relaxed">Accept tasks from the list above to get started</p>
                                <Link
                                    to="/tasks"
                                    className="inline-flex items-center px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 active:scale-[0.98] min-h-[44px] touch-manipulation"
                                >
                                    Find Tasks
                                </Link>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <>
                    {/* Mode Header - Poster Mode */}
                    <div className="mb-8 sm:mb-10 lg:mb-12">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">Post Tasks</h1>
                        <p className="text-sm sm:text-base lg:text-lg text-gray-600 leading-relaxed">Post tasks and manage their progress</p>
                    </div>

                    {/* Primary Action - Poster Mode */}
                    <div className="mb-8 sm:mb-10 lg:mb-12">
                        <Link
                            to="/post-task"
                            className="inline-flex items-center justify-center w-full sm:w-auto px-8 sm:px-10 lg:px-12 py-3.5 sm:py-4 lg:py-4.5 bg-blue-600 text-white text-base sm:text-lg lg:text-xl font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg active:scale-[0.98] min-h-[48px] sm:min-h-[52px] touch-manipulation"
                        >
                            Post a New Task
                        </Link>
                    </div>

                    {/* Task Stats - Poster Mode */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 mb-10 sm:mb-12 lg:mb-14">
                        <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6 lg:p-7 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-blue-50 rounded-xl flex-shrink-0">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Tasks Posted</p>
                            </div>
                            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-none">{posterStats.tasksPosted}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6 lg:p-7 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-orange-50 rounded-xl flex-shrink-0">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">In Progress</p>
                            </div>
                            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-none">{posterStats.inProgress}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6 lg:p-7 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-green-50 rounded-xl flex-shrink-0">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Completed</p>
                            </div>
                            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-none">{posterStats.completed}</p>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm p-5 sm:p-6 lg:p-7 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-red-50 rounded-xl flex-shrink-0">
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                                <p className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wide">Cancelled</p>
                            </div>
                            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-none">{posterStats.cancelled}</p>
                        </div>
                    </div>

                    {/* My Posted Tasks */}
                    <div>
                        <div className="mb-5 sm:mb-6">
                            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1.5 sm:mb-2 leading-tight">My Posted Tasks</h2>
                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">Manage your tasks and track their progress</p>
                        </div>

                        {postedTasks.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                                {postedTasks.map((task) => (
                                    <Link
                                        key={task.id}
                                        to={`/tasks/${task.id}`}
                                        className="group bg-white rounded-xl p-5 sm:p-6 lg:p-7 shadow-sm hover:shadow-lg transition-all duration-200 border-2 border-gray-100 hover:border-gray-200"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-3 group-hover:text-blue-600 transition-colors">
                                                {task.title}
                                            </h3>
                                            <span className="inline-flex items-center px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded-md whitespace-nowrap">
                                                {task.category}
                                            </span>
                                        </div>
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <svg className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                <span className="truncate">{task.location}</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                                                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    {task.budget}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <StatusBadge status={task.status} />
                                                {task.status === 'open' && (
                                                    <span className="text-xs text-gray-500">
                                                        {task.applicants} {task.applicants === 1 ? 'applicant' : 'applicants'}
                                                    </span>
                                                )}
                                                {task.status === 'accepted' && task.worker && (
                                                    <span className="text-xs text-gray-500">
                                                        {task.worker}
                                                    </span>
                                                )}
                                            </div>
                                            <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm p-12 sm:p-16 lg:p-20 text-center border border-gray-100">
                                <svg className="w-14 h-14 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4 sm:mb-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-base sm:text-lg text-gray-700 mb-2 font-semibold">No tasks posted yet</p>
                                <p className="text-sm sm:text-base text-gray-500 mb-6 leading-relaxed">Post your first task to get help from nearby workers</p>
                                <Link
                                    to="/post-task"
                                    className="inline-flex items-center px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-blue-700 transition-all duration-200 active:scale-[0.98] min-h-[44px] touch-manipulation"
                                >
                                    Post a Task
                                </Link>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

export default Dashboard
