import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { API_BASE_URL } from '../../config/env'
import AdminConfirmModal from '../../components/admin/AdminConfirmModal'
import AdminToast from '../../components/admin/AdminToast'

function AdminTaskDetail() {
  const { taskId } = useParams()
  const [task, setTask] = useState(null)
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [modalState, setModalState] = useState({ isOpen: false, type: null })
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' })

  useEffect(() => {
    fetchTaskDetails()
  }, [taskId])

  const fetchTaskDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/admin/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || `Failed to fetch task details (${response.status})`)
      }

      const data = await response.json()
      if (data.task) {
        setTask(data.task)
      } else {
        throw new Error('Task data not found in response')
      }
      if (data.timeline) {
        setTimeline(data.timeline || [])
      }
    } catch (err) {
      setError(err.message || 'Failed to load task details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      SEARCHING: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      ACCEPTED: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      IN_PROGRESS: 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800',
      COMPLETED: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800',
      CANCELLED: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800',
      CANCELLED_BY_ADMIN: 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
    }
    return badges[status] || badges.SEARCHING
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

  const showToast = (message, type = 'success') => {
    setToast({ isVisible: true, message, type })
  }

  const handleForceCancel = async () => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/admin/tasks/${taskId}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Failed to cancel task')
      }

      showToast('Task cancelled successfully', 'success')
      setModalState({ isOpen: false, type: null })
      fetchTaskDetails()
    } catch (err) {
      showToast(err.message || 'Failed to cancel task', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUnassignWorker = async () => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/admin/tasks/${taskId}/unassign`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Failed to unassign worker')
      }

      showToast('Worker unassigned successfully', 'success')
      setModalState({ isOpen: false, type: null })
      fetchTaskDetails()
    } catch (err) {
      showToast(err.message || 'Failed to unassign worker', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleHide = async () => {
    setActionLoading(true)
    try {
      const token = localStorage.getItem('kaam247_token')
      const response = await fetch(`${API_BASE_URL}/api/admin/tasks/${taskId}/hide`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to toggle task visibility')
      }

      showToast(task.isHidden ? 'Task made visible' : 'Task hidden successfully', 'success')
      fetchTaskDetails()
    } catch (err) {
      showToast(err.message || 'Failed to toggle task visibility', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading task details...</p>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error || 'Task not found'}</p>
        <Link
          to="/admin/tasks"
          className="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          ← Back to Tasks
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/admin/tasks"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium mb-4 inline-block"
        >
          ← Back to Tasks
        </Link>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{task.title}</h1>
        <p className="text-gray-600 dark:text-gray-400">Task details and timeline</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Task Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{task.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Budget</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">₹{task.budget}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border mt-1 ${getStatusBadge(task.status)}`}>
                  {task.status}
                </span>
              </div>
              {task.location && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Location</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {task.location.area}, {task.location.city}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Posted at</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(task.createdAt)}</p>
              </div>
              {task.expectedDuration && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Expected Duration</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.expectedDuration} hours</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          {timeline.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Timeline</h2>
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{event.event}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(event.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Poster */}
          {task.postedBy && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Poster</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.postedBy.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.postedBy.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.postedBy.phone}</p>
                </div>
                {task.postedBy.status && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border mt-1 ${task.postedBy.status === 'active' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                        task.postedBy.status === 'blocked' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' :
                          'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                      }`}>
                      {task.postedBy.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Worker */}
          {task.acceptedBy && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Worker</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.acceptedBy.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.acceptedBy.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.acceptedBy.phone}</p>
                </div>
                {task.acceptedBy.status && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border mt-1 ${task.acceptedBy.status === 'active' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' :
                        task.acceptedBy.status === 'blocked' ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' :
                          'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                      }`}>
                      {task.acceptedBy.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Metadata</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Created At</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(task.createdAt)}</p>
              </div>
              {task.startedAt && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Started At</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(task.startedAt)}</p>
                </div>
              )}
              {task.completedAt && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completed At</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(task.completedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Task Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Admin Task Controls</h2>
            <div className="space-y-3">
              {task.status !== 'CANCELLED' && task.status !== 'CANCELLED_BY_ADMIN' && task.status !== 'COMPLETED' && (
                <button
                  onClick={() => setModalState({ isOpen: true, type: 'cancel' })}
                  disabled={actionLoading}
                  className="w-full px-4 py-2.5 bg-red-600 dark:bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  Force Cancel Task
                </button>
              )}

              {task.acceptedBy && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && task.status !== 'CANCELLED_BY_ADMIN' && (
                <button
                  onClick={() => setModalState({ isOpen: true, type: 'unassign' })}
                  disabled={actionLoading}
                  className="w-full px-4 py-2.5 bg-orange-600 dark:bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  Unassign Worker
                </button>
              )}

              <label className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="checkbox"
                  checked={task.isHidden || false}
                  onChange={handleToggleHide}
                  disabled={actionLoading}
                  className="w-5 h-5 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50"
                />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Hide from marketplace</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modals */}
      <AdminConfirmModal
        isOpen={modalState.isOpen && modalState.type === 'cancel'}
        onClose={() => setModalState({ isOpen: false, type: null })}
        onConfirm={handleForceCancel}
        title="Force cancel this task?"
        message="This will cancel the task regardless of its state. Both poster and worker will be notified."
        confirmText="Force Cancel"
        confirmColor="red"
        loading={actionLoading}
      />

      <AdminConfirmModal
        isOpen={modalState.isOpen && modalState.type === 'unassign'}
        onClose={() => setModalState({ isOpen: false, type: null })}
        onConfirm={handleUnassignWorker}
        title="Unassign worker from this task?"
        message="This will remove the worker and set the task back to OPEN status. The worker will not receive a cancellation penalty."
        confirmText="Unassign Worker"
        confirmColor="orange"
        loading={actionLoading}
      />

      {/* Toast Notification */}
      <AdminToast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={() => setToast({ ...toast, isVisible: false })}
      />
    </div>
  )
}

export default AdminTaskDetail

