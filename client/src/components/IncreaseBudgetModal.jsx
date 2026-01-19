import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config/env'
import ConfirmationModal from './ConfirmationModal'

function IncreaseBudgetModal({ task, isOpen, onClose, onSuccess }) {
  const [newBudget, setNewBudget] = useState('')
  const [error, setError] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  useEffect(() => {
    if (task && isOpen) {
      const current = Number(task.budget) || 0
      // Default suggestion: +100
      setNewBudget(current > 0 ? String(current + 100) : '')
      setError(null)
      setIsSubmitting(false)
      setShowConfirmModal(false)
    }
  }, [task, isOpen])

  if (!isOpen || !task) return null

  const currentBudget = Number(task.budget) || 0

  const handleSubmit = (e) => {
    e.preventDefault()
    setError(null)

    const value = Number(newBudget)
    if (!value || value <= 0) {
      setError('Please enter a valid amount')
      return
    }
    if (value <= currentBudget) {
      setError(`New budget must be greater than current budget (₹${currentBudget})`)
      return
    }

    setShowConfirmModal(true)
  }

  const confirmIncrease = async () => {
    setShowConfirmModal(false)
    setIsSubmitting(true)
    setError(null)

    try {
      const token = localStorage.getItem('kaam247_token')
      if (!token) {
        throw new Error('You must be logged in to update budget')
      }

      const user = JSON.parse(localStorage.getItem('kaam247_user') || 'null')
      if (!user?.id) {
        throw new Error('User ID not found')
      }

      const response = await fetch(`${API_BASE_URL}/api/tasks/${task.id}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          posterId: user.id,
          budget: Number(newBudget),
          // Ask backend to re-alert workers (will respect 3-hour cooldown)
          shouldReAlert: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to update budget')
      }

      const data = await response.json()

      if (onSuccess) {
        onSuccess(data.task, data.reAlerted)
      }

      onClose()
    } catch (err) {
      setError(err.message || 'Failed to update budget. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[2100] bg-black/50 dark:bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">Increase Budget</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Current budget: <span className="font-semibold text-gray-900 dark:text-gray-100">₹{currentBudget}</span>
        </p>

        {error && (
          <div className="mb-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New budget (₹)
            </label>
            <input
              type="number"
              min={currentBudget + 1}
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
              placeholder={`More than ₹${currentBudget}`}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This will increase the budget for this task. Nearby workers may be notified again (if 3+ hours have passed since the last alert).
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Updating…' : 'Increase Budget'}
            </button>
          </div>
        </form>

        <ConfirmationModal
          isOpen={showConfirmModal}
          onConfirm={confirmIncrease}
          onCancel={() => setShowConfirmModal(false)}
          title="Confirm Budget Increase"
          message={`Increase budget from ₹${currentBudget} to ₹${newBudget || 0}?`}
          confirmText="Yes, Increase"
          cancelText="No, Keep Budget"
          confirmColor="blue"
        />
      </div>
    </div>
  )
}

export default IncreaseBudgetModal


