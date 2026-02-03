import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCategories } from '../../hooks/useCategories'
import { API_BASE_URL } from '../../config/env'

export default function SettingsPreferences() {
  const { user } = useAuth()
  const { categories: categoriesList } = useCategories()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)
  const [preferencesSaving, setPreferencesSaving] = useState(false)
  const [preferencesError, setPreferencesError] = useState(null)
  const [preferencesSuccess, setPreferencesSuccess] = useState(false)

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
        // ignore
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [user?.id])

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
        Worker preferences
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Customise how tasks are shown on the Tasks page. Your default radius is used when you open Tasks; preferred categories are shown first.
      </p>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
        <div className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Preferred categories</label>
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
            </select>
          </div>
          {preferencesError && <p className="text-sm text-red-600 dark:text-red-400">{preferencesError}</p>}
          {preferencesSuccess && <p className="text-sm text-green-600 dark:text-green-400">Preferences saved.</p>}
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
  )
}
