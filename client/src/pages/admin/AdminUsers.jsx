import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../../config/env'

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    fetchUsers()
  }, [search, statusFilter, roleFilter, pagination.page])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('kaam247_token')
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      if (search) params.append('search', search)
      if (statusFilter) params.append('status', statusFilter)
      if (roleFilter) params.append('role', roleFilter)

      const response = await fetch(`${API_BASE_URL}/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.users || [])
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0
      }))
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
      blocked: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
      banned: 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
    }
    return badges[status] || badges.active
  }

  if (loading && users.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
        </div>
        <div className="space-y-3 md:hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 animate-pulse">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-3"></div>
              <div className="flex gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-1"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-8"></div>
                </div>
                <div className="flex-1">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 mb-1"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
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
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 sm:mb-3 leading-tight break-words">Users</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed break-words">Manage and monitor all users</p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-4 sm:p-5 lg:p-6 mb-5 sm:mb-6 lg:mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              placeholder="Name, email, or phone"
              className="w-full px-4 sm:px-5 py-3 sm:py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors min-h-[48px] sm:min-h-[52px]"
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="w-full px-4 sm:px-5 py-3 sm:py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors min-h-[48px] sm:min-h-[52px] touch-manipulation"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="banned">Banned</option>
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wide">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="w-full px-4 sm:px-5 py-3 sm:py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 text-sm sm:text-base transition-colors min-h-[48px] sm:min-h-[52px] touch-manipulation"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users - Mobile Cards / Desktop Table */}
      {error ? (
        <div className="text-center py-12 sm:py-16 lg:py-20">
          <p className="text-sm sm:text-base text-red-600 dark:text-red-400 leading-relaxed">{error}</p>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-12 sm:p-16 lg:p-20 text-center">
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">No users found</p>
        </div>
      ) : (
        <>
          {/* Mobile: Card Layout */}
          <div className="md:hidden space-y-3 sm:space-y-4 w-full">
            {users.map((user) => (
              <Link
                key={user._id}
                to={`/admin/users/${user._id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md dark:hover:shadow-gray-900/50 transition-all duration-200 active:scale-[0.98] w-full overflow-hidden touch-manipulation"
              >
                <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2 w-full min-w-0">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 mb-1.5 sm:mb-2 leading-tight break-words">
                      {user.name}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 break-words leading-relaxed">{user.email}</p>
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 break-words leading-relaxed">{user.phone}</p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border flex-shrink-0 ${getStatusBadge(user.status)}`}>
                    {user.status || 'active'}
                  </span>
                </div>
                <div className="flex items-center gap-4 sm:gap-5 pt-3 sm:pt-4 border-t border-gray-100 dark:border-gray-700 w-full">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Tasks Completed</p>
                    <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100">{user.stats?.tasksCompleted || 0}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">Rating</p>
                    <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 break-words">
                      {user.stats?.averageRating ? `${user.stats.averageRating.toFixed(1)} ⭐` : 'N/A'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop: Table Layout */}
          <div className="hidden md:block bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Name
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Email
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Phone
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Tasks Completed
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                      Rating
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user) => (
                    <tr
                      key={user._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Link
                          to={`/admin/users/${user._id}`}
                          className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-relaxed"
                        >
                          {user.name}
                        </Link>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                        {user.email}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                        {user.phone}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border ${getStatusBadge(user.status)}`}>
                          {user.status || 'active'}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
                        {user.stats?.tasksCompleted || 0}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 leading-relaxed">
                        {user.stats?.averageRating ? `${user.stats.averageRating.toFixed(1)} ⭐` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm sm:text-base text-gray-600 dark:text-gray-400 text-center sm:text-left leading-relaxed">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-5 sm:px-6 py-3 sm:py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] sm:min-h-[52px] touch-manipulation transition-all duration-200 active:scale-[0.98] disabled:active:scale-100"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                  className="px-5 sm:px-6 py-3 sm:py-3.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] sm:min-h-[52px] touch-manipulation transition-all duration-200 active:scale-[0.98] disabled:active:scale-100"
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

export default AdminUsers

