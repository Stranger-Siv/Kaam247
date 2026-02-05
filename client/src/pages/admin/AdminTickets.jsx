import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../../config/env'

function AdminTickets() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)
  const [resolvingId, setResolvingId] = useState(null)
  const [resolveForm, setResolveForm] = useState({ newPhone: '', adminNotes: '', action: 'RESOLVED' })
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    if (filterOpen) document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [filterOpen])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('kaam247_token')
      const params = new URLSearchParams()
      params.set('page', String(pagination.page))
      params.set('limit', String(pagination.limit))
      if (statusFilter) params.set('status', statusFilter)
      if (typeFilter) params.set('type', typeFilter)
      const url = `${API_BASE_URL}/api/admin/tickets?${params}`
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Failed to fetch tickets')
      setTickets(data.tickets || [])
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total ?? 0,
        pages: data.pagination?.pages ?? 0
      }))
    } catch (err) {
      setError(err.message || 'Failed to load tickets')
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [statusFilter, typeFilter])

  useEffect(() => {
    fetchTickets()
  }, [statusFilter, typeFilter, pagination.page])

  const handleResolve = async (ticketId, actionOverride) => {
    const action = actionOverride || resolveForm.action
    const digits = (resolveForm.newPhone || '').replace(/\D/g, '')
    if (action === 'RESOLVED' && digits.length !== 10) {
      setError('Enter a valid 10-digit phone to resolve.')
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
        <p className="text-gray-600 dark:text-gray-400">Support chat tickets and phone change requests.</p>
      </div>

      <div
        className="mb-4 relative block w-full max-w-md"
        ref={filterRef}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setFilterOpen((o) => !o) }}
          className={`flex items-center justify-between md:justify-start gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors w-full md:w-auto ${statusFilter || typeFilter
            ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          aria-label="Filters"
          aria-expanded={filterOpen}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter
          {(statusFilter || typeFilter) && (
            <span className="ml-1 w-2 h-2 rounded-full bg-blue-500" aria-hidden />
          )}
        </button>
        {filterOpen && (
          <div className="absolute left-0 top-full mt-1 z-50 w-full sm:w-72 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg py-3 px-4">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Status</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {['', 'PENDING', 'OPEN', 'ACCEPTED', 'RESOLVED', 'REJECTED'].map((s) => (
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
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Type</p>
            <div className="flex flex-wrap gap-2">
              {['', 'SUPPORT', 'MOBILE_UPDATE'].map((t) => (
                <button
                  key={t || 'all'}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${typeFilter === t
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  {t || 'All'}
                </button>
              ))}
            </div>
          </div>
        )}
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
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${t.status === 'PENDING' || t.status === 'OPEN' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200' :
                      t.status === 'ACCEPTED' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200' :
                        t.status === 'RESOLVED' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' :
                          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                      {t.status}
                    </span>
                  </div>
                  {t.type === 'SUPPORT' ? (
                    <>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{t.subject || 'Support'}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        User: {t.user?.name} ({t.user?.email})
                      </p>
                      {t.initialMessage && (
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 line-clamp-2">{t.initialMessage}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        User: {t.user?.name} ({t.user?.email}) — Current phone: {t.user?.phone || '—'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Requested: <strong>{t.requestedPhone || '—'}</strong>
                        {t.reason && ` · Reason: ${t.reason}`}
                      </p>
                    </>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Created {formatDate(t.createdAt)}</p>
                  {t.resolvedAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">Resolved {formatDate(t.resolvedAt)}</p>
                  )}
                  {t.adminNotes && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Admin: {t.adminNotes}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {t.user?._id && (
                    <Link
                      to={`/admin/users/${t.user._id}`}
                      className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"
                    >
                      View user
                    </Link>
                  )}
                  {t.type === 'SUPPORT' && (
                    <Link
                      to={`/admin/tickets/${t._id}`}
                      className="px-3 py-1.5 text-sm font-medium bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600"
                    >
                      {t.status === 'OPEN' ? 'Accept & chat' : 'View chat'}
                    </Link>
                  )}
                  {t.type === 'MOBILE_UPDATE' && t.status === 'PENDING' && (
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

      {/* Pagination */}
      {!error && tickets.length > 0 && pagination.pages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tickets
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="px-5 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.pages}
              className="px-5 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminTickets
