import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { API_BASE_URL } from '../../config/env'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function SettingsAvailability() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [availabilitySchedule, setAvailabilitySchedule] = useState({ enabled: false, slots: [] })
  const [availabilitySaving, setAvailabilitySaving] = useState(false)
  const [availabilityError, setAvailabilityError] = useState(null)

  useEffect(() => {
    const fetchSchedule = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }
      try {
        const token = localStorage.getItem('kaam247_token')
        const res = await fetch(`${API_BASE_URL}/api/users/me/availability-schedule`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setAvailabilitySchedule(data.schedule || { enabled: false, slots: [] })
        }
      } catch (e) { }
      setLoading(false)
    }
    fetchSchedule()
  }, [user?.id])

  const handleSaveAvailabilitySchedule = async () => {
    if (!user?.id) return
    setAvailabilitySaving(true)
    setAvailabilityError(null)
    try {
      const token = localStorage.getItem('kaam247_token')
      const res = await fetch(`${API_BASE_URL}/api/users/me/availability-schedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(availabilitySchedule)
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to save schedule')
      }
    } catch (err) {
      setAvailabilityError(err.message)
    } finally {
      setAvailabilitySaving(false)
    }
  }

  if (loading) {
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
        Availability schedule
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Set when you're typically available. You can still go ON DUTY / OFF DUTY manually; this is for reference or future auto-off.
      </p>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={availabilitySchedule.enabled}
              onChange={(e) => setAvailabilitySchedule(prev => ({ ...prev, enabled: e.target.checked }))}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Use schedule</span>
          </label>
          <div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Slots (day, start, end)</p>
            {(availabilitySchedule.slots || []).map((slot, idx) => (
              <div key={idx} className="flex flex-wrap items-center gap-2 mb-2">
                <select
                  value={slot.dayOfWeek}
                  onChange={(e) => {
                    const next = [...(availabilitySchedule.slots || [])]
                    next[idx] = { ...next[idx], dayOfWeek: Number(e.target.value) }
                    setAvailabilitySchedule(prev => ({ ...prev, slots: next }))
                  }}
                  className="h-9 px-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                >
                  {DAY_NAMES.map((d, i) => (
                    <option key={i} value={i}>{d}</option>
                  ))}
                </select>
                <input
                  type="time"
                  value={slot.startTime || '09:00'}
                  onChange={(e) => {
                    const next = [...(availabilitySchedule.slots || [])]
                    next[idx] = { ...next[idx], startTime: e.target.value }
                    setAvailabilitySchedule(prev => ({ ...prev, slots: next }))
                  }}
                  className="h-9 px-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                />
                <input
                  type="time"
                  value={slot.endTime || '17:00'}
                  onChange={(e) => {
                    const next = [...(availabilitySchedule.slots || [])]
                    next[idx] = { ...next[idx], endTime: e.target.value }
                    setAvailabilitySchedule(prev => ({ ...prev, slots: next }))
                  }}
                  className="h-9 px-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setAvailabilitySchedule(prev => ({ ...prev, slots: (prev.slots || []).filter((_, i) => i !== idx) }))}
                  className="text-red-600 dark:text-red-400 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setAvailabilitySchedule(prev => ({ ...prev, slots: [...(prev.slots || []), { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' }] }))}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              + Add slot
            </button>
          </div>
          {availabilityError && <p className="text-sm text-red-600 dark:text-red-400">{availabilityError}</p>}
          <button
            type="button"
            onClick={handleSaveAvailabilitySchedule}
            disabled={availabilitySaving}
            className="h-11 px-5 bg-blue-600 dark:bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
          >
            {availabilitySaving ? 'Saving...' : 'Save schedule'}
          </button>
        </div>
      </div>
    </div>
  )
}
