import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { API_BASE_URL } from '../../config/env'

export default function SettingsAccount() {
  const { user } = useAuth()
  const [ticketRequestedPhone, setTicketRequestedPhone] = useState('')
  const [ticketReason, setTicketReason] = useState('')
  const [ticketSubmitting, setTicketSubmitting] = useState(false)
  const [ticketError, setTicketError] = useState(null)
  const [ticketSuccess, setTicketSuccess] = useState(false)

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
      setTimeout(() => setTicketSuccess(false), 2000)
    } catch (err) {
      setTicketError(err.message || 'Failed to submit. Try again.')
    } finally {
      setTicketSubmitting(false)
    }
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
        Account
      </h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Request a phone number change. For security reasons, phone numbers can't be changed directly; our team will review your request.
      </p>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-3">Request phone number change</h2>
        <form onSubmit={handleSubmitTicket} className="space-y-4 sm:space-y-5 max-w-md">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">New phone number</label>
            <input
              type="tel"
              value={ticketRequestedPhone}
              onChange={(e) => setTicketRequestedPhone(e.target.value)}
              placeholder="Enter 10-digit phone"
              className="w-full h-11 px-4 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Reason (optional)</label>
            <textarea
              value={ticketReason}
              onChange={(e) => setTicketReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 text-sm"
              placeholder="Add any details that can help us verify this request"
            />
          </div>
          {ticketError && <p className="text-sm text-red-600 dark:text-red-400">{ticketError}</p>}
          {ticketSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400">Request submitted. We'll review it shortly.</p>
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
  )
}
