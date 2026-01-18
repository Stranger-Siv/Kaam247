import { API_BASE_URL } from '../config/env'

/**
 * STATE RECOVERY UTILITIES
 * 
 * These functions fetch authoritative state from backend APIs
 * to recover UI state after socket disconnects, page refreshes, etc.
 */

/**
 * Fetch current user profile
 */
export const fetchUserProfile = async () => {
  try {
    const token = localStorage.getItem('kaam247_token')
    if (!token) return null

    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      return data.user
    }
    return null
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

/**
 * Fetch active task (if any)
 */
export const fetchActiveTask = async () => {
  try {
    const token = localStorage.getItem('kaam247_token')
    if (!token) return null

    const response = await fetch(`${API_BASE_URL}/api/users/me/active-task`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      return data
    }
    return null
  } catch (error) {
    console.error('Error fetching active task:', error)
    return null
  }
}

/**
 * Fetch user availability state (online/offline status)
 * Note: This is stored in localStorage, but we can verify with backend if needed
 */
export const fetchUserAvailability = () => {
  try {
    const isOnline = localStorage.getItem('kaam247_isOnline') === 'true'
    const workerLocation = localStorage.getItem('kaam247_workerLocation')
    
    return {
      isOnline,
      workerLocation: workerLocation ? JSON.parse(workerLocation) : null
    }
  } catch (error) {
    console.error('Error fetching availability:', error)
    return {
      isOnline: false,
      workerLocation: null
    }
  }
}

/**
 * Fetch dashboard stats (mode-specific)
 */
export const fetchDashboardStats = async (userMode, userId) => {
  if (!userId) return null

  try {
    const token = localStorage.getItem('kaam247_token')
    if (!token) return null

    if (userMode === 'worker') {
      // Fetch worker stats
      const [earningsResponse, profileResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/users/me/earnings`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_BASE_URL}/api/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      const earningsData = earningsResponse.ok ? await earningsResponse.json() : null
      const profileData = profileResponse.ok ? await profileResponse.json() : null

      return {
        totalEarnings: earningsData?.earnings?.total || 0,
        earningsThisMonth: earningsData?.earnings?.thisMonth || 0,
        averageRating: profileData?.user?.averageRating || 0
      }
    } else {
      // Fetch poster stats
      const activityResponse = await fetch(`${API_BASE_URL}/api/users/me/activity`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        return {
          tasksPosted: activityData.activity.posted.length,
          inProgress: activityData.activity.posted.filter(t => t.status === 'IN_PROGRESS').length,
          completed: activityData.activity.completed.filter(t => t.role === 'Poster').length,
          cancelled: activityData.activity.cancelled.filter(t => t.role === 'Poster').length
        }
      }
    }
    return null
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return null
  }
}

/**
 * Complete state recovery sequence
 * Fetches all necessary state to restore UI
 */
export const performStateRecovery = async (userMode, userId) => {
  try {
    const [profile, activeTask, availability, stats] = await Promise.all([
      fetchUserProfile(),
      fetchActiveTask(),
      Promise.resolve(fetchUserAvailability()), // Synchronous
      fetchDashboardStats(userMode, userId)
    ])

    return {
      profile,
      activeTask,
      availability,
      stats
    }
  } catch (error) {
    console.error('Error during state recovery:', error)
    return {
      profile: null,
      activeTask: null,
      availability: fetchUserAvailability(),
      stats: null
    }
  }
}

