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
        console.error('Failed to fetch task details:', response.status, errorData)
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
      console.error('Error fetching task details:', err)
      setError(err.message || 'Failed to load task details')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const badges = {
      SEARCHING: 'bg-blue-50 text-blue-700 border-blue-200',
      ACCEPTED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      IN_PROGRESS: 'bg-orange-50 text-orange-700 border-orange-200',
      COMPLETED: 'bg-green-50 text-green-700 border-green-200',
      CANCELLED: 'bg-red-50 text-red-700 border-red-200',
      CANCELLED_BY_ADMIN: 'bg-gray-50 text-gray-700 border-gray-200'
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading task details...</p>
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error || 'Task not found'}</p>
        <Link
          to="/admin/tasks"
          className="mt-4 inline-block text-blue-600 hover:text-blue-700"
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
          className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block"
        >
          ← Back to Tasks
        </Link>
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">{task.title}</h1>
        <p className="text-gray-600">Task details and timeline</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Task Information</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-sm text-gray-900 mt-1">{task.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="text-sm font-medium text-gray-900">{task.category}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Budget</p>
                  <p className="text-sm font-medium text-gray-900">₹{task.budget}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border mt-1 ${getStatusBadge(task.status)}`}>
                  {task.status}
                </span>
              </div>
              {task.location && (
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="text-sm font-medium text-gray-900">
                    {task.location.area}, {task.location.city}
                  </p>
                </div>
              )}
              {task.scheduledAt && (
                <div>
                  <p className="text-sm text-gray-500">Scheduled At</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(task.scheduledAt)}</p>
                </div>
              )}
              {task.expectedDuration && (
                <div>
                  <p className="text-sm text-gray-500">Expected Duration</p>
                  <p className="text-sm font-medium text-gray-900">{task.expectedDuration} hours</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          {timeline.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h2>
              <div className="space-y-4">
                {timeline.map((event, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{event.event}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(event.timestamp)}</p>
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Poster</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">{task.postedBy.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{task.postedBy.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{task.postedBy.phone}</p>
                </div>
                {task.postedBy.status && (
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border mt-1 ${
                      task.postedBy.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                      task.postedBy.status === 'blocked' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Worker</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="text-sm font-medium text-gray-900">{task.acceptedBy.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{task.acceptedBy.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{task.acceptedBy.phone}</p>
                </div>
                {task.acceptedBy.status && (
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border mt-1 ${
                      task.acceptedBy.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' :
                      task.acceptedBy.status === 'blocked' ? 'bg-red-50 text-red-700 border-red-200' :
                      'bg-gray-50 text-gray-700 border-gray-200'
                    }`}>
                      {task.acceptedBy.status}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(task.createdAt)}</p>
              </div>
              {task.startedAt && (
                <div>
                  <p className="text-sm text-gray-500">Started At</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(task.startedAt)}</p>
                </div>
              )}
              {task.completedAt && (
                <div>
                  <p className="text-sm text-gray-500">Completed At</p>
                  <p className="text-sm font-medium text-gray-900">{formatDate(task.completedAt)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Admin Task Controls */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Admin Task Controls</h2>
            <div className="space-y-3">
              {task.status !== 'CANCELLED' && task.status !== 'CANCELLED_BY_ADMIN' && task.status !== 'COMPLETED' && (
                <button
                  onClick={() => setModalState({ isOpen: true, type: 'cancel' })}
                  disabled={actionLoading}
                  className="w-full px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  Force Cancel Task
                </button>
              )}

              {task.acceptedBy && task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && task.status !== 'CANCELLED_BY_ADMIN' && (
                <button
                  onClick={() => setModalState({ isOpen: true, type: 'unassign' })}
                  disabled={actionLoading}
                  className="w-full px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                >
                  Unassign Worker
                </button>
              )}

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={task.isHidden || false}
                  onChange={handleToggleHide}
                  disabled={actionLoading}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="text-sm font-medium text-gray-900">Hide from marketplace</span>
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

