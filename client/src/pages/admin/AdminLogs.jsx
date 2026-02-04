import { useState, useEffect, useRef } from 'react'
import { API_BASE_URL } from '../../config/env'

function AdminLogs() {
  const [logs, setLogs] = useState([])
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [resourceFilter, setResourceFilter] = useState('')
  const [adminIdFilter, setAdminIdFilter] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    if (filterOpen) document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [filterOpen])

  useEffect(() => {
    fetchLogs()
  }, [pagination.page, resourceFilter, adminIdFilter])

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('kaam247_token')
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })
      if (resourceFilter.trim()) params.append('resource', resourceFilter.trim())
      if (adminIdFilter.trim()) params.append('adminId', adminIdFilter.trim())
      const response = await fetch(`${API_BASE_URL}/api/admin/logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch logs')
      const data = await response.json()
      setLogs(data.logs || [])
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total ?? 0,
        pages: data.pagination?.pages ?? 0
      }))
    } catch (err) {
      setError(err.message || 'Failed to load logs')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (d) => (d ? new Date(d).toLocaleString() : '—')

  if (loading && logs.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="mb-6 sm:mb-8 lg:mb-10">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 leading-tight break-words">
          Admin logs
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed break-words">
          Admin action logs (resource and admin filters).
        </p>
      </div>

      {/* Filter icon + dropdown */}
      <div
        className="mb-6 relative block w-full max-w-md"
        ref={filterRef}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setFilterOpen((o) => !o) }}
          className={`flex items-center justify-between md:justify-start gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors w-full md:w-auto ${resourceFilter.trim() || adminIdFilter.trim()
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
          {(resourceFilter.trim() || adminIdFilter.trim()) && (
            <span className="ml-1 w-2 h-2 rounded-full bg-blue-500" aria-hidden />
          )}
        </button>
        {filterOpen && (
          <div className="absolute left-0 top-full mt-1 z-50 w-full sm:w-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg py-4 px-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Resource</label>
                <input
                  type="text"
                  value={resourceFilter}
                  onChange={(e) => { setResourceFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })) }}
                  placeholder="e.g. user, task"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Admin ID</label>
                <input
                  type="text"
                  value={adminIdFilter}
                  onChange={(e) => { setAdminIdFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })) }}
                  placeholder="Filter by admin user ID"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {error ? (
        <div className="text-center py-12">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">No logs found.</p>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Time</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Admin</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Action</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Resource</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Resource ID</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(log.createdAt)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {log.adminId?.name ?? log.adminId ?? '—'} {log.adminId?.email ? `(${log.adminId.email})` : ''}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {log.action ?? '—'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {log.resource ?? '—'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 font-mono truncate max-w-[120px]">
                        {log.resourceId ?? '—'}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {log.details != null ? (typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.pages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default AdminLogs
