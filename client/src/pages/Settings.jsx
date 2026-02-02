import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUserMode } from '../context/UserModeContext'
import { useCategories } from '../hooks/useCategories'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { API_BASE_URL } from '../config/env'

function Settings() {
  const { user } = useAuth()
  const { userMode } = useUserMode()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  // Profile update
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState(null)

  // Worker preferences
  const [preferencesSaving, setPreferencesSaving] = useState(false)
  const [preferencesError, setPreferencesError] = useState(null)
  const [preferencesSuccess, setPreferencesSuccess] = useState(false)

  // Mobile number change request
  const [ticketRequestedPhone, setTicketRequestedPhone] = useState('')
  const [ticketReason, setTicketReason] = useState('')
  const [ticketSubmitting, setTicketSubmitting] = useState(false)
  const [ticketError, setTicketError] = useState(null)
  const [ticketSuccess, setTicketSuccess] = useState(false)

  const { categories: categoriesList } = useCategories()
  const {
    permission: pushPermission,
    loading: pushLoading,
    error: pushError,
    enable: enablePush
  } = usePushNotifications()

  // Fetch minimal profile data needed for settings
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
        }
      } catch {
        // ignore for now
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [user?.id])

  const handleProfileInputChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }))
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
        body: JSON.stringify({
          name: profile.name
        })
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
          <p className="text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 overflow-x-hidden">
      {/* Header */}
      <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2">
            Settings
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Manage your preferences, notifications, and account details.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Back to profile
        </button>
      </div>

      <div className="space-y-5 sm:space-y-6">
        {/* Profile basics */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Profile basics
          </h2>
          <div className="space-y-4 sm:space-y-5">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => handleProfileInputChange('name', e.target.value)}
                className="w-full h-11 sm:h-12 px-4 sm:px-5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm sm:text-base"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                Email
              </label>
              <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 font-medium">{profile.email || '—'}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1.5">
                Email cannot be changed.
              </p>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                Phone
              </label>
              <p className="text-sm sm:text-base text-gray-900 dark:text-gray-100 font-medium">{profile.phone || '—'}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1.5">
                Phone cannot be edited directly. Use the request form below to ask for a change.
              </p>
            </div>
            {profileError && (
              <p className="text-sm text-red-600 dark:text-red-400">{profileError}</p>
            )}
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

        {/* Worker preferences */}
        {userMode === 'worker' && profile.workerPreferences && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
              Worker preferences
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Customise how tasks are shown on the Tasks page. Your default radius is used when you open Tasks; preferred categories are shown first.
            </p>
            <div className="space-y-4 sm:space-y-5">
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Preferred categories
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Select categories you want to see first when browsing tasks.
                </p>
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
                <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                  Default search radius
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Distance used by default when you open the Tasks page.
                </p>
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
        )}

        {/* Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
            Notifications
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Get push notifications for new tasks, task updates, and important reminders.
          </p>
          {pushPermission === 'granted' ? (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              Push notifications are enabled for this browser.
              <br />
              To turn them off, manage notifications in your browser or system settings.
            </p>
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
              {pushError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{pushError}</p>
              )}
            </>
          )}
        </div>

        {/* Phone change request */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
            Request phone number change
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            For security reasons, phone numbers can’t be changed directly. Submit a request and our team will review it.
          </p>
          <form onSubmit={handleSubmitTicket} className="space-y-4 sm:space-y-5 max-w-md">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                New phone number
              </label>
              <input
                type="tel"
                value={ticketRequestedPhone}
                onChange={(e) => setTicketRequestedPhone(e.target.value)}
                placeholder="Enter 10-digit phone"
                className="w-full h-11 px-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">
                Reason (optional)
              </label>
              <textarea
                value={ticketReason}
                onChange={(e) => setTicketReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
                placeholder="Add any details that can help us verify this request"
              />
            </div>
            {ticketError && (
              <p className="text-sm text-red-600 dark:text-red-400">{ticketError}</p>
            )}
            {ticketSuccess && (
              <p className="text-sm text-green-600 dark:text-green-400">
                Request submitted. We’ll review it shortly.
              </p>
            )}
            <button
              type="submit"
              disabled={ticketSubmitting}
              className="h-11 px-5 bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {ticketSubmitting ? 'Submitting...' : 'Submit request'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Settings

