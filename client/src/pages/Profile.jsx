import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserMode } from '../context/UserModeContext'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../config/env'
import ModeToggle from '../components/ModeToggle'
import { useCategories } from '../hooks/useCategories'
import { usePushNotifications } from '../hooks/usePushNotifications'

function Profile() {
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [saveError, setSaveError] = useState(null)
    const { userMode } = useUserMode()
    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/')
    }
    const [profile, setProfile] = useState(null)
    const [stats, setStats] = useState({
        tasksCompleted: 0,
        earnings: 0,
        rating: 0,
        tasksPosted: 0
    })
    const [loading, setLoading] = useState(true)
    const [showMobileTicketModal, setShowMobileTicketModal] = useState(false)
    const [ticketRequestedPhone, setTicketRequestedPhone] = useState('')
    const [ticketReason, setTicketReason] = useState('')
    const [ticketSubmitting, setTicketSubmitting] = useState(false)
    const [ticketError, setTicketError] = useState(null)
    const [ticketSuccess, setTicketSuccess] = useState(false)
    const [preferencesSaving, setPreferencesSaving] = useState(false)
    const [preferencesError, setPreferencesError] = useState(null)
    const [preferencesSuccess, setPreferencesSuccess] = useState(false)

    const { categories: categoriesList } = useCategories()
    const { permission: pushPermission, loading: pushLoading, error: pushError, enable: enablePush } = usePushNotifications()

    // Fetch profile data
    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.id) {
                setLoading(false)
                return
            }

            try {
                const token = localStorage.getItem('kaam247_token')
                const response = await fetch(`${API_BASE_URL}/api/users/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })

                if (response.ok) {
                    const data = await response.json()
                    const userData = data.user
                    setProfile({
                        name: userData.name || '',
                        email: userData.email || '',
                        phone: userData.phone || '',
                        location: userData.location?.area
                            ? `${userData.location.area}${userData.location.city ? `, ${userData.location.city}` : ''}`
                            : 'Location not set',
                        profilePhoto: userData.profilePhoto || null,
                        locationUpdatedAt: userData.locationUpdatedAt || null,
                        createdAt: userData.createdAt || null,
                        workerPreferences: userData.workerPreferences
                            ? {
                                preferredCategories: Array.isArray(userData.workerPreferences.preferredCategories)
                                    ? userData.workerPreferences.preferredCategories
                                    : [],
                                defaultRadiusKm: typeof userData.workerPreferences.defaultRadiusKm === 'number'
                                    ? userData.workerPreferences.defaultRadiusKm
                                    : 5
                            }
                            : { preferredCategories: [], defaultRadiusKm: 5 }
                    })

                    // Set stats based on mode
                    if (userMode === 'worker') {
                        setStats({
                            tasksCompleted: 0, // Will be calculated from activity
                            earnings: 0, // Will be fetched from earnings API
                            rating: userData.averageRating || 0,
                            tasksPosted: 0
                        })
                    } else {
                        setStats({
                            tasksPosted: 0, // Will be calculated from activity
                            tasksCompleted: 0,
                            rating: 0,
                            earnings: 0
                        })
                    }
                }
            } catch (err) {
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [user?.id, userMode])

    // Listen for location updates and refetch profile
    useEffect(() => {
        const handleLocationUpdate = () => {
            // Refetch profile to get updated location
            const fetchProfile = async () => {
                if (!user?.id) return

                try {
                    const token = localStorage.getItem('kaam247_token')
                    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    })

                    if (response.ok) {
                        const data = await response.json()
                        const userData = data.user
                        setProfile(prev => ({
                            ...prev,
                            location: userData.location?.area
                                ? `${userData.location.area}${userData.location.city ? `, ${userData.location.city}` : ''}`
                                : 'Location not set',
                            locationUpdatedAt: userData.locationUpdatedAt || prev?.locationUpdatedAt || null,
                            createdAt: userData.createdAt || prev?.createdAt || null,
                            workerPreferences: userData.workerPreferences
                                ? {
                                    preferredCategories: Array.isArray(userData.workerPreferences.preferredCategories)
                                        ? userData.workerPreferences.preferredCategories
                                        : prev?.workerPreferences?.preferredCategories ?? [],
                                    defaultRadiusKm: typeof userData.workerPreferences.defaultRadiusKm === 'number'
                                        ? userData.workerPreferences.defaultRadiusKm
                                        : prev?.workerPreferences?.defaultRadiusKm ?? 5
                                }
                                : prev?.workerPreferences ?? { preferredCategories: [], defaultRadiusKm: 5 }
                        }))
                    }
                } catch (err) {
                    // Silently fail - location update is non-critical
                }
            }

            fetchProfile()
        }

        window.addEventListener('profile_location_updated', handleLocationUpdate)
        return () => {
            window.removeEventListener('profile_location_updated', handleLocationUpdate)
        }
    }, [user?.id])

    // DATA CONSISTENCY: Fetch activity for stats - always fresh from backend
    const fetchActivity = useCallback(async () => {
        if (!user?.id) return

        try {
            const token = localStorage.getItem('kaam247_token')
            const response = await fetch(`${API_BASE_URL}/api/users/me/activity`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                if (userMode === 'worker') {
                    setStats(prev => ({
                        ...prev,
                        tasksCompleted: data.activity.completed.filter(t => t.role === 'Worker').length
                    }))
                } else {
                    setStats(prev => ({
                        ...prev,
                        tasksPosted: data.activity.posted.length,
                        tasksCompleted: data.activity.completed.filter(t => t.role === 'Poster').length
                    }))
                }
            }
        } catch (err) {
        }
    }, [user?.id, userMode])

    useEffect(() => {
        if (user?.id) {
            fetchActivity()
        }
    }, [user?.id, userMode]) // eslint-disable-line react-hooks/exhaustive-deps

    // DATA CONSISTENCY: Listen for task completion and rating to update stats
    useEffect(() => {
        const handleTaskCompleted = () => {
            fetchActivity()
            // Also refetch profile to get updated rating
            const token = localStorage.getItem('kaam247_token')
            fetch(`${API_BASE_URL}/api/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (userMode === 'worker') {
                        setStats(prev => ({
                            ...prev,
                            rating: data.user.averageRating || 0
                        }))
                    }
                })
                .catch(() => { })
        }

        const handleTaskRated = () => {
            // Refetch profile to get updated rating
            const token = localStorage.getItem('kaam247_token')
            fetch(`${API_BASE_URL}/api/users/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => {
                    if (userMode === 'worker') {
                        setStats(prev => ({
                            ...prev,
                            rating: data.user.averageRating || 0
                        }))
                    }
                })
                .catch(() => { })
        }

        window.addEventListener('task_completed', handleTaskCompleted)
        window.addEventListener('task_rated', handleTaskRated)

        return () => {
            window.removeEventListener('task_completed', handleTaskCompleted)
            window.removeEventListener('task_rated', handleTaskRated)
        }
    }, [userMode, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

    // Fetch earnings for worker
    useEffect(() => {
        const fetchEarnings = async () => {
            if (!user?.id || userMode !== 'worker') return

            try {
                const token = localStorage.getItem('kaam247_token')
                const response = await fetch(`${API_BASE_URL}/api/users/me/earnings`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })

                if (response.ok) {
                    const data = await response.json()
                    setStats(prev => ({
                        ...prev,
                        earnings: data.earnings.total || 0
                    }))
                }
            } catch (err) {
            }
        }

        fetchEarnings()
    }, [user?.id, userMode])

    const handleInputChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }))
    }

    const handlePreferenceCategoryToggle = (category) => {
        if (!profile?.workerPreferences) return
        const current = profile.workerPreferences.preferredCategories || []
        const next = current.includes(category)
            ? current.filter(c => c !== category)
            : [...current, category]
        setProfile(prev => ({
            ...prev,
            workerPreferences: {
                ...prev.workerPreferences,
                preferredCategories: next
            }
        }))
    }

    const handlePreferenceRadiusChange = (km) => {
        const num = parseInt(km, 10)
        if (isNaN(num) || num < 1 || num > 10) return
        setProfile(prev => ({
            ...prev,
            workerPreferences: {
                ...(prev.workerPreferences || { preferredCategories: [], defaultRadiusKm: 5 }),
                defaultRadiusKm: num
            }
        }))
    }

    const handleSavePreferences = async () => {
        if (!profile?.workerPreferences || !user?.id) return
        try {
            setPreferencesSaving(true)
            setPreferencesError(null)
            setPreferencesSuccess(false)
            const token = localStorage.getItem('kaam247_token')
            const response = await fetch(`${API_BASE_URL}/api/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    workerPreferences: {
                        preferredCategories: profile.workerPreferences.preferredCategories || [],
                        defaultRadiusKm: profile.workerPreferences.defaultRadiusKm ?? 5
                    }
                })
            })
            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                throw new Error(data.message || data.error || 'Failed to save preferences')
            }
            setPreferencesSuccess(true)
            setTimeout(() => setPreferencesSuccess(false), 3000)
        } catch (err) {
            setPreferencesError(err.message || 'Failed to save preferences')
        } finally {
            setPreferencesSaving(false)
        }
    }

    const handleSave = async () => {
        if (!profile || !user?.id) return

        try {
            setIsSaving(true)
            setSaveError(null)

            const token = localStorage.getItem('kaam247_token')
            const response = await fetch(`${API_BASE_URL}/api/users/me`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: profile.name,
                    profilePhoto: profile.profilePhoto || null
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to update profile')
            }

            setIsEditing(false)
        } catch (err) {
            setSaveError(err.message || 'Failed to save profile. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleSubmitTicket = async (e) => {
        e.preventDefault()
        setTicketError(null)
        const digits = (ticketRequestedPhone || '').replace(/\D/g, '')
        if (digits.length !== 10) {
            setTicketError('Enter a valid 10-digit phone.')
            return
        }
        setTicketSubmitting(true)
        try {
            const token = localStorage.getItem('kaam247_token')
            const response = await fetch(`${API_BASE_URL}/api/users/me/tickets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type: 'MOBILE_UPDATE',
                    requestedPhone: digits,
                    reason: ticketReason.trim()
                })
            })
            const data = await response.json().catch(() => ({}))
            if (!response.ok) {
                throw new Error(data.message || 'Failed to submit request')
            }
            setTicketSuccess(true)
            setTicketRequestedPhone('')
            setTicketReason('')
            setTimeout(() => {
                setShowMobileTicketModal(false)
                setTicketSuccess(false)
            }, 2000)
        } catch (err) {
            setTicketError(err.message || 'Failed to submit. Try again.')
        } finally {
            setTicketSubmitting(false)
        }
    }

    if (loading || !profile) {
        return (
            <div className="max-w-6xl mx-auto w-full px-4 sm:px-6">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
                </div>
            </div>
        )
    }

    const memberSince = profile.createdAt
        ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
        : null

    return (
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 overflow-x-hidden">
            {/* Page header - same as Activity / Earnings */}
            <div className="mb-4 sm:mb-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2 break-words">Profile</h1>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 break-words">Manage your account and view your activity</p>
            </div>

            {/* Overview card - avatar, name, location, member since, quick actions */}
            <div className="bg-white dark:bg-gray-800 rounded-none sm:rounded-xl shadow-sm dark:shadow-gray-900/50 border-0 sm:border border-gray-200 dark:border-gray-700 p-5 sm:p-6 mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 overflow-hidden">
                            {profile.profilePhoto ? (
                                <img src={profile.profilePhoto} alt={profile.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-700 dark:text-blue-300">
                                    {profile.name ? profile.name.charAt(0).toUpperCase() : '?'}
                                </span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 leading-tight break-words">{profile.name || 'No name'}</h2>
                            <p className="mt-1.5 sm:mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400 flex items-start gap-1.5 leading-relaxed">
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span className="break-words">{profile.location}</span>
                            </p>
                            {memberSince && (
                                <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-500">Member since {memberSince}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2.5 sm:gap-3 w-full sm:w-auto">
                        <Link
                            to="/activity"
                            className="h-11 sm:h-12 inline-flex items-center justify-center px-4 sm:px-5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm sm:text-base font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 active:scale-[0.98] text-center touch-manipulation"
                        >
                            Activity
                        </Link>
                        {userMode === 'worker' && (
                            <Link
                                to="/earnings"
                                className="h-11 sm:h-12 inline-flex items-center justify-center px-4 sm:px-5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm sm:text-base font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 active:scale-[0.98] text-center touch-manipulation"
                            >
                                Earnings
                            </Link>
                        )}
                        <button
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            disabled={isSaving}
                            className="h-11 sm:h-12 inline-flex items-center justify-center px-4 sm:px-5 bg-blue-600 dark:bg-blue-500 text-white text-sm sm:text-base font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 touch-manipulation"
                        >
                            {isEditing ? (isSaving ? 'Saving...' : 'Save') : 'Edit Profile'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats - same card style as Dashboard */}
            <div className="mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">Overview</h2>
                <div className={`grid gap-4 sm:gap-5 ${userMode === 'worker' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2'}`}>
                    {userMode === 'worker' ? (
                        <>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-5 sm:p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex-shrink-0">
                                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Tasks Completed</p>
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-none">{stats.tasksCompleted}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-5 sm:p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2.5 bg-green-50 dark:bg-green-900/30 rounded-xl flex-shrink-0">
                                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Earnings</p>
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-none">₹{stats.earnings}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-5 sm:p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200 sm:col-span-1 col-span-2">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2.5 bg-yellow-50 dark:bg-yellow-900/30 rounded-xl flex-shrink-0">
                                        <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Rating</p>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-none">{stats.rating}</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">/ 5</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-5 sm:p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex-shrink-0">
                                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Tasks Posted</p>
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-none">{stats.tasksPosted}</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 p-5 sm:p-6 border border-gray-200 dark:border-gray-700 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-200">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2.5 bg-green-50 dark:bg-green-900/30 rounded-xl flex-shrink-0">
                                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Tasks Completed</p>
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-none">{stats.tasksCompleted}</p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Worker preferences - only when in worker mode */}
            {userMode === 'worker' && profile?.workerPreferences && (
                <div className="mb-4 sm:mb-6">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">Worker preferences</h2>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Customise how tasks are shown on the Tasks page. Your default radius is used when you open Tasks; preferred categories are shown first.</p>
                        <div className="space-y-4 sm:space-y-5">
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Preferred categories (tasks I do)</label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Select categories you want to see first when browsing tasks.</p>
                                <div className="flex flex-wrap gap-2">
                                    {categoriesList.map((cat) => {
                                        const checked = (profile.workerPreferences.preferredCategories || []).includes(cat)
                                        return (
                                            <label
                                                key={cat}
                                                className={`inline-flex items-center px-3 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${checked
                                                    ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200'
                                                    : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => handlePreferenceCategoryToggle(cat)}
                                                    className="sr-only"
                                                />
                                                <span>{cat}</span>
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Default search radius</label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Distance used by default when you open the Tasks page.</p>
                                <select
                                    value={profile.workerPreferences.defaultRadiusKm ?? 5}
                                    onChange={(e) => handlePreferenceRadiusChange(e.target.value)}
                                    className="h-11 px-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm sm:text-base max-w-[200px]"
                                >
                                    <option value={1}>Within 1 km</option>
                                    <option value={3}>Within 3 km</option>
                                    <option value={5}>Within 5 km</option>
                                    <option value={10}>Within 10 km</option>
                                </select>
                            </div>
                            {preferencesError && (
                                <p className="text-sm text-red-600 dark:text-red-400">{preferencesError}</p>
                            )}
                            {preferencesSuccess && (
                                <p className="text-sm text-green-600 dark:text-green-400">Preferences saved.</p>
                            )}
                            <button
                                type="button"
                                onClick={handleSavePreferences}
                                disabled={preferencesSaving}
                                className="h-11 px-5 bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {preferencesSaving ? 'Saving...' : 'Save preferences'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Push notifications */}
            <div className="mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">Notifications</h2>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Get push notifications for new tasks, when someone accepts your task, and reminders (e.g. task in 1 hour).</p>
                    {pushPermission === 'granted' ? (
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">Push notifications are enabled.</p>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={enablePush}
                                disabled={pushLoading}
                                className="h-11 px-5 bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {pushLoading ? 'Enabling...' : 'Enable push notifications'}
                            </button>
                            {pushError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{pushError}</p>}
                        </>
                    )}
                </div>
            </div>

            {/* Account details card */}
            <div className="bg-white dark:bg-gray-800 rounded-none sm:rounded-xl shadow-sm dark:shadow-gray-900/50 border-0 sm:border border-gray-200 dark:border-gray-700 p-5 sm:p-6 mb-4 sm:mb-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Account details</h2>
                <div className="space-y-4 sm:space-y-5">
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Name</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="w-full h-11 sm:h-12 px-4 sm:px-5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors"
                            />
                        ) : (
                            <p className="text-base sm:text-lg text-gray-900 dark:text-gray-100 font-medium leading-relaxed">{profile.name || '—'}</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Email</label>
                        <p className="text-base sm:text-lg text-gray-900 dark:text-gray-100 font-medium leading-relaxed">{profile.email || '—'}</p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1.5">Email cannot be changed</p>
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Phone</label>
                        <p className="text-base sm:text-lg text-gray-900 dark:text-gray-100 font-medium leading-relaxed">{profile.phone || '—'}</p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1.5">Phone cannot be edited by you (security). Request a change below; admin will review.</p>
                        <button
                            type="button"
                            onClick={() => setShowMobileTicketModal(true)}
                            className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 transition-colors"
                        >
                            Request phone change
                        </button>
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Location</label>
                        <p className="text-base sm:text-lg text-gray-900 dark:text-gray-100 font-medium leading-relaxed">{profile.location || '—'}</p>
                        {profile.locationUpdatedAt && (
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1.5">
                                Last updated {new Date(profile.locationUpdatedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </p>
                        )}
                    </div>
                    {saveError && (
                        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
                            <p className="text-sm text-red-700 dark:text-red-400">{saveError}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Account actions: Mode toggle + Logout - visible on all screens */}
            <div className="bg-white dark:bg-gray-800 rounded-none sm:rounded-xl shadow-sm dark:shadow-gray-900/50 border-0 sm:border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Account</h2>
                <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                        <ModeToggle isMobile={true} />
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full sm:w-auto min-w-[140px] px-5 py-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm sm:text-base font-semibold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/50 active:bg-red-200 dark:active:bg-red-900/60 transition-all duration-200 active:scale-[0.98] border border-red-200 dark:border-red-800 touch-manipulation min-h-[44px]"
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* Request phone change modal */}
            {showMobileTicketModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/60" onClick={() => !ticketSubmitting && setShowMobileTicketModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Request phone change</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Admin will review and update your number. Enter the new 10-digit phone and optional reason.</p>
                        {ticketSuccess ? (
                            <p className="text-green-600 dark:text-green-400 font-medium">Request submitted. Admin will review and fix as soon as possible.</p>
                        ) : (
                            <form onSubmit={handleSubmitTicket} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New 10-digit phone</label>
                                    <input
                                        type="tel"
                                        value={ticketRequestedPhone}
                                        onChange={(e) => setTicketRequestedPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        placeholder="10-digit number"
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                                        maxLength={10}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason (optional)</label>
                                    <textarea
                                        value={ticketReason}
                                        onChange={(e) => setTicketReason(e.target.value.slice(0, 500))}
                                        placeholder="Why you need to change your number"
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 resize-none"
                                        rows={3}
                                        maxLength={500}
                                    />
                                </div>
                                {ticketError && <p className="text-sm text-red-600 dark:text-red-400">{ticketError}</p>}
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowMobileTicketModal(false)}
                                        disabled={ticketSubmitting}
                                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={ticketSubmitting}
                                        className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
                                    >
                                        {ticketSubmitting ? 'Submitting...' : 'Submit request'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Profile
