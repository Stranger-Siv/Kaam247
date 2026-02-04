import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { API_BASE_URL } from '../../config/env'
import AdminConfirmModal from '../../components/admin/AdminConfirmModal'
import AdminToast from '../../components/admin/AdminToast'

function AdminReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('open')
  const [reasonFilter, setReasonFilter] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const filterRef = useRef(null)
  const [selectedReport, setSelectedReport] = useState(null)
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [isResolving, setIsResolving] = useState(false)
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    if (filterOpen) document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [filterOpen])

  useEffect(() => {
    fetchReports()
  }, [statusFilter, reasonFilter, pagination.page])

  const fetchReports = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('kaam247_token')
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter
      })
      if (reasonFilter) {
        params.append('reason', reasonFilter)
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch reports')
      }

      const data = await response.json()
      setReports(data.reports || [])
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        pages: data.pagination?.pages || 0
      }))
    } catch (err) {
      setError(err.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }

  const handleResolveReport = async () => {
    if (!selectedReport) return

    setIsResolving(true)
    try {
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/admin/reports/${selectedReport._id}/resolve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to resolve report')
      }

      showToast('Report resolved successfully', 'success')
      setShowResolveModal(false)
      setSelectedReport(null)
      fetchReports()
    } catch (err) {
      showToast(err.message || 'Failed to resolve report', 'error')
    } finally {
      setIsResolving(false)
    }
  }

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type })
    setTimeout(() => {
      setToast({ isVisible: false, message: '', type: 'success' })
    }, 3000)
  }

  const getStatusBadge = (status) => {
    const badges = {
      open: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      resolved: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'
    }
    return badges[status] || badges.open
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  if (loading && reports.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-3"></div>
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full sm:w-32"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2 break-words">Reports</h1>
        <p className="text-gray-600 dark:text-gray-400 break-words">Review and manage user reports</p>
      </div>

      {/* Filter icon + dropdown */}
      <div
        className="mb-4 sm:mb-6 relative inline-block w-full max-w-xs sm:max-w-sm md:w-auto"
        ref={filterRef}
      >
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setFilterOpen((o) => !o) }}
          className={`flex items-center justify-between md:justify-start gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors w-full md:w-auto ${reasonFilter || statusFilter !== 'open'
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
          {(reasonFilter || statusFilter !== 'open') && (
            <span className="ml-1 w-2 h-2 rounded-full bg-blue-500" aria-hidden />
          )}
        </button>
        {filterOpen && (
          <div className="absolute left-0 top-full mt-1 z-50 w-full sm:w-72 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg py-4 px-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })) }}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="open">Open</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Reason</label>
                <select
                  value={reasonFilter}
                  onChange={(e) => { setReasonFilter(e.target.value); setPagination(prev => ({ ...prev, page: 1 })) }}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Reasons</option>
                  <option value="Fake or misleading task">Fake or misleading task</option>
                  <option value="User not responding">User not responding</option>
                  <option value="Inappropriate content">Inappropriate content</option>
                  <option value="Safety concern">Safety concern</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reports List */}
      {error ? (
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">No reports found</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <>
          <div className="space-y-4 w-full">
            {reports.map((report) => (
              <div
                key={report._id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow active:bg-gray-50 dark:active:bg-gray-700 w-full overflow-hidden"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 w-full">
                  <div className="flex-1 space-y-4 min-w-0 w-full">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getStatusBadge(report.status)}`}>
                        {report.status === 'open' ? 'Open' : 'Resolved'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(report.createdAt)}</span>
                      {report.reporter && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 break-words">
                          Reported by: {report.reporter.name || report.reporter.email}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                      {report.reportedUser && (
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Reported User</p>
                          <Link
                            to={`/admin/users/${report.reportedUser._id}`}
                            className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors break-words block"
                          >
                            {report.reportedUser.name || 'N/A'}
                          </Link>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 break-words">{report.reportedUser.email}</p>
                        </div>
                      )}

                      {report.reportedTask && (
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Reported Task</p>
                          <Link
                            to={`/admin/tasks/${report.reportedTask._id}`}
                            className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors break-words block"
                          >
                            {report.reportedTask.title}
                          </Link>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 break-words">Status: {report.reportedTask.status}</p>
                        </div>
                      )}
                    </div>

                    {/* Reason */}
                    <div className="w-full min-w-0">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Reason</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{report.reason}</p>
                    </div>

                    {/* Description */}
                    {report.description && (
                      <div className="w-full min-w-0">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Description</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 break-words">{report.description}</p>
                      </div>
                    )}

                    {/* Resolution Info */}
                    {report.status === 'resolved' && (
                      <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        {report.resolvedBy && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Resolved by {report.resolvedBy.name} on {formatDate(report.resolvedAt)}
                          </p>
                        )}
                        {report.adminNotes && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{report.adminNotes}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  {report.status === 'open' && (
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => {
                          setSelectedReport(report)
                          setShowResolveModal(true)
                        }}
                        className="px-4 py-2.5 bg-green-600 dark:bg-green-500 text-white text-sm font-medium rounded-lg hover:bg-green-700 dark:hover:bg-green-600 active:bg-green-800 dark:active:bg-green-700 transition-colors min-h-[44px] w-full md:w-auto touch-manipulation"
                      >
                        Mark as Resolved
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} reports
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Resolve Modal */}
      <AdminConfirmModal
        isOpen={showResolveModal}
        onClose={() => {
          setShowResolveModal(false)
          setSelectedReport(null)
        }}
        onConfirm={handleResolveReport}
        title="Mark report as resolved?"
        message="This will mark the report as resolved. You can add admin notes if needed."
        confirmText="Mark Resolved"
        confirmColor="green"
        loading={isResolving}
      />

      {/* Toast */}
      <AdminToast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
      />
    </div>
  )
}

export default AdminReports
