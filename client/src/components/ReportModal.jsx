import { useState } from 'react'
import { API_BASE_URL } from '../config/env'

function ReportModal({ isOpen, onClose, taskId, reportedUserId, taskTitle }) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const reportReasons = [
    'Fake or misleading task',
    'User not responding',
    'Inappropriate content',
    'Safety concern',
    'Other'
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!reason) {
      setError('Please select a reason')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportedTask: taskId || null,
          reportedUser: reportedUserId || null,
          reason,
          description: description.trim() || ''
        })
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        
        // Handle rate limit (429) or duplicate (409)
        if (response.status === 429 || response.status === 409) {
          throw new Error(data.message || data.error || 'Report limit reached or already reported.')
        }
        
        throw new Error(data.message || data.error || 'Failed to submit report')
      }

      const data = await response.json()

      setSuccess(true)
      setTimeout(() => {
        onClose()
        // Reset form
        setReason('')
        setDescription('')
        setSuccess(false)
        setError(null)
      }, 2000)
    } catch (err) {
      setError(err.message || 'Failed to submit report')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto z-50">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Report an issue</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isSubmitting}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">Report submitted</p>
              <p className="text-sm text-gray-600">Admin will review your report.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Task/User info */}
              {(taskTitle || reportedUserId) && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  {taskTitle && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Task:</span> {taskTitle}
                    </p>
                  )}
                </div>
              )}

              {/* Reason selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {reportReasons.map((r) => (
                    <label
                      key={r}
                      className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r}
                        checked={reason === r}
                        onChange={(e) => setReason(e.target.value)}
                        className="mr-3 text-blue-600 focus:ring-blue-500"
                        disabled={isSubmitting}
                      />
                      <span className="text-sm text-gray-900">{r}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    if (e.target.value.length <= 300) {
                      setDescription(e.target.value)
                    }
                  }}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Provide more details about the issue..."
                  disabled={isSubmitting}
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {description.length}/300 characters
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !reason}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportModal

