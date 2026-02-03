import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { API_BASE_URL } from '../../config/env'

export default function SettingsProfile() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }
      try {
        const token = localStorage.getItem('kaam247_token')
        const response = await fetch(`${API_BASE_URL}/api/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          const userData = data.user
          setProfile({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || ''
          })
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [user?.id])

  const handleProfileInputChange = (field, value) => {
    setProfile(prev => prev ? { ...prev, [field]: value } : null)
  }

  const handleSaveProfile = async () => {
    if (!profile || !user?.id) return
    try {
      setIsSavingProfile(true)
      setProfileError(null)
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: profile.name })
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to update profile')
      }
    } catch (err) {
      setProfileError(err.message || 'Failed to save profile. Please try again.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  if (loading || !profile) {
    return (
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 overflow-x-hidden">
      <div className="mb-4 sm:mb-6">
        <Link
          to="/settings"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          ← Back to Settings
        </Link>
      </div>
      <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
        Profile
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Update your name and view your account details.
      </p>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
        <div className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleProfileInputChange('name', e.target.value)}
              className="w-full h-11 sm:h-12 px-4 sm:px-5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm sm:text-base"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Email</label>
            <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 font-medium">{profile.email || '—'}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1.5">Email cannot be changed.</p>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Phone</label>
            <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 font-medium">{profile.phone || '—'}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1.5">Phone cannot be edited directly. Use Account settings to request a change.</p>
          </div>
          {profileError && <p className="text-sm text-red-600 dark:text-red-400">{profileError}</p>}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="h-11 px-5 bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSavingProfile ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
