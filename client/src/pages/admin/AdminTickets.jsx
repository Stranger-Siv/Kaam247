import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../../config/env'

function AdminTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [resolvingId, setResolvingId] = useState(null)
  const [resolveForm, setResolveForm] = useState({ newPhone: '', adminNotes: '', action: 'RESOLVED' })

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('kaam247_token')
      const url = statusFilter
        ? `${API_BASE_URL}/api/admin/tickets?status=${statusFilter}`
        : `${API_BASE_URL}/api/admin/tickets`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Failed to fetch tickets')
      setTickets(data.tickets || [])
    } catch (err) {
      setError(err.message || 'Failed to load tickets')
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [statusFilter])

  const handleResolve = async (ticketId, actionOverride) => {
    const action = actionOverride || resolveForm.action
    const digits = (resolveForm.newPhone || '').replace(/\D/g, '')
    if (action === 'RESOLVED' && digits.length !== 10) {
      setError('Enter a valid 10-digit mobile number to resolve.')
      return
    }
    setResolvingId(ticketId)
    setError(null)
    try {
      const token = localStorage.getItem('kaam247_token')
      const res = await fetch(`${API_BASE_URL}/api/admin/tickets/${ticketId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          status: action,
          newPhone: digits || undefined,
          adminNotes: (resolveForm.adminNotes || '').trim()
        })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Failed to resolve')
      setResolvingId(null)
      setResolveForm({ newPhone: '', adminNotes: '', action: 'RESOLVED' })
      fetchTickets()
    } catch (err) {
      setError(err.message || 'Failed to resolve ticket')
    } finally {
      setResolvingId(null)
    }
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Support tickets</h1>
        <p className="text-gray-600 dark:text-gray-400">Mobile number change requests. Resolve to update the user&apos;s phone.</p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Filter:</span>
        {['', 'PENDING', 'RESOLVED', 'REJECTED'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium ${statusFilter === s
              ? 'bg-blue-600 dark:bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">Loading tickets...</div>
      ) : tickets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center text-gray-500 dark:text-gray-400">
          No tickets found.
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((t) => (
            <div
              key={t._id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">{t.type}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.status === 'PENDING' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200' :
                        t.status === 'RESOLVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    User: {t.user?.name} ({t.user?.email}) — Current phone: {t.user?.phone || '—'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Requested: <strong>{t.requestedPhone || '—'}</strong>
                    {t.reason && ` · Reason: ${t.reason}`}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Created {formatDate(t.createdAt)}</p>
                  {t.resolvedAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">Resolved {formatDate(t.resolvedAt)}</p>
                  )}
                  {t.adminNotes && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Admin: {t.adminNotes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {t.user?._id && (
                    <Link
                      to={`/admin/users/${t.user._id}`}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                    >
                      View user
                    </Link>
                  )}
                  {t.status === 'PENDING' && (
                    <div className="flex flex-col gap-2">
                      <input
                        type="tel"
                        placeholder="New 10-digit number"
                        value={resolvingId === t._id ? resolveForm.newPhone : ''}
                        onChange={(e) => setResolveForm(prev => ({ ...prev, newPhone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                        onFocus={() => {
                          setResolvingId(t._id)
                          setResolveForm(prev => ({ ...prev, newPhone: t.requestedPhone || '', adminNotes: '' }))
                        }}
                        className="w-36 px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
                        maxLength={10}
                      />
                      <input
                        type="text"
                        placeholder="Admin notes (optional)"
                        value={resolvingId === t._id ? resolveForm.adminNotes : ''}
                        onChange={(e) => setResolveForm(prev => ({ ...prev, adminNotes: e.target.value }))}
                        onFocus={() => {
                          setResolvingId(t._id)
                          setResolveForm(prev => ({ ...prev, newPhone: t.requestedPhone || '' }))
                        }}
                        className="w-48 px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleResolve(t._id)}
                          disabled={resolvingId === t._id && (resolveForm.newPhone || '').replace(/\D/g, '').length !== 10}
                          className="px-3 py-1.5 bg-green-600 dark:bg-green-500 text-white text-sm font-medium rounded hover:bg-green-700 dark:hover:bg-green-600 disabled:opacity-50"
                        >
                          Resolve & update phone
                        </button>
                        <button
                          onClick={() => handleResolve(t._id, 'REJECTED')}
                          className="px-3 py-1.5 bg-gray-500 dark:bg-gray-600 text-white text-sm font-medium rounded hover:bg-gray-600 dark:hover:bg-gray-700"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminTickets
