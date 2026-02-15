import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/env'
import ConfirmationModal from './ConfirmationModal'

function ExtendValidityModal({ task, isOpen, onClose, onSuccess }) {
  const [validForDays, setValidForDays] = useState(7)
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  useEffect(() => {
    if (task && isOpen) {
      setValidForDays(7)
      setError(null)
      setIsSubmitting(false)
      setShowConfirmModal(false)
    }
  }, [task, isOpen])

  if (!isOpen || !task) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)
    const days = Number(validForDays)
    if (!days || days < 1 || days > 14) {
      setError('Please enter a number between 1 and 14 days')
      return
    }
    setShowConfirmModal(true)
  }

  const confirmExtend = async () => {
    setShowConfirmModal(false)
    setIsSubmitting(true)
    setError(null)

    try {
      const token = localStorage.getItem('kaam247_token')
      if (!token) throw new Error('You must be logged in')
      const user = JSON.parse(localStorage.getItem('kaam247_user') || 'null')
      if (!user?.id) throw new Error('User ID not found')

      const response = await fetch(`${API_BASE_URL}/api/tasks/${task.id}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          posterId: user.id,
          validForDays: Number(validForDays)
        })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to extend validity')
      }

      const data = await response.json()
      if (onSuccess) onSuccess(data.task)
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to extend validity. Please try again.')
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
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Extend Validity</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          How many days from today should this task stay listed?
        </p>

        {error && (
          <div className="mb-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Days (1–14)
            </label>
            <input
              type="number"
              min={1}
              max={14}
              value={validForDays}
              onChange={(e) => setValidForDays(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating…' : 'Extend Validity'}
            </button>
          </div>
        </form>

        <ConfirmationModal
          isOpen={showConfirmModal}
          onConfirm={confirmExtend}
          onCancel={() => setShowConfirmModal(false)}
          title="Extend validity"
          message={`Extend this task listing by ${validForDays} days from today?`}
          confirmText="Yes, extend"
          cancelText="Cancel"
          confirmColor="blue"
        />
      </div>
    </div>
  )
}

export default ExtendValidityModal
