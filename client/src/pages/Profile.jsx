import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserMode } from '../context/UserModeContext'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../config/env'
import ModeToggle from '../components/ModeToggle'

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
                        profilePhoto: userData.profilePhoto || null
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
                console.error('Error fetching profile:', err)
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
                                : 'Location not set'
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
            console.error('Error fetching activity:', err)
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
                console.error('Error fetching earnings:', err)
            }
        }

        fetchEarnings()
    }, [user?.id, userMode])

    const handleInputChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }))
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
                    phone: profile.phone,
                    profilePhoto: profile.profilePhoto || null
                })
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Failed to update profile')
            }

            setIsEditing(false)
        } catch (err) {
            console.error('Error saving profile:', err)
            setSaveError(err.message || 'Failed to save profile. Please try again.')
        } finally {
            setIsSaving(false)
        }
    }

    if (loading || !profile) {
        return (
            <div className="max-w-4xl mx-auto">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 overflow-x-hidden">
            <div className="hidden sm:block mb-6">
                <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-1">Profile</h1>
                <p className="text-sm text-gray-500">Manage your account and view your activity</p>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8 mb-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                            {profile.profilePhoto ? (
                                <img src={profile.profilePhoto} alt={profile.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <span className="text-2xl sm:text-3xl font-semibold text-blue-700">
                                    {profile.name.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 leading-tight">{profile.name}</h2>
                            <p className="mt-1 text-sm text-gray-500 flex items-start gap-1.5 leading-snug">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {profile.location}
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                        <Link
                            to="/activity"
                            className="h-11 inline-flex items-center justify-center px-4 bg-gray-100 text-gray-800 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors text-center"
                        >
                            Activity
                        </Link>
                        {userMode === 'worker' ? (
                            <Link
                                to="/earnings"
                                className="h-11 inline-flex items-center justify-center px-4 bg-gray-100 text-gray-800 text-sm font-semibold rounded-xl hover:bg-gray-200 transition-colors text-center"
                            >
                                Earnings
                            </Link>
                        ) : (
                            // Poster mode: show Edit Profile as second button
                            <button
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                disabled={isSaving}
                                className="h-11 inline-flex items-center justify-center px-4 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {isEditing ? (isSaving ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
                            </button>
                        )}
                        {userMode === 'worker' && (
                            <button
                                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                disabled={isSaving}
                                className="h-11 col-span-2 sm:col-auto inline-flex items-center justify-center px-4 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                {isEditing ? (isSaving ? 'Saving...' : 'Save Changes') : 'Edit Profile'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Profile Stats - Mode Specific */}
                <div className={`grid gap-3 sm:gap-4 mb-6 ${userMode === 'worker' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-2'}`}>
                    {userMode === 'worker' ? (
                        <>
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 sm:p-5 border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-blue-200 rounded-lg">
                                        <svg className="w-4 h-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Tasks Completed</p>
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">{stats.tasksCompleted}</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 sm:p-5 border border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-green-200 rounded-lg">
                                        <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Total Earnings</p>
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">₹{stats.earnings}</p>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-xl p-4 sm:p-5 border border-yellow-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-yellow-200 rounded-lg">
                                        <svg className="w-4 h-4 text-yellow-700" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs font-semibold text-yellow-700 uppercase tracking-wide">Rating</p>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-gray-900 leading-none">{stats.rating}</span>
                                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl p-4 sm:p-5 border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-blue-200 rounded-lg">
                                        <svg className="w-4 h-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Tasks Posted</p>
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">{stats.tasksPosted}</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl p-4 sm:p-5 border border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-green-200 rounded-lg">
                                        <svg className="w-4 h-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Tasks Completed</p>
                                </div>
                                <p className="text-2xl sm:text-3xl font-bold text-gray-900 leading-none">{stats.tasksCompleted}</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Profile Details */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        {isEditing ? (
                            <input
                                type="text"
                                value={profile.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className="w-full h-11 px-4 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        ) : (
                            <p className="text-base text-gray-900">{profile.name}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-base text-gray-900">{profile.email}</p>
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                        {isEditing ? (
                            <input
                                type="tel"
                                value={profile.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className="w-full h-11 px-4 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        ) : (
                            <p className="text-base text-gray-900">{profile.phone}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <p className="text-base text-gray-900">{profile.location}</p>
                        <p className="text-xs text-gray-500 mt-1">Location is read-only</p>
                    </div>
                    {saveError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">{saveError}</p>
                        </div>
                    )}
                </div>

                {/* Mobile Only: Mode Toggle & Logout */}
                <div className="md:hidden mt-8 pt-8 border-t border-gray-200 space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                        <ModeToggle isMobile={true} />
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 bg-red-50 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-100 active:bg-red-200 transition-colors border border-red-200 touch-manipulation"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </div>
    )
}

export default Profile
