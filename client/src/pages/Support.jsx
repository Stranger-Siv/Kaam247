import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../config/env'
import GuestView from '../components/GuestView'

function Support() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [ticketsPage, setTicketsPage] = useState(1)
  const [hasMoreTickets, setHasMoreTickets] = useState(false)
  const [loadingMoreTickets, setLoadingMoreTickets] = useState(false)

  const fetchTickets = async (page = 1, append = false) => {
    if (!user?.id) {
      setLoading(false)
      return
    }
    try {
      if (page === 1) {
        setLoading(true)
      } else {
        setLoadingMoreTickets(true)
      }
      setError(null)
      const token = localStorage.getItem('kaam247_token')
      const res = await fetch(`${API_BASE_URL}/api/users/me/tickets?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Failed to load tickets')
      const pagination = data.pagination || {}
      setHasMoreTickets(Boolean(pagination.hasMore))
      if (!append) {
        setTickets(data.tickets || [])
      } else {
        setTickets(prev => [...prev, ...(data.tickets || [])])
      }
    } catch (err) {
      setError(err.message || 'Failed to load tickets')
      if (!append) setTickets([])
    } finally {
      if (page === 1) {
        setLoading(false)
      } else {
        setLoadingMoreTickets(false)
      }
    }
  }

  useEffect(() => {
    fetchTickets(1, false)
  }, [user?.id])

  const supportTickets = tickets.filter((t) => t.type === 'SUPPORT')

  const handleCreate = async (e) => {
    e.preventDefault()
    const sub = subject.trim()
    const msg = message.trim()
    if (!sub || !msg) return
    setSubmitting(true)
    setError(null)
    setSuccess(false)
    try {
      const token = localStorage.getItem('kaam247_token')
      const res = await fetch(`${API_BASE_URL}/api/users/me/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ type: 'SUPPORT', subject: sub, message: msg })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Failed to create ticket')
      setSuccess(true)
      setSubject('')
      setMessage('')
      setShowForm(false)
      setTicketsPage(1)
      fetchTickets(1, false)
    } catch (err) {
      setError(err.message || 'Failed to create ticket')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const statusBadge = (status) => {
    const map = {
      OPEN: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200',
      ACCEPTED: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
      RESOLVED: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
      REJECTED: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
    }
    return map[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
  }

  if (!user?.id) {
    return (
      <GuestView
        title="Support"
        description="Create a ticket and chat with us to resolve any issue."
        message="Login to create a support ticket"
        returnUrl="/support"
      />
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-1">Support</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Create a ticket and chat with us to resolve any issue.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400">
          Ticket created. An admin will accept it and start a chat with you shortly.
        </div>
      )}

      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="w-full mb-6 py-3 px-4 rounded-xl bg-blue-600 dark:bg-blue-500 text-white font-medium text-sm hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
        >
          Create support ticket
        </button>
      ) : (
        <form onSubmit={handleCreate} className="mb-6 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">New ticket</h2>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value.slice(0, 200))}
            placeholder="Brief subject"
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={200}
            required
          />
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Describe your issue</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 2000))}
            placeholder="What do you need help with?"
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={2000}
            required
          />
          <div className="flex gap-2 mt-3">
            <button
              type="submit"
              disabled={submitting || !subject.trim() || !message.trim()}
              className="flex-1 py-2.5 rounded-lg bg-blue-600 dark:bg-blue-500 text-white font-medium text-sm hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create ticket'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null) }}
              className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">My support tickets</h2>
      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">Loading…</div>
      ) : supportTickets.length === 0 ? (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center text-gray-500 dark:text-gray-400 text-sm">
          No support tickets yet. Create one above to get help.
        </div>
      ) : (
        <>
          <ul className="space-y-3">
            {supportTickets.map((t) => (
              <li key={t._id}>
                <Link
                  to={`/support/${t._id}`}
                  className="block p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{t.subject || 'Support'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{formatDate(t.createdAt)}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium ${statusBadge(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {hasMoreTickets && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  const next = ticketsPage + 1
                  fetchTickets(next, true)
                  setTicketsPage(next)
                }}
                disabled={loadingMoreTickets}
                className="px-6 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 min-h-[44px]"
              >
                {loadingMoreTickets ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Support
