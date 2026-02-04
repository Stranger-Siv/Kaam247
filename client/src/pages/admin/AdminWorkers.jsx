import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../../config/env'

function AdminWorkers() {
  const [workers, setWorkers] = useState([])
  const [onlineCount, setOnlineCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [onlineOnly, setOnlineOnly] = useState(false)
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
    fetchWorkers()
  }, [])

  const fetchWorkers = async () => {
    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/admin/workers`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch workers')
      const data = await response.json()
      setWorkers(data.workers || [])
      setOnlineCount(data.onlineCount ?? 0)
    } catch (err) {
      setError(err.message || 'Failed to load workers')
    } finally {
      setLoading(false)
    }
  }

  const filteredWorkers = useMemo(() => {
    let list = workers
    if (onlineOnly) list = list.filter((w) => w.isOnline)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(
        (w) =>
          (w.name && w.name.toLowerCase().includes(q)) ||
          (w.email && w.email.toLowerCase().includes(q)) ||
          (w.phone && String(w.phone).includes(q))
      )
    }
    return list
  }, [workers, onlineOnly, search])

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
      blocked: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
      banned: 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
    }
    return badges[status] || badges.active
  }

  const formatLocation = (loc) => {
    if (!loc) return '—'
    const { area, city, lat, lng } = loc
    if (area || city) return [area, city].filter(Boolean).join(', ')
    if (lat != null && lng != null) return `Live (${Number(lat).toFixed(2)}, ${Number(lng).toFixed(2)})`
    return '—'
  }

  if (loading && workers.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse" />
        </div>
        <div className="space-y-3 md:hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3" />
              <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8" />
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
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
          Workers
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed break-words">
          Users who have accepted at least one task. {onlineCount} online now.
        </p>
      </div>

      {/* Filter icon + dropdown */}
      <div className="mb-5 sm:mb-6 lg:mb-8 relative inline-block" ref={filterRef}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setFilterOpen((o) => !o) }}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${search.trim() || onlineOnly
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
          {(search.trim() || onlineOnly) && (
            <span className="ml-1 w-2 h-2 rounded-full bg-blue-500" aria-hidden />
          )}
        </button>
        {filterOpen && (
          <div className="absolute left-0 top-full mt-1 z-50 w-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg py-4 px-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Search</label>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name, email, or phone"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={onlineOnly}
                  onChange={(e) => setOnlineOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:bg-gray-700"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Online only</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {error ? (
        <div className="text-center py-12 sm:py-16 lg:py-20">
          <p className="text-sm sm:text-base text-red-600 dark:text-red-400 leading-relaxed">{error}</p>
        </div>
      ) : filteredWorkers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-12 sm:p-16 lg:p-20 text-center">
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            No workers found{onlineOnly || search ? ' matching filters' : ''}.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile: Card Layout */}
          <div className="md:hidden space-y-3 sm:space-y-4 w-full">
            {filteredWorkers.map((w) => (
              <Link
                key={w._id}
                to={`/admin/users/${w._id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md dark:hover:shadow-gray-900/50 transition-all duration-200 active:scale-[0.98] w-full overflow-hidden touch-manipulation"
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2 w-full min-w-0">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2 leading-tight break-words">
                      {w.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{w.email || w.phone}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {w.isOnline && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                        Online
                      </span>
                    )}
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border ${getStatusBadge(w.status)}`}>
                      {w.status || 'active'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700 w-full text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Accepted / Done</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{w.tasksAccepted} / {w.tasksCompleted}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Completion %</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{w.completionRate ?? 0}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Earnings</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">₹{Number(w.totalEarnings || 0).toLocaleString()}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Rating</p>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      {w.averageRating != null ? `${Number(w.averageRating).toFixed(1)} ⭐ (${w.totalRatings || 0})` : 'N/A'}
                    </p>
                  </div>
                  {w.location && (
                    <div className="col-span-2 sm:col-span-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Location</p>
                      <p className="text-gray-700 dark:text-gray-300">{formatLocation(w.location)}</p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: Table */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Name</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Email / Phone</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Online</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Location</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Accepted / Done</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Completion %</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Earnings</th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Rating</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredWorkers.map((w) => (
                    <tr key={w._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Link
                          to={`/admin/users/${w._id}`}
                          className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          {w.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {w.email || '—'} / {w.phone || '—'}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${getStatusBadge(w.status)}`}>
                          {w.status || 'active'}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {w.isOnline ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400">
                            Online
                          </span>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatLocation(w.location)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {w.tasksAccepted} / {w.tasksCompleted}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {w.completionRate ?? 0}%
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        ₹{Number(w.totalEarnings || 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        {w.averageRating != null ? `${Number(w.averageRating).toFixed(1)} ⭐ (${w.totalRatings || 0})` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredWorkers.length} worker{filteredWorkers.length !== 1 ? 's' : ''}. View user to Block, Unblock, or adjust limits.
          </p>
        </>
      )}
    </div>
  )
}

export default AdminWorkers
