import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/env'

function RecurringModal({ task, isOpen, onClose, onSuccess }) {
  const [frequency, setFrequency] = useState('weekly')
  const [paused, setPaused] = useState(false)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (task && isOpen) {
      setFrequency(task.recurringSchedule?.frequency || 'weekly')
      setPaused(!!task.recurringSchedule?.paused)
      setError(null)
      setIsSubmitting(false)
    }
  }, [task, isOpen])

  if (!isOpen || !task) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem('kaam247_token')
      const user = JSON.parse(localStorage.getItem('kaam247_user') || 'null')
      if (!token || !user?.id) throw new Error('You must be logged in')

      const res = await fetch(`${API_BASE_URL}/api/tasks/${task.id}/recurring`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          posterId: user.id,
          frequency: ['daily', 'weekly', 'monthly'].includes(frequency) ? frequency : 'weekly',
          paused
        })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to update recurring')
      }
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[2100] bg-black/50 dark:bg-black/80 flex items-center justify-center p-4 animate-modal-backdrop-in" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700 animate-modal-panel-in"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Recurring schedule</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {task.isRecurringTemplate
            ? 'Update how often a new task is created from this template.'
            : 'Create a new task from this one automatically on a schedule.'}
        </p>
        {error && (
          <div className="mb-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Frequency</label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          {task.isRecurringTemplate && (
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={paused}
                onChange={(e) => setPaused(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Pause recurring</span>
            </label>
          )}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 font-medium disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving…' : task.isRecurringTemplate ? 'Update' : 'Enable recurring'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RecurringModal
